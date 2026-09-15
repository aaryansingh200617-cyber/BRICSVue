"""
Crossborder router — identifies real cross-border pollution transport events.
"""
from fastapi import APIRouter
from datetime import datetime
import math

from config import BRICS_COUNTRIES
from services.nasa_firms import get_all_brics_fires
from services.open_meteo import get_weather
from ai.movement_predictor import predict_movement

import time

router = APIRouter(prefix="/api/crossborder", tags=["crossborder"])

_CROSSBORDER_CACHE = {
    "data": [],
    "last_updated": 0.0
}
CROSSBORDER_TTL = 60.0

# Country centroids for proximity checks
COUNTRY_CENTROIDS = {
    code: {
        "lat": sum(c["lat"] for c in data["cities"]) / len(data["cities"]),
        "lon": sum(c["lon"] for c in data["cities"]) / len(data["cities"]),
        "name": data["name"],
        "flag": data["flag"],
    }
    for code, data in BRICS_COUNTRIES.items()
}


def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.get("")
@router.get("/")
async def get_crossborder_events():
    """
    Detect cross-border pollution transport events with 60s cache.
    For each significant fire cluster, check if wind would carry pollution
    into a different BRICS country within 24h.
    """
    now = time.time()
    if _CROSSBORDER_CACHE["data"] and (now - _CROSSBORDER_CACHE["last_updated"] < CROSSBORDER_TTL):
        return _CROSSBORDER_CACHE["data"]

    try:
        fires = await get_all_brics_fires()
    except Exception:
        fires = []

    events = []
    processed_pairs = set()

    # Group fires by country and build cluster centroids
    country_fires = {}
    for f in fires:
        if f.get("demo_mode"):
            continue
        cc = f.get("country_code", "UN")
        if cc not in country_fires:
            country_fires[cc] = []
        country_fires[cc].append(f)

    for source_code, source_fires in country_fires.items():
        if not source_fires or len(source_fires) < 3:
            continue  # Only alert on clusters of ≥3 fires

        # Cluster centroid
        cluster_lat = sum(f["latitude"] for f in source_fires) / len(source_fires)
        cluster_lon = sum(f["longitude"] for f in source_fires) / len(source_fires)

        # Get weather at the fire cluster location
        try:
            weather = await get_weather(cluster_lat, cluster_lon)
        except Exception:
            weather = {"windspeed": 10, "winddirection": 270}

        wind_speed = weather.get("windspeed", 10)
        wind_dir = weather.get("winddirection", 270)

        # Predict movement trajectory
        try:
            trajectory = predict_movement(
                cluster_lat, cluster_lon, 200, wind_speed, wind_dir, hours=24
            )
        except Exception:
            trajectory = []

        # Check which BRICS countries are in the trajectory path
        for target_code, target_centroid in COUNTRY_CENTROIDS.items():
            if target_code == source_code:
                continue
            pair_key = f"{source_code}→{target_code}"
            if pair_key in processed_pairs:
                continue

            # Check if any trajectory point is close to the target country
            for traj_point in trajectory:
                dist_to_target = haversine(
                    traj_point["lat"], traj_point["lon"],
                    target_centroid["lat"], target_centroid["lon"]
                )
                if dist_to_target < 800:  # within 800km of country centroid
                    processed_pairs.add(pair_key)
                    arrival_hours = traj_point.get("arrival_hours", 12)
                    est_aqi_increase = min(
                        round(len(source_fires) * 0.5 + wind_speed * 0.3, 1), 80
                    )
                    confidence = min(
                        round(0.4 + (len(source_fires) / 100) + (1 - dist_to_target / 1600), 2),
                        0.95
                    )

                    source_data = BRICS_COUNTRIES.get(source_code, {})
                    events.append({
                        "source_country": source_code,
                        "source_country_name": source_data.get("name", source_code),
                        "source_flag": source_data.get("flag", ""),
                        "affected_country": target_code,
                        "affected_country_name": target_centroid["name"],
                        "affected_flag": target_centroid["flag"],
                        "fire_cluster_location": {"lat": round(cluster_lat, 3), "lon": round(cluster_lon, 3)},
                        "fire_count": len(source_fires),
                        "wind_vector": {"speed_kmh": round(wind_speed, 1), "direction_deg": round(wind_dir, 1)},
                        "estimated_arrival_hours": round(arrival_hours, 1),
                        "estimated_aqi_increase_pct": est_aqi_increase,
                        "confidence": confidence,
                        "status": "Active" if arrival_hours < 6 else "Monitoring",
                        "timestamp": datetime.utcnow().isoformat(),
                    })
                    break  # Only one event per pair

    # Cache and return
    _CROSSBORDER_CACHE["data"] = events
    _CROSSBORDER_CACHE["last_updated"] = time.time()
    return events

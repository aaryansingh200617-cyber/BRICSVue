"""
Hotspots router — detects anomalous AQI spikes across all BRICS cities.
"""
from fastapi import APIRouter
from datetime import datetime
import asyncio

from config import BRICS_COUNTRIES
from services.open_meteo import get_air_quality
from services.nasa_firms import get_all_brics_fires
from ai.hotspot_detector import HotspotDetector
from ai.source_attribution import attribute_source

import time

router = APIRouter(prefix="/api/hotspots", tags=["hotspots"])

# In-memory rolling window cache: city_key → list of last AQI readings
city_aqi_history: dict[str, list[float]] = {}
detector = HotspotDetector()

_HOTSPOTS_CACHE = {
    "data": [],
    "last_updated": 0.0
}
HOTSPOTS_TTL = 60.0


@router.get("")
@router.get("/")
async def get_hotspots():
    """
    Fetch current AQI for all BRICS cities, build rolling history,
    run anomaly detection, and return hotspot events with 60s cache.
    """
    now = time.time()
    if _HOTSPOTS_CACHE["data"] and (now - _HOTSPOTS_CACHE["last_updated"] < HOTSPOTS_TTL):
        return _HOTSPOTS_CACHE["data"]

    # Fetch fires for cross-check
    try:
        all_fires = await get_all_brics_fires()
        fire_counts = {}
        for f in all_fires:
            cc = f.get("country_code", "UN")
            fire_counts[cc] = fire_counts.get(cc, 0) + 1
    except Exception:
        fire_counts = {}

    # Build flat list of all cities for parallel fetch
    city_records = []
    for code, data in BRICS_COUNTRIES.items():
        for city in data["cities"]:
            city_records.append((code, data, city))

    async def fetch_city(country_code, country_data, city):
        try:
            aqi_data = await get_air_quality(city["lat"], city["lon"])
            return (country_code, country_data, city, aqi_data)
        except Exception:
            return (country_code, country_data, city, {})

    tasks = [fetch_city(cc, d, c) for cc, d, c in city_records]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Update rolling history
    for res in results:
        if isinstance(res, Exception):
            continue
        country_code, country_data, city, aqi_data = res
        key = f"{country_code}_{city['name']}"
        aqi = aqi_data.get("european_aqi", 0) or 0
        if key not in city_aqi_history:
            city_aqi_history[key] = []
        city_aqi_history[key].append(aqi)
        # Keep last 24 readings
        if len(city_aqi_history[key]) > 24:
            city_aqi_history[key] = city_aqi_history[key][-24:]

    # Build enriched city metadata dict for detector
    city_meta = {}
    for res in results:
        if isinstance(res, Exception):
            continue
        country_code, country_data, city, aqi_data = res
        key = f"{country_code}_{city['name']}"
        city_meta[key] = {
            "lat": city["lat"],
            "lon": city["lon"],
            "city": city["name"],
            "country": country_code,
            "country_name": country_data["name"],
            "flag": country_data["flag"],
            "aqi_data": aqi_data,
            "fire_count": fire_counts.get(country_code, 0),
        }

    # Run detection
    raw_hotspots = detector.detect(city_aqi_history)

    # Enrich with lat/lon + attribution
    enriched = []
    for hs in raw_hotspots:
        key_parts = next(
            (k for k in city_meta if k == f"{hs.get('country', '')}_{hs.get('city', '')}"),
            None
        )
        meta = city_meta.get(key_parts or "", {})
        aqi_data = meta.get("aqi_data", {})

        # Source attribution
        try:
            attr = attribute_source(
                hs.get("current_aqi", 100),
                aqi_data.get("pm2_5", 30),
                aqi_data.get("pm10", 50),
                aqi_data.get("carbon_monoxide", 500),
                aqi_data.get("nitrogen_dioxide", 20),
                aqi_data.get("sulphur_dioxide", 5),
                10,  # assume moderate wind
                meta.get("fire_count", 0),
                datetime.utcnow().hour,
            )
        except Exception:
            attr = {"source": "Unknown", "confidence": 0.6, "description": ""}

        enriched.append({
            **hs,
            "lat": meta.get("lat", 0.0),
            "lon": meta.get("lon", 0.0),
            "country_name": meta.get("country_name", hs.get("country", "")),
            "flag": meta.get("flag", ""),
            "fire_count_nearby": meta.get("fire_count", 0),
            "source": attr["source"],
            "source_confidence": attr["confidence"],
            "source_description": attr["description"],
            "timestamp": datetime.utcnow().isoformat(),
        })

    _HOTSPOTS_CACHE["data"] = enriched
    _HOTSPOTS_CACHE["last_updated"] = time.time()
    return enriched

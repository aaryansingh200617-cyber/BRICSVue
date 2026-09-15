"""
Analytics router — historical AQI trends + BRICS aggregate summary.
"""
from fastapi import APIRouter
from datetime import datetime
import asyncio

from config import BRICS_COUNTRIES
from services.open_meteo import get_air_quality, get_historical_aqi
from services.nasa_firms import get_all_brics_fires, REAL_FALLBACK_COUNTS

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/trends/{lat}/{lon}")
async def get_trends(lat: float, lon: float, days: int = 7):
    """
    Return historical AQI + PM2.5 hourly data for charting.
    Response shape: {times: [...], aqi: [...], pm25: [...], pm10: [...]}
    """
    raw = await get_historical_aqi(lat, lon, days)
    hourly = raw.get("hourly", {})

    times = hourly.get("time", [])
    aqi_vals = hourly.get("european_aqi", [])
    pm25_vals = hourly.get("pm2_5", [])
    pm10_vals = hourly.get("pm10", [])

    # Normalise lengths
    n = min(len(times), len(aqi_vals)) if times and aqi_vals else 0

    # Thin down to last 168 points (7 days hourly) for performance
    MAX_POINTS = 168
    step = max(1, n // MAX_POINTS)

    result = {
        "times": times[::step][:MAX_POINTS],
        "aqi": [v if v is not None else 0 for v in aqi_vals[::step][:MAX_POINTS]],
        "pm25": [v if v is not None else 0 for v in pm25_vals[::step][:MAX_POINTS]] if pm25_vals else [],
        "pm10": [v if v is not None else 0 for v in pm10_vals[::step][:MAX_POINTS]] if pm10_vals else [],
    }
    return result


@router.get("/brics-summary")
async def get_brics_summary():
    """
    Live aggregate summary for all 11 BRICS countries:
    avg_aqi, max_aqi, fire_count, trend.
    """
    # Fire counts
    fire_counts: dict[str, int] = dict(REAL_FALLBACK_COUNTS)
    try:
        all_fires = await get_all_brics_fires()
        for f in all_fires:
            cc = f.get("country_code")
            if cc:
                fire_counts[cc] = fire_counts.get(cc, 0) + 1
    except Exception:
        pass

    async def fetch_country(country_code, country_data):
        aqi_values = []
        for city in country_data["cities"]:
            try:
                d = await get_air_quality(city["lat"], city["lon"])
                aqi = d.get("european_aqi", 0) or 0
                aqi_values.append(aqi)
            except Exception:
                pass

        avg_aqi = round(sum(aqi_values) / len(aqi_values), 1) if aqi_values else 0
        max_aqi = round(max(aqi_values), 1) if aqi_values else 0

        trend = "stable"
        if avg_aqi > 150:
            trend = "rising"
        elif avg_aqi < 60:
            trend = "declining"

        return country_code, {
            "name": country_data["name"],
            "flag": country_data["flag"],
            "avg_aqi": avg_aqi,
            "max_aqi": max_aqi,
            "fire_count": fire_counts.get(country_code, 0),
            "trend": trend,
            "timestamp": datetime.utcnow().isoformat(),
        }

    tasks = [fetch_country(code, data) for code, data in BRICS_COUNTRIES.items()]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    summary = {}
    for res in results:
        if isinstance(res, Exception):
            continue
        code, data = res
        summary[code] = data

    return summary

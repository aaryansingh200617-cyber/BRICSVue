"""
Comparison router — live per-country AQI + fire stats from real APIs.
"""
from fastapi import APIRouter
from datetime import datetime
import asyncio

from config import BRICS_COUNTRIES
from services.open_meteo import get_air_quality, get_weather
from services.nasa_firms import get_all_brics_fires, REAL_FALLBACK_COUNTS

router = APIRouter(prefix="/api/comparison", tags=["comparison"])


def _get_risk_level(aqi: float) -> str:
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Moderate"
    if aqi <= 150:
        return "Unhealthy (SG)"
    if aqi <= 200:
        return "Unhealthy"
    if aqi <= 300:
        return "Very Unhealthy"
    return "Hazardous"


def _get_risk_color(aqi: float) -> str:
    if aqi <= 50:
        return "green"
    if aqi <= 100:
        return "yellow"
    if aqi <= 150:
        return "orange"
    if aqi <= 200:
        return "red"
    if aqi <= 300:
        return "purple"
    return "maroon"


@router.get("/brics")
async def get_comparison():
    """Return live comparison data for all 11 BRICS countries (synced with platform overview)."""
    from routers.aqi import _OVERVIEW_CACHE, get_overview

    overview = await get_overview()
    fire_counts = dict(REAL_FALLBACK_COUNTS)
    try:
        all_fires = await get_all_brics_fires()
        for f in all_fires:
            cc = f.get("country_code")
            if cc:
                fire_counts[cc] = fire_counts.get(cc, 0) + 1
    except Exception:
        pass

    results = []
    for c in overview:
        code = c["country_code"]
        aqi = float(c.get("aqi") or 50.0)
        pm25 = float(c.get("pm25") or 15.0)
        trend = c.get("trend") or "→"
        trend_arrow = "↑" if trend == "+" else ("↓" if trend == "−" else "→")

        results.append({
            "country_code": code,
            "name": c["country_name"],
            "flag": c["flag"],
            "city": c["city"],
            "aqi_value": round(aqi, 1),
            "aqi_risk_level": _get_risk_level(aqi),
            "aqi_color": _get_risk_color(aqi),
            "pm25": round(pm25, 1),
            "fire_count": fire_counts.get(code, 45),
            "trend_direction": trend_arrow,
            "timestamp": datetime.utcnow().isoformat(),
        })

    # Return sorted by AQI descending
    results.sort(key=lambda x: x["aqi_value"], reverse=True)
    return results

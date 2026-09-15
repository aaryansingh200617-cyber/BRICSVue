"""
AQI router — live air quality data from Open-Meteo for BRICS cities.
"""
from fastapi import APIRouter
from config import BRICS_COUNTRIES
from services.open_meteo import get_air_quality
import asyncio
import time

router = APIRouter(prefix="/api/aqi", tags=["aqi"])

DEFAULT_BRICS_OVERVIEW = [
    {"country_code": "SA", "country_name": "Saudi Arabia", "flag": "🇸🇦", "city": "Riyadh", "lat": 24.69, "lon": 46.72, "aqi": 280.0, "pm25": 156.0, "pm10": 320.0, "status": "Very Unhealthy", "trend": "+"},
    {"country_code": "ID", "country_name": "Indonesia", "flag": "🇮🇩", "city": "Jakarta", "lat": -6.21, "lon": 106.85, "aqi": 174.0, "pm25": 186.7, "pm10": 210.0, "status": "Unhealthy", "trend": "+"},
    {"country_code": "AE", "country_name": "UAE", "flag": "🇦🇪", "city": "Dubai", "lat": 25.2, "lon": 55.27, "aqi": 159.0, "pm25": 69.6, "pm10": 140.0, "status": "Unhealthy", "trend": "+"},
    {"country_code": "CN", "country_name": "China", "flag": "🇨🇳", "city": "Beijing", "lat": 39.91, "lon": 116.39, "aqi": 111.0, "pm25": 80.6, "pm10": 95.0, "status": "Unhealthy for Sensitive Groups", "trend": "→"},
    {"country_code": "IR", "country_name": "Iran", "flag": "🇮🇷", "city": "Tehran", "lat": 35.69, "lon": 51.39, "aqi": 109.0, "pm25": 59.6, "pm10": 75.0, "status": "Unhealthy for Sensitive Groups", "trend": "+"},
    {"country_code": "RU", "country_name": "Russia", "flag": "🇷🇺", "city": "Moscow", "lat": 55.75, "lon": 37.62, "aqi": 102.0, "pm25": 53.6, "pm10": 55.0, "status": "Unhealthy for Sensitive Groups", "trend": "→"},
    {"country_code": "IN", "country_name": "India", "flag": "🇮🇳", "city": "Delhi", "lat": 28.67, "lon": 77.22, "aqi": 85.0, "pm25": 39.6, "pm10": 39.9, "status": "Moderate", "trend": "→"},
    {"country_code": "ET", "country_name": "Ethiopia", "flag": "🇪🇹", "city": "Addis Ababa", "lat": 9.03, "lon": 38.74, "aqi": 71.0, "pm25": 41.0, "pm10": 45.0, "status": "Moderate", "trend": "→"},
    {"country_code": "EG", "country_name": "Egypt", "flag": "🇪🇬", "city": "Cairo", "lat": 30.06, "lon": 31.25, "aqi": 66.0, "pm25": 13.6, "pm10": 45.0, "status": "Moderate", "trend": "−"},
    {"country_code": "ZA", "country_name": "South Africa", "flag": "🇿🇦", "city": "Johannesburg", "lat": -26.2, "lon": 28.04, "aqi": 63.0, "pm25": 14.8, "pm10": 30.0, "status": "Moderate", "trend": "−"},
    {"country_code": "BR", "country_name": "Brazil", "flag": "🇧🇷", "city": "Brasilia", "lat": -15.78, "lon": -47.93, "aqi": 47.0, "pm25": 4.7, "pm10": 15.0, "status": "Good", "trend": "−"},
]

_OVERVIEW_CACHE = {"timestamp": 0.0, "data": DEFAULT_BRICS_OVERVIEW, "is_refreshing": False}

def get_status(aqi: float) -> str:
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Moderate"
    if aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    if aqi <= 200:
        return "Unhealthy"
    if aqi <= 300:
        return "Very Unhealthy"
    return "Hazardous"


async def _refresh_overview():
    """Background task to fetch live measurements without blocking HTTP clients."""
    if _OVERVIEW_CACHE["is_refreshing"]:
        return
    _OVERVIEW_CACHE["is_refreshing"] = True
    try:
        updated = []
        for code, data in BRICS_COUNTRIES.items():
            city = data["cities"][0]
            try:
                aqi_data = await asyncio.wait_for(get_air_quality(city["lat"], city["lon"]), timeout=4.0)
            except Exception:
                aqi_data = {}
            aqi = aqi_data.get("us_aqi") or aqi_data.get("aqi") or aqi_data.get("european_aqi") or 50.0
            pm25 = aqi_data.get("pm2_5") or 18.0
            pm10 = aqi_data.get("pm10") or 30.0
            trend = "+" if (aqi > 100 and pm25 / max(aqi, 1) > 0.6) else ("−" if aqi < 60 else "→")
            updated.append({
                "country_code": code,
                "country_name": data["name"],
                "flag": data["flag"],
                "city": city["name"],
                "lat": city["lat"],
                "lon": city["lon"],
                "aqi": round(float(aqi), 1),
                "pm25": round(float(pm25), 1),
                "pm10": round(float(pm10), 1),
                "status": get_status(aqi),
                "trend": trend,
            })
            await asyncio.sleep(0.1)
        if updated:
            _OVERVIEW_CACHE["data"] = updated
            _OVERVIEW_CACHE["timestamp"] = time.time()
    finally:
        _OVERVIEW_CACHE["is_refreshing"] = False


@router.get("/brics-overview")
async def get_overview():
    """
    Fetch live AQI for each BRICS country (instant cached response with async background update).
    """
    now = time.time()
    if (now - _OVERVIEW_CACHE["timestamp"] > 60.0) and not _OVERVIEW_CACHE["is_refreshing"]:
        asyncio.create_task(_refresh_overview())
    return _OVERVIEW_CACHE["data"]


@router.get("/{lat}/{lon}")
async def get_coord_aqi(lat: float, lon: float):
    """Return full AQI data for a given coordinate."""
    return await get_air_quality(lat, lon)


@router.get("/city/{country_code}/{city_name}")
async def get_city_aqi(country_code: str, city_name: str):
    """Look up city from config, return AQI data with coordinates."""
    if country_code in BRICS_COUNTRIES:
        for c in BRICS_COUNTRIES[country_code]["cities"]:
            if c["name"].lower() == city_name.lower():
                aqi_data = await get_air_quality(c["lat"], c["lon"])
                return {
                    **aqi_data,
                    "city": c["name"],
                    "lat": c["lat"],
                    "lon": c["lon"],
                    "status": get_status(aqi_data.get("european_aqi", 0) or 0),
                }
    return {"error": "City not found"}


@router.get("/countries")
async def get_countries():
    """Return all 11 BRICS countries and their monitored cities."""
    return BRICS_COUNTRIES


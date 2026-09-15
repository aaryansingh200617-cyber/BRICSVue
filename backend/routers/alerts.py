"""
Alerts router — generates AI-powered alerts from live AQI + fire + hotspot data.
"""
from fastapi import APIRouter
from datetime import datetime
import asyncio
import uuid

from config import BRICS_COUNTRIES
from services.open_meteo import get_air_quality, get_weather
from services.nasa_firms import get_all_brics_fires
from ai.aqi_predictor import AQIPredictor
from ai.source_attribution import attribute_source

import time

router = APIRouter(prefix="/api/alerts", tags=["alerts"])
predictor = AQIPredictor()

_ALERTS_CACHE = {
    "data": [],
    "last_updated": 0.0
}
ALERTS_TTL = 60.0


def _severity(increase_pct: float, current_aqi: float) -> str:
    if increase_pct >= 60 or current_aqi >= 250:
        return "critical"
    if increase_pct >= 40 or current_aqi >= 180:
        return "high"
    if increase_pct >= 20 or current_aqi >= 120:
        return "medium"
    return "low"


def _get_status(aqi: float) -> str:
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


@router.get("")
@router.get("/")
async def get_alerts():
    """
    Aggregate hotspot + fire + AQI data into AI-generated alerts with 60s cache.
    """
    now = time.time()
    if _ALERTS_CACHE["data"] and (now - _ALERTS_CACHE["last_updated"] < ALERTS_TTL):
        return _ALERTS_CACHE["data"]

    alerts = []

    # Fetch fires once
    try:
        all_fires = await get_all_brics_fires()
    except Exception:
        all_fires = []

    fire_counts = {}
    for f in all_fires:
        cc = f.get("country_code", "UN")
        fire_counts[cc] = fire_counts.get(cc, 0) + 1

    # Fetch AQI for each country's primary city in parallel
    async def fetch_country_alert(country_code, country_data):
        city = country_data["cities"][0]
        try:
            aqi_data = await get_air_quality(city["lat"], city["lon"])
            weather = await get_weather(city["lat"], city["lon"])
        except Exception:
            return None

        aqi = aqi_data.get("european_aqi", 0) or 0
        pm25 = aqi_data.get("pm2_5", 0) or 0
        pm10 = aqi_data.get("pm10", 0) or 0
        co = aqi_data.get("carbon_monoxide", 0) or 0
        no2 = aqi_data.get("nitrogen_dioxide", 0) or 0
        so2 = aqi_data.get("sulphur_dioxide", 0) or 0
        wind_speed = weather.get("windspeed", 5)
        wind_dir = weather.get("winddirection", 0)
        temp = weather.get("temperature", 25)
        now_hour = datetime.utcnow().hour
        fire_count = fire_counts.get(country_code, 0)

        # Only alert if AQI is above moderate
        if aqi < 100:
            return None

        # Run prediction
        try:
            pred_result = predictor.predict(
                aqi, pm25, pm10, wind_speed, wind_dir, temp, 60, fire_count, now_hour
            )
            predicted_aqi_6h = pred_result["predictions"].get("+6h", aqi)
            shap = pred_result["shap_values"]
        except Exception:
            predicted_aqi_6h = aqi * 1.1
            shap = {}

        predicted_aqi_6h = max(0, predicted_aqi_6h)
        increase_pct = round(((predicted_aqi_6h - aqi) / max(aqi, 1)) * 100, 1)

        # Source attribution
        try:
            attribution = attribute_source(aqi, pm25, pm10, co, no2, so2, wind_speed, fire_count, now_hour)
            contributor = attribution["source"]
            confidence = attribution["confidence"]
        except Exception:
            contributor = "Regional Transport"
            confidence = 0.75

        sev = _severity(increase_pct, aqi)

        message = (
            f"AQI of {int(aqi)} detected in {city['name']}, {country_data['name']}. "
            f"Predicted to reach {int(predicted_aqi_6h)} in 6 hours (+{increase_pct}%). "
            f"Likely source: {contributor}."
        )

        return {
            "id": f"alert-{uuid.uuid4().hex[:8]}",
            "severity": sev,
            "location": city["name"],
            "country": country_code,
            "country_name": country_data["name"],
            "flag": country_data["flag"],
            "current_aqi": round(aqi, 1),
            "predicted_aqi": round(predicted_aqi_6h, 1),
            "expected_increase_pct": increase_pct,
            "time_hours": 6,
            "likely_contributor": contributor,
            "confidence": round(confidence, 2),
            "timestamp": datetime.utcnow().isoformat(),
            "message": message,
            "status": _get_status(aqi),
            "shap_values": shap,
        }

    tasks = [
        fetch_country_alert(code, data)
        for code, data in BRICS_COUNTRIES.items()
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for r in results:
        if r and not isinstance(r, Exception):
            alerts.append(r)

    # Sort by severity
    sev_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    alerts.sort(key=lambda x: sev_order.get(x["severity"], 4))
    _ALERTS_CACHE["data"] = alerts
    _ALERTS_CACHE["last_updated"] = time.time()
    return alerts

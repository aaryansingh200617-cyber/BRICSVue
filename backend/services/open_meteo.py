import os
import time
import httpx
from config import (
    OPEN_METEO_AQI_URL,
    OPEN_METEO_WEATHER_URL,
    WEATHER_API_KEY,
    WAQI_API_KEY,
    NASA_API_KEY,
    NASA_EARTHDATA_TOKEN,
)

_AQI_CACHE: dict = {}
_WEATHER_CACHE: dict = {}
CACHE_TTL = 120  # 2 minutes cache to prevent rate-limits and socket locks

# Shared async client for connection pooling
_client = httpx.AsyncClient(timeout=6.0)

async def get_air_quality(lat: float, lon: float) -> dict:
    """
    Fetches real-time air quality observation for coordinates with 2-min caching.
    1. Primary: World Air Quality Index (WAQI) official ground monitoring stations.
    2. Fallback: Open-Meteo High-Resolution air quality models.
    """
    cache_key = (round(float(lat), 2), round(float(lon), 2))
    now = time.time()
    if cache_key in _AQI_CACHE:
        entry, ts = _AQI_CACHE[cache_key]
        if now - ts < CACHE_TTL:
            return entry

    result = None

    # 1. Primary: World Air Quality Index (WAQI) ground station
    if WAQI_API_KEY:
        try:
            waqi_url = f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={WAQI_API_KEY}"
            res = await _client.get(waqi_url, timeout=5.0)
            if res.status_code == 200:
                d = res.json()
                if d.get("status") == "ok" and isinstance(d.get("data"), dict):
                    data_obj = d["data"]
                    raw_aqi = data_obj.get("aqi")
                    if raw_aqi is not None and isinstance(raw_aqi, (int, float)) and raw_aqi >= 0:
                        iaqi = data_obj.get("iaqi", {})
                        pm25_val = iaqi.get("pm25", {}).get("v")
                        pm10_val = iaqi.get("pm10", {}).get("v")
                        no2_val = iaqi.get("no2", {}).get("v")
                        so2_val = iaqi.get("so2", {}).get("v")
                        co_val = iaqi.get("co", {}).get("v")
                        o3_val = iaqi.get("o3", {}).get("v")
                        station_name = data_obj.get("city", {}).get("name", "Local Monitoring Station")

                        result = {
                            "aqi": int(raw_aqi),
                            "us_aqi": int(raw_aqi),
                            "european_aqi": int(min(raw_aqi / 2.5, 100)),
                            "pm10": round(float(pm10_val or (raw_aqi * 0.8)), 1),
                            "pm2_5": round(float(pm25_val or (raw_aqi * 0.55)), 1),
                            "carbon_monoxide": round(float(co_val or 300), 1),
                            "nitrogen_dioxide": round(float(no2_val or 20), 1),
                            "sulphur_dioxide": round(float(so2_val or 10), 1),
                            "ozone": round(float(o3_val or 40), 1),
                            "station": station_name,
                            "source": "World Air Quality Index (WAQI)",
                        }
        except Exception:
            pass

    # 2. Fallback: Open-Meteo High-Resolution air quality
    if not result:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,us_aqi",
        }
        try:
            response = await _client.get(OPEN_METEO_AQI_URL, params=params, timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                curr = data.get("current")
                if curr:
                    us_aqi = curr.get("us_aqi")
                    eu_aqi = curr.get("european_aqi")
                    chosen_aqi = int(us_aqi or eu_aqi or 45)
                    result = {
                        "aqi": chosen_aqi,
                        "us_aqi": int(us_aqi or chosen_aqi),
                        "european_aqi": int(eu_aqi or chosen_aqi),
                        "pm10": round(float(curr.get("pm10") or 25), 1),
                        "pm2_5": round(float(curr.get("pm2_5") or 15), 1),
                        "carbon_monoxide": round(float(curr.get("carbon_monoxide") or 300), 1),
                        "nitrogen_dioxide": round(float(curr.get("nitrogen_dioxide") or 20), 1),
                        "sulphur_dioxide": round(float(curr.get("sulphur_dioxide") or 10), 1),
                        "ozone": round(float(curr.get("ozone") or 40), 1),
                        "source": "Open-Meteo Atmospheric Model",
                    }
        except Exception:
            pass

    if not result:
        if cache_key in _AQI_CACHE:
            return _AQI_CACHE[cache_key][0]
        result = {
            "aqi": 50,
            "us_aqi": 50,
            "european_aqi": 30,
            "pm10": 28.0,
            "pm2_5": 16.0,
            "carbon_monoxide": 320.0,
            "nitrogen_dioxide": 22.0,
            "sulphur_dioxide": 8.0,
            "ozone": 42.0,
            "source": "Baseline Reference",
        }

    _AQI_CACHE[cache_key] = (result, now)
    return result


async def get_weather(lat: float, lon: float) -> dict:
    """
    Fetches real-time weather observation with 2-minute caching.
    Uses OpenWeatherMap with fallback to Open-Meteo.
    """
    cache_key = (round(float(lat), 2), round(float(lon), 2))
    now = time.time()
    if cache_key in _WEATHER_CACHE:
        entry, ts = _WEATHER_CACHE[cache_key]
        if now - ts < CACHE_TTL:
            return entry

    result = None

    # 1. Check if user configured Weather API key (OpenWeatherMap)
    if WEATHER_API_KEY:
        try:
            owm_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"
            res = await _client.get(owm_url)
            if res.status_code == 200:
                d = res.json()
                m = d.get("main", {})
                w = d.get("wind", {})
                weather_desc = d.get("weather", [{}])[0].get("main", "Clear")
                result = {
                    "temperature": round(float(m.get("temp", 22)), 1),
                    "apparent_temperature": round(float(m.get("feels_like", 22)), 1),
                    "windspeed": round(float(w.get("speed", 3)) * 3.6, 1), # m/s -> km/h
                    "winddirection": int(w.get("deg", 0)),
                    "humidity": int(m.get("humidity", 50)),
                    "pressure": round(float(m.get("pressure", 1013)), 1),
                    "precipitation": 0.0,
                    "condition": weather_desc,
                    "source": "OpenWeatherMap",
                }
        except Exception:
            pass

    # 2. Open-Meteo real-time current endpoint (free, no API key needed)
    if not result:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure,wind_speed_10m,wind_direction_10m",
        }
        try:
            response = await _client.get(OPEN_METEO_WEATHER_URL, params=params)
            if response.status_code == 200:
                data = response.json()
                c = data.get("current")
                if c:
                    result = {
                        "temperature": round(float(c.get("temperature_2m") or 22), 1),
                        "apparent_temperature": round(float(c.get("apparent_temperature") or 22), 1),
                        "windspeed": round(float(c.get("wind_speed_10m") or 10), 1),
                        "winddirection": int(c.get("wind_direction_10m") or 0),
                        "humidity": int(c.get("relative_humidity_2m") or 55),
                        "pressure": round(float(c.get("surface_pressure") or 1013), 1),
                        "precipitation": round(float(c.get("precipitation") or 0), 1),
                        "condition": "Clear",
                        "source": "Open-Meteo Live",
                    }
        except Exception:
            pass

    if not result:
        if cache_key in _WEATHER_CACHE:
            return _WEATHER_CACHE[cache_key][0]
        result = {
            "temperature": 22.0,
            "apparent_temperature": 22.0,
            "windspeed": 10.0,
            "winddirection": 45,
            "humidity": 55,
            "pressure": 1013.0,
            "precipitation": 0.0,
            "condition": "Clear",
            "source": "Baseline",
        }

    _WEATHER_CACHE[cache_key] = (result, now)
    return result


async def get_historical_aqi(lat: float, lon: float, days: int = 7) -> dict:
    """Fetches past AQI data for trend charting."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "european_aqi,pm10,pm2_5",
        "past_days": days,
    }
    try:
        response = await _client.get(OPEN_METEO_AQI_URL, params=params)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Historical AQI error: {e}")
    return {"hourly": {"european_aqi": [45] * 24, "time": []}}
from fastapi import APIRouter
from ai.aqi_predictor import AQIPredictor
from ai.movement_predictor import predict_movement
from services.open_meteo import get_air_quality, get_weather

router = APIRouter(prefix="/api/predict", tags=["predict"])

@router.get("/aqi/{lat}/{lon}")
async def predict_aqi(lat: float, lon: float):
    aqi_data = await get_air_quality(lat, lon)
    weather_data = await get_weather(lat, lon)
    
    predictor = AQIPredictor()
    return predictor.predict(
        current_aqi=aqi_data.get("european_aqi", 50),
        pm25=aqi_data.get("pm2_5", 15),
        pm10=aqi_data.get("pm10", 25),
        wind_speed=weather_data.get("windspeed", 10),
        wind_dir=weather_data.get("winddirection", 0),
        temperature=weather_data.get("temperature", 22),
        humidity=weather_data.get("humidity", 55),
        fire_count_nearby=5,
        hour_of_day=12
    )

@router.get("/movement/{lat}/{lon}")
async def predict_traj(lat: float, lon: float):
    aqi_data = await get_air_quality(lat, lon)
    weather_data = await get_weather(lat, lon)
    return predict_movement(
        source_lat=lat,
        source_lon=lon,
        aqi=aqi_data.get("european_aqi", 50),
        wind_speed_kmh=weather_data.get("windspeed", 10),
        wind_direction_deg=weather_data.get("winddirection", 0)
    )
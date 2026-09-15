from fastapi import APIRouter
from services.open_meteo import get_weather

router = APIRouter(prefix="/api/weather", tags=["weather"])

@router.get("/{lat}/{lon}")
async def get_weather_coord(lat: float, lon: float):
    return await get_weather(lat, lon)

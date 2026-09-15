import httpx
from config import NOMINATIM_URL, NOMINATIM_REVERSE_URL

headers = {"User-Agent": "BRICS-ClimateShield/1.0"}

async def geocode(city_name: str, country_name: str) -> dict:
    """Geocode city and country to lat/lon."""
    params = {
        "q": f"{city_name},{country_name}",
        "format": "json",
        "limit": 1
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(NOMINATIM_URL, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            if data:
                return {"lat": float(data[0]["lat"]), "lon": float(data[0]["lon"])}
    except Exception:
        pass
    return {"lat": 0.0, "lon": 0.0}

async def reverse_geocode(lat: float, lon: float) -> str:
    """Reverse geocode lat/lon to place name."""
    params = {
        "lat": lat,
        "lon": lon,
        "format": "json"
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(NOMINATIM_REVERSE_URL, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            if data and "display_name" in data:
                return data["display_name"]
    except Exception:
        pass
    return "Unknown Location"

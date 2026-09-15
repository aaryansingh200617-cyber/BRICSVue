def attribute_source(aqi: float, pm25: float, pm10: float, co: float, no2: float, so2: float, wind_speed: float, fire_count_nearby: int, hour: int) -> dict:
    """Attribute AQI source based on rules."""
    if fire_count_nearby > 0 and pm25 > 35 and pm10 > 50:
        return {"source": "Biomass Burning", "confidence": 0.85, "description": "High PM levels with nearby fires"}
    if no2 > 20 and (7 <= hour <= 10 or 17 <= hour <= 20):
        return {"source": "Transportation", "confidence": 0.75, "description": "High NO2 during rush hours"}
    if so2 > 15:
        return {"source": "Industrial Activity", "confidence": 0.8, "description": "Elevated SO2 indicating industrial emissions"}
    if humidity_low() and pm10 > 80: # dummy humidity func
        return {"source": "Dust/Sand", "confidence": 0.7, "description": "High PM10 in dry conditions"}
    if (hour < 6 or hour > 20) and co > 100:
        return {"source": "Open Burning", "confidence": 0.65, "description": "High CO at night"}
    
    return {"source": "Regional Transport", "confidence": 0.5, "description": "Mixed/distant sources"}

def humidity_low():
    return True

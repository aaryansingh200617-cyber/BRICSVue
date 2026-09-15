import math

def predict_movement(source_lat: float, source_lon: float, aqi: float, wind_speed_kmh: float, wind_direction_deg: float, hours: int = 12) -> list[dict]:
    """Predict pollution movement using wind vector."""
    trajectory = []
    # Wind direction is where wind is coming FROM.
    # To find where it's going, add 180 degrees.
    travel_dir = (wind_direction_deg + 180) % 360
    travel_dir_rad = math.radians(travel_dir)
    
    R = 6371.0 # Earth radius in km
    
    for h in [3, 6, 9, 12]:
        if h > hours:
            break
        distance_km = wind_speed_kmh * h
        # Destination point calculation
        lat1 = math.radians(source_lat)
        lon1 = math.radians(source_lon)
        d = distance_km / R
        
        lat2 = math.asin(math.sin(lat1) * math.cos(d) + math.cos(lat1) * math.sin(d) * math.cos(travel_dir_rad))
        lon2 = lon1 + math.atan2(math.sin(travel_dir_rad) * math.sin(d) * math.cos(lat1), math.cos(d) - math.sin(lat1) * math.sin(lat2))
        
        est_aqi = max(0, aqi * math.exp(-0.1 * h)) # Decay
        
        trajectory.append({
            "lat": math.degrees(lat2),
            "lon": math.degrees(lon2),
            "distance_km": distance_km,
            "estimated_aqi_contribution": est_aqi,
            "arrival_hours": h
        })
    return trajectory

import math
import numpy as np
from config import BRICS_COUNTRIES

class HotspotDetector:
    """Detects anomalous AQI hotspots."""

    def haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between coords in km."""
        R = 6371.0
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def detect(self, cities_aqi_history: dict) -> list[dict]:
        """Detect hotspots from AQI history."""
        hotspots = []
        for city_key, history in cities_aqi_history.items():
            if not history or len(history) < 2:
                continue
            history_arr = np.array(history)
            current_aqi = history_arr[-1]
            mean_aqi = np.mean(history_arr)
            std_aqi = np.std(history_arr)
            
            if current_aqi > mean_aqi + 1.5 * std_aqi and current_aqi > 80:
                severity = 'medium'
                # Mock cross-check for fire count nearby
                fire_count_nearby = 6 # Mock logic for simplicity
                if fire_count_nearby > 5:
                    severity = 'high'
                
                parts = city_key.split('_')
                city = parts[1] if len(parts)>1 else "Unknown"
                country = parts[0] if len(parts)>1 else "Unknown"
                
                hotspots.append({
                    "city": city,
                    "country": country,
                    "lat": 0.0, # Placeholder
                    "lon": 0.0,
                    "current_aqi": float(current_aqi),
                    "baseline_aqi": float(mean_aqi),
                    "severity": severity,
                    "confidence": 0.85,
                    "reason": "Sudden AQI spike detected."
                })
        return hotspots

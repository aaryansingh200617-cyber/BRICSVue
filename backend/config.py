import os
from dotenv import load_dotenv

load_dotenv()

NASA_FIRMS_KEY = os.getenv("NASA_FIRMS_KEY", "05a955d1cbb17a196950aed437205f9b")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "aaryanrampage@gmail.com")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "")
WAQI_API_KEY = os.getenv("WAQI_API_KEY", "")
NASA_API_KEY = os.getenv("NASA_API_KEY", "")
NASA_EARTHDATA_TOKEN = os.getenv("NASA_EARTHDATA_TOKEN", "")

BRICS_COUNTRIES = {
    "BR": {
        "name": "Brazil",
        "flag": "🇧🇷",
        "bbox": [-73.98, -33.75, -34.79, 5.27],
        "cities": [
            {"name": "Brasilia", "lat": -15.78, "lon": -47.93},
            {"name": "São Paulo", "lat": -23.55, "lon": -46.63},
            {"name": "Rio de Janeiro", "lat": -22.91, "lon": -43.17},
            {"name": "Manaus", "lat": -3.12, "lon": -60.02}
        ]
    },
    "RU": {
        "name": "Russia",
        "flag": "🇷🇺",
        "bbox": [19.63, 41.18, 180.0, 81.85],
        "cities": [
            {"name": "Moscow", "lat": 55.75, "lon": 37.62},
            {"name": "Saint Petersburg", "lat": 59.95, "lon": 30.32},
            {"name": "Novosibirsk", "lat": 54.99, "lon": 82.90},
            {"name": "Yekaterinburg", "lat": 56.83, "lon": 60.60}
        ]
    },
    "IN": {
        "name": "India",
        "flag": "🇮🇳",
        "bbox": [68.11, 6.75, 97.41, 35.67],
        "cities": [
            {"name": "Delhi", "lat": 28.67, "lon": 77.22},
            {"name": "Mumbai", "lat": 19.08, "lon": 72.88},
            {"name": "Kolkata", "lat": 22.57, "lon": 88.36},
            {"name": "Bengaluru", "lat": 12.97, "lon": 77.59},
            {"name": "Chennai", "lat": 13.08, "lon": 80.27}
        ]
    },
    "CN": {
        "name": "China",
        "flag": "🇨🇳",
        "bbox": [73.55, 18.15, 134.77, 53.56],
        "cities": [
            {"name": "Beijing", "lat": 39.91, "lon": 116.39},
            {"name": "Shanghai", "lat": 31.23, "lon": 121.47},
            {"name": "Guangzhou", "lat": 23.13, "lon": 113.26},
            {"name": "Shenzhen", "lat": 22.54, "lon": 114.06}
        ]
    },
    "ZA": {
        "name": "South Africa",
        "flag": "🇿🇦",
        "bbox": [16.45, -34.83, 32.89, -22.12],
        "cities": [
            {"name": "Johannesburg", "lat": -26.20, "lon": 28.04},
            {"name": "Cape Town", "lat": -33.93, "lon": 18.42},
            {"name": "Durban", "lat": -29.85, "lon": 31.02}
        ]
    },
    "EG": {
        "name": "Egypt",
        "flag": "🇪🇬",
        "bbox": [24.70, 21.99, 36.89, 31.57],
        "cities": [
            {"name": "Cairo", "lat": 30.06, "lon": 31.25},
            {"name": "Alexandria", "lat": 31.22, "lon": 29.96},
            {"name": "Giza", "lat": 30.01, "lon": 31.21}
        ]
    },
    "ET": {
        "name": "Ethiopia",
        "flag": "🇪🇹",
        "bbox": [32.99, 3.39, 47.98, 14.89],
        "cities": [
            {"name": "Addis Ababa", "lat": 9.03, "lon": 38.74},
            {"name": "Dire Dawa", "lat": 9.60, "lon": 41.87}
        ]
    },
    "IR": {
        "name": "Iran",
        "flag": "🇮🇷",
        "bbox": [44.04, 25.06, 63.33, 39.78],
        "cities": [
            {"name": "Tehran", "lat": 35.69, "lon": 51.39},
            {"name": "Isfahan", "lat": 32.66, "lon": 51.68},
            {"name": "Mashhad", "lat": 36.30, "lon": 59.60}
        ]
    },
    "AE": {
        "name": "UAE",
        "flag": "🇦🇪",
        "bbox": [51.58, 22.63, 56.38, 26.08],
        "cities": [
            {"name": "Dubai", "lat": 25.20, "lon": 55.27},
            {"name": "Abu Dhabi", "lat": 24.47, "lon": 54.37},
            {"name": "Sharjah", "lat": 25.36, "lon": 55.39}
        ]
    },
    "SA": {
        "name": "Saudi Arabia",
        "flag": "🇸🇦",
        "bbox": [34.57, 16.38, 55.66, 32.15],
        "cities": [
            {"name": "Riyadh", "lat": 24.69, "lon": 46.72},
            {"name": "Jeddah", "lat": 21.49, "lon": 39.19},
            {"name": "Mecca", "lat": 21.42, "lon": 39.83}
        ]
    },
    "ID": {
        "name": "Indonesia",
        "flag": "🇮🇩",
        "bbox": [95.01, -11.00, 141.01, 6.07],
        "cities": [
            {"name": "Jakarta", "lat": -6.21, "lon": 106.85},
            {"name": "Surabaya", "lat": -7.25, "lon": 112.75},
            {"name": "Bandung", "lat": -6.92, "lon": 107.61},
            {"name": "Medan", "lat": 3.58, "lon": 98.68}
        ]
    }
}

OPEN_METEO_AQI_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
OPEN_METEO_WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
FIRMS_BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"

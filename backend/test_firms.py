import httpx
from config import BRICS_COUNTRIES, NASA_FIRMS_KEY

print("Testing NASA FIRMS API key:", NASA_FIRMS_KEY[:6] + "...")

for code, data in BRICS_COUNTRIES.items():
    bbox = data['bbox']
    min_lon = max(-180.0, float(bbox[0]))
    min_lat = max(-90.0, float(bbox[1]))
    max_lon = min(180.0, float(bbox[2]))
    max_lat = min(90.0, float(bbox[3]))

    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{NASA_FIRMS_KEY}/VIIRS_SNPP_NRT/{min_lon},{min_lat},{max_lon},{max_lat}/1"
    try:
        res = httpx.get(url, timeout=12.0)
        lines = [l for l in res.text.strip().split("\n") if l.strip()]
        fire_count = max(0, len(lines) - 1) if res.status_code == 200 else f"Err {res.status_code}"
        print(f"[{code}] {data['name']}: Status {res.status_code} -> {fire_count} real satellite fires")
    except Exception as e:
        print(f"[{code}] {data['name']}: Exception {e}")

import asyncio
import time
from fastapi import APIRouter
from services.nasa_firms import get_all_brics_fires, REAL_FALLBACK_COUNTS, _FIRES_CACHE

router = APIRouter(prefix="/api/fires", tags=["fires"])

@router.get("")
@router.get("/")
async def get_fires():
    now = time.time()
    if not _FIRES_CACHE["data"] or (now - _FIRES_CACHE["last_updated"] > 300):
        # Refresh in background if we already have cached or fallback data
        if _FIRES_CACHE["data"]:
            asyncio.create_task(get_all_brics_fires())
        else:
            await get_all_brics_fires()

    counts = dict(_FIRES_CACHE.get("per_country_counts") or REAL_FALLBACK_COUNTS)
    return {"counts": counts, "events": _FIRES_CACHE["data"]}

@router.get("/country/{country_code}")
async def get_country_fires(country_code: str):
    code = country_code.upper()
    return [f for f in _FIRES_CACHE["data"] if f.get("country_code", "").upper() == code]

@router.get("/stats")
async def get_stats():
    now = time.time()
    if not _FIRES_CACHE["data"] or (now - _FIRES_CACHE["last_updated"] > 300):
        asyncio.create_task(get_all_brics_fires())
    return _FIRES_CACHE.get("per_country_counts") or REAL_FALLBACK_COUNTS

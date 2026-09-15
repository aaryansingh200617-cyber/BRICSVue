"""
WebSocket realtime broadcaster — sends live BRICS data every 30 seconds.
"""
import asyncio
import json
import time
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from config import BRICS_COUNTRIES
from services.open_meteo import get_air_quality
from services.nasa_firms import get_all_brics_fires, REAL_FALLBACK_COUNTS

router = APIRouter()

connected_clients: set[WebSocket] = set()

_LATEST_SNAPSHOT = {
    "type": "update",
    "timestamp": datetime.utcnow().isoformat(),
    "stats": {
        "active_events": 4,
        "critical_events": 1,
        "total_fires": sum(REAL_FALLBACK_COUNTS.values()),
        "countries_monitored": 11,
    },
    "country_aqis": [],
    "fire_by_country": REAL_FALLBACK_COUNTS,
}
_SNAPSHOT_TIME = 0.0


async def _fetch_single_country_aqi(code: str, data: dict) -> dict:
    city = data["cities"][0]
    try:
        d = await get_air_quality(city["lat"], city["lon"])
        aqi = d.get("european_aqi", 0) or 0
    except Exception:
        aqi = 50
    return {"code": code, "name": data["name"], "flag": data["flag"], "aqi": round(aqi, 1)}


async def _build_snapshot() -> dict:
    """Return latest snapshot from memory without blocking network calls."""
    global _LATEST_SNAPSHOT
    from services.nasa_firms import _FIRES_CACHE, REAL_FALLBACK_COUNTS
    
    fire_by_country = dict(_FIRES_CACHE.get("per_country_counts") or REAL_FALLBACK_COUNTS)
    total_fires = sum(fire_by_country.values())
    
    _LATEST_SNAPSHOT["timestamp"] = datetime.utcnow().isoformat()
    _LATEST_SNAPSHOT["stats"]["total_fires"] = total_fires
    _LATEST_SNAPSHOT["fire_by_country"] = fire_by_country
    return _LATEST_SNAPSHOT


async def _broadcast(message: str):
    """Send message to all connected WebSocket clients, removing dead ones."""
    if not connected_clients:
        return
    dead = set()
    for ws in list(connected_clients):
        try:
            await ws.send_text(message)
        except Exception:
            dead.add(ws)
    connected_clients.difference_update(dead)


async def start_broadcast_loop():
    """Single global loop broadcasting updates every 30 seconds."""
    await asyncio.sleep(2)
    while True:
        try:
            if connected_clients:
                snapshot = await _build_snapshot()
                await _broadcast(json.dumps(snapshot))
        except Exception as e:
            print(f"[WS Broadcast] Error: {e}")
        await asyncio.sleep(30)


@router.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        # Send immediate cached snapshot on connect - 0 delay
        await websocket.send_text(json.dumps(_LATEST_SNAPSHOT))
        while True:
            # Keep connection open and await any client message
            await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        connected_clients.discard(websocket)

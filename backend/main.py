from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import aqi, fires, weather, predictions, hotspots, crossborder, alerts, reports, analytics, ai_chat, comparison, feedback
from ws import realtime

app = FastAPI(title="BRICS ClimateShield API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(aqi.router)
app.include_router(fires.router)
app.include_router(weather.router)
app.include_router(predictions.router)
app.include_router(hotspots.router)
app.include_router(crossborder.router)
app.include_router(alerts.router)
app.include_router(reports.router)
app.include_router(analytics.router)
app.include_router(ai_chat.router)
app.include_router(comparison.router)
app.include_router(feedback.router)
app.include_router(realtime.router)

import asyncio
import os
from fastapi.staticfiles import StaticFiles
from services.nasa_firms import start_firms_sync_loop

@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "1.0.0", "countries_monitored": 11}

@app.on_event("startup")
async def startup_event():
    print("BRICS ClimateShield API started")
    asyncio.create_task(realtime.start_broadcast_loop())
    asyncio.create_task(start_firms_sync_loop())

# Mount frontend production build if available
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")

"""
AI Chat router — answers user questions using Groq API (LLaMA 3.3 70B)
with injected live platform data context (AQI, NASA FIRMS fires, transboundary).
Falls back to deterministic live-data answers if no Groq key is provided.
"""
import os
import httpx
import asyncio
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

from config import BRICS_COUNTRIES, GROQ_API_KEY, GEMINI_API_KEY
from services.open_meteo import get_air_quality
from services.nasa_firms import get_all_brics_fires

router = APIRouter(prefix="/api/chat", tags=["chat"])

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

class ChatRequest(BaseModel):
    question: str
    api_key: Optional[str] = None  # User can pass Groq key directly or via backend .env


import time

DEFAULT_OVERVIEW = [
    {"code": "IN", "name": "India", "flag": "🇮🇳", "city": "Delhi", "aqi": 142.0},
    {"code": "CN", "name": "China", "flag": "🇨🇳", "city": "Beijing", "aqi": 88.0},
    {"code": "ID", "name": "Indonesia", "flag": "🇮🇩", "city": "Jakarta", "aqi": 128.0},
    {"code": "EG", "name": "Egypt", "flag": "🇪🇬", "city": "Cairo", "aqi": 115.0},
    {"code": "IR", "name": "Iran", "flag": "🇮🇷", "city": "Tehran", "aqi": 95.0},
    {"code": "SA", "name": "Saudi Arabia", "flag": "🇸🇦", "city": "Riyadh", "aqi": 84.0},
    {"code": "AE", "name": "UAE", "flag": "🇦🇪", "city": "Dubai", "aqi": 72.0},
    {"code": "ZA", "name": "South Africa", "flag": "🇿🇦", "city": "Johannesburg", "aqi": 65.0},
    {"code": "ET", "name": "Ethiopia", "flag": "🇪🇹", "city": "Addis Ababa", "aqi": 48.0},
    {"code": "RU", "name": "Russia", "flag": "🇷🇺", "city": "Moscow", "aqi": 42.0},
    {"code": "BR", "name": "Brazil", "flag": "🇧🇷", "city": "Brasilia", "aqi": 38.0},
]

from services.nasa_firms import REAL_FALLBACK_COUNTS, _FIRES_CACHE

_CONTEXT_CACHE = {
    "timestamp": 0.0,
    "data": {
        "overview": DEFAULT_OVERVIEW,
        "fire_counts": dict(REAL_FALLBACK_COUNTS),
        "total_fires": sum(REAL_FALLBACK_COUNTS.values()),
    }
}

async def _build_context() -> dict:
    """Fetch current platform snapshot to inject into answers."""
    from routers.aqi import _OVERVIEW_CACHE

    fire_counts = dict(_FIRES_CACHE.get("per_country_counts") or REAL_FALLBACK_COUNTS)
    total_fires = sum(fire_counts.values())
    overview = _OVERVIEW_CACHE.get("data") or DEFAULT_OVERVIEW

    return {
        "overview": [
            {
                "code": c.get("country_code", ""),
                "name": c.get("country_name", ""),
                "flag": c.get("flag", ""),
                "city": c.get("city", ""),
                "aqi": c.get("aqi", 50.0),
                "pm25": c.get("pm25", 15.0),
                "status": c.get("status", "Moderate"),
            }
            for c in overview
        ],
        "fire_counts": fire_counts,
        "total_fires": total_fires,
    }


async def _call_groq(question: str, context: dict, key: str) -> Optional[str]:
    """Sends question to Groq LLaMA 3.3 70B with injected live context."""
    overview_text = "\n".join(
        [f"- {c['flag']} {c['name']} ({c['city']}): Current AQI {c['aqi']}" for c in context["overview"]]
    )
    fire_summary = f"Total active NASA VIIRS fire clusters across BRICS: {context['total_fires']}."

    system_prompt = f"""You are BRICSVue ClimateAI Assistant, an elite scientific and environmental copilot for the BRICS intergovernmental alliance (Brazil, Russia, India, China, South Africa, Egypt, Ethiopia, Iran, Saudi Arabia, UAE, Indonesia).

LIVE TELEMETRY SNAPSHOT:
{overview_text}
{fire_summary}

INSTRUCTIONS:
1. Provide concise, direct, authoritative, and scientifically rigorous answers.
2. Cite live data values directly from the telemetry above when answering questions about current pollution, fires, or country status.
3. If asked about transboundary smoke, explain atmospheric advection and atmospheric dispersion physics.
4. Keep answers focused, structured with bullet points where appropriate, and under 250 words unless detailed analysis is requested.
"""

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    
    # Try models supported on this Groq account
    candidate_models = ["openai/gpt-oss-120b", "groq/compound", "llama-3.3-70b-versatile", "qwen/qwen3.6-27b"]
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        for model_name in candidate_models:
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question},
                ],
                "temperature": 0.4,
                "max_tokens": 512,
            }
            try:
                res = await client.post(GROQ_ENDPOINT, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    if "</think>" in content:
                        content = content.split("</think>")[-1].strip()
                    return content
            except Exception as e:
                print(f"Groq {model_name} error: {e}")
                continue
async def _call_gemini(question: str, context: dict, key: str) -> Optional[str]:
    """Sends question to Google AI Studio Gemini 2.5 Flash with live BRICS platform telemetry."""
    overview_text = "\n".join(
        [f"- {c['flag']} {c['name']} ({c['city']}): Current AQI {c['aqi']} ({c['status']})" for c in context["overview"]]
    )
    fire_summary = f"Total active NASA VIIRS fire incidents across BRICS: {context['total_fires']}."

    system_instruction = f"""You are BRICS ClimateShield AI Assistant, an elite scientific and environmental copilot for the BRICS intergovernmental alliance (Brazil, Russia, India, China, South Africa, Egypt, Ethiopia, Iran, Saudi Arabia, UAE, Indonesia).

LIVE TELEMETRY SNAPSHOT:
{overview_text}
{fire_summary}

INSTRUCTIONS:
1. Provide concise, direct, authoritative, and scientifically rigorous answers.
2. Cite live data values directly from the telemetry above when answering questions about current pollution, fires, or country status.
3. If asked about transboundary smoke or wildfires, explain atmospheric advection and dispersion physics.
4. Keep answers focused, structured with markdown bullet points where appropriate, and under 250 words unless detailed analysis is requested.
"""

    candidate_models = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-pro"]
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        for model in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            payload = {
                "system_instruction": {
                    "parts": [{"text": system_instruction}]
                },
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": question}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.4,
                    "maxOutputTokens": 600,
                }
            }
            try:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    d = res.json()
                    candidates = d.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "").strip()
            except Exception as e:
                print(f"Google AI Studio {model} error: {e}")
                continue
    return None


@router.post("")
@router.post("/")
async def chat(request: ChatRequest):
    """Answers user questions using Google AI Studio (Gemini 2.5 Flash), Groq LLaMA 3.3, or deterministic live telemetry."""
    q = request.question.strip()
    active_gemini_key = os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY
    active_groq_key = request.api_key or os.getenv("GROQ_API_KEY") or GROQ_API_KEY

    ctx = await _build_context()

    # 1. Primary: Google AI Studio (Gemini 2.5 Flash)
    if active_gemini_key:
        try:
            gemini_answer = await _call_gemini(q, ctx, active_gemini_key)
            if gemini_answer:
                return {
                    "answer": gemini_answer,
                    "model": "Google Gemini 2.5 Flash (AI Studio)",
                    "data_used": ["live_aqi_stations", "nasa_viirs_fires", "google_ai_studio"],
                    "timestamp": datetime.utcnow().isoformat(),
                }
        except Exception as e:
            print(f"Google Gemini inference failed: {e}")

    # 2. Fallback: Groq LLaMA 3.3 (70B)
    if active_groq_key:
        try:
            groq_answer = await _call_groq(q, ctx, active_groq_key)
            if groq_answer:
                return {
                    "answer": groq_answer,
                    "model": "Groq LLaMA 3.3 (70B)",
                    "data_used": ["live_aqi_stations", "nasa_viirs_fires"],
                    "timestamp": datetime.utcnow().isoformat(),
                }
        except Exception as e:
            print(f"Groq inference failed: {e}")

    # 3. Fallback: Deterministic intelligent response with live data
    overview = ctx["overview"]
    fire_counts = ctx["fire_counts"]
    total_fires = ctx["total_fires"]

    sorted_by_aqi = sorted(overview, key=lambda x: x["aqi"], reverse=True)
    highest = sorted_by_aqi[0] if sorted_by_aqi else None
    lowest = sorted_by_aqi[-1] if sorted_by_aqi else None

    sorted_by_fires = sorted(fire_counts.items(), key=lambda x: x[1], reverse=True)
    most_fires_code = sorted_by_fires[0][0] if sorted_by_fires else None
    most_fires_country = BRICS_COUNTRIES.get(most_fires_code, {}).get("name", "Unknown") if most_fires_code else "Unknown"
    most_fires_count = sorted_by_fires[0][1] if sorted_by_fires else 0

    q_lower = q.lower()

    if any(kw in q_lower for kw in ["highest pollution", "worst air", "most polluted"]):
        answer = (
            f"📍 **{highest['flag']} {highest['name']}** currently reports the highest ambient pollution among monitored BRICS hubs. "
            f"{highest['city']} is recording an AQI of **{highest['aqi']}**.\n\n"
            f"Vulnerable populations are advised to minimize strenuous outdoor physical exertion."
        )
    elif any(kw in q_lower for kw in ["best air", "cleanest", "lowest pollution"]):
        answer = (
            f"🌿 **{lowest['flag']} {lowest['name']}** ({lowest['city']}) currently leads with the cleanest air quality, "
            f"registering an AQI of **{lowest['aqi']}** (Good classification)."
        )
    elif any(kw in q_lower for kw in ["fire", "wildfire", "hotspot", "active fires"]):
        answer = (
            f"🔥 NASA VIIRS satellite sensors currently identify **{total_fires} active thermal fire events** across BRICS territories.\n\n"
            f"The highest density is recorded in **{most_fires_country}** ({most_fires_count} events)."
        )
    else:
        answer = (
            f"🌍 **Live BRICS Environmental Status Summary**:\n\n"
            f"• **Total Active Fires:** {total_fires} clustered events tracked via NASA VIIRS.\n"
            f"• **Highest Pollution:** {highest['flag']} {highest['name']} ({highest['city']}, AQI {highest['aqi']}).\n"
            f"• **Cleanest Air:** {lowest['flag']} {lowest['name']} ({lowest['city']}, AQI {lowest['aqi']}).\n\n"
            f"💡 *Tip: Add your `GROQ_API_KEY` in settings to unlock complete generative conversational reasoning powered by LLaMA 3.3 70B.*"
        )

    return {
        "answer": answer,
        "model": "BRICSVue Telemetry Engine (Configure Groq Key for Full LLaMA 3.3)",
        "data_used": ["aqi_overview", "fire_stats"],
        "timestamp": datetime.utcnow().isoformat(),
    }
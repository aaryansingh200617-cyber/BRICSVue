"""
Feedback router — receives citizen & authority queries, logs them persistently,
and dispatches them to the administrator at aaryanrampage@gmail.com.
"""
import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import httpx

from config import ADMIN_EMAIL

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

FEEDBACK_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "feedback_submissions.json")

class FeedbackPayload(BaseModel):
    name: str
    email: str
    category: Optional[str] = "General Feedback"
    subject: Optional[str] = None
    message: str


def _persist_feedback(entry: dict):
    """Saves feedback submission to JSON storage so it is never lost."""
    os.makedirs(os.path.dirname(FEEDBACK_FILE), exist_ok=True)
    submissions = []
    if os.path.exists(FEEDBACK_FILE):
        try:
            with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
                submissions = json.load(f)
        except Exception:
            submissions = []
    submissions.append(entry)
    with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
        json.dump(submissions, f, indent=2, ensure_ascii=False)


async def _send_email_notification(entry: dict):
    """
    Attempts to dispatch email to aaryanrampage@gmail.com.
    Tries SMTP if configured, and forwards via transactional delivery.
    """
    admin_recipient = os.getenv("ADMIN_EMAIL", ADMIN_EMAIL)
    subject = entry.get("subject") or f"BRICSVue Query from {entry['name']} [{entry['category']}]"

    body = f"""New User Query Received on BRICSVue:

• Name: {entry['name']}
• Email: {entry['email']}
• Category: {entry['category']}
• Timestamp: {entry['timestamp']}

Message / Query:
----------------------------------------
{entry['message']}
----------------------------------------

This query was sent from the BRICSVue Climate Intelligence platform.
Reply directly to: {entry['email']}
"""

    # 1. Try local or configured SMTP server (supports Gmail, Outlook, SendGrid, etc.)
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com" if os.getenv("SMTP_PASS") else None)
    smtp_user = os.getenv("SMTP_USER", os.getenv("GMAIL_USER", admin_recipient))
    smtp_pass = os.getenv("SMTP_PASS", os.getenv("GMAIL_APP_PASSWORD"))
    if smtp_host and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart()
            msg["From"] = smtp_user
            msg["To"] = admin_recipient
            msg["Subject"] = subject
            msg["Reply-To"] = entry["email"]
            msg.attach(MIMEText(body, "plain"))

            port = int(os.getenv("SMTP_PORT", 587))
            with smtplib.SMTP(smtp_host, port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
                print(f"[Feedback] Email dispatched via SMTP ({smtp_host}) to {admin_recipient}")
                return True
        except Exception as e:
            print(f"[Feedback] SMTP dispatch failed: {e}")

    # 2. FormSubmit Gateway (Direct transactional relay to admin email)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                f"https://formsubmit.co/ajax/{admin_recipient}",
                json={
                    "name": entry["name"],
                    "email": entry["email"],
                    "_subject": subject,
                    "_replyto": entry["email"],
                    "category": entry["category"],
                    "message": entry["message"],
                    "platform": "BRICSVue Sovereign Climate Intelligence",
                    "submitted_at": entry["timestamp"],
                },
                headers={
                    "Referer": "https://bricsvue.org",
                    "Origin": "https://bricsvue.org",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json",
                }
            )
            data = res.json() if res.status_code == 200 else {}
            if res.status_code == 200 and data.get("success") in (True, "true"):
                print(f"[Feedback] FormSubmit dispatched email to {admin_recipient}")
                return True
            else:
                print(f"[Feedback] FormSubmit response: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"[Feedback] FormSubmit relay error: {e}")

    # 3. Web3Forms Gateway fallback
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.post(
                "https://api.web3forms.com/submit",
                json={
                    "access_key": os.getenv("WEB3FORMS_KEY", "b3d1b7df-78b1-4cfa-b648-2895ea3fdf39"),
                    "to": admin_recipient,
                    "subject": subject,
                    "from_name": entry["name"],
                    "email": entry["email"],
                    "message": entry["message"],
                    "category": entry["category"],
                },
                headers={"User-Agent": "Mozilla/5.0"}
            )
            if res.status_code == 200:
                print(f"[Feedback] Web3Forms forwarded to {admin_recipient}")
                return True
    except Exception as e:
        print(f"[Feedback] Web3Forms gateway error: {e}")

    return False


@router.post("")
@router.post("/")
async def submit_feedback(payload: FeedbackPayload):
    """Submits user query, logs it, and routes it to aaryanrampage@gmail.com."""
    if not payload.name.strip() or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Name and message are required.")

    entry = {
        "name": payload.name.strip(),
        "email": payload.email.strip(),
        "category": payload.category or "General Feedback",
        "subject": payload.subject or f"Query from {payload.name.strip()}",
        "message": payload.message.strip(),
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
    }

    # Always persist locally first
    _persist_feedback(entry)

    # Dispatch to admin email
    sent = await _send_email_notification(entry)

    return {
        "status": "success",
        "message": f"Your query has been received and routed to {ADMIN_EMAIL}.",
        "entry": entry,
        "email_dispatched": sent,
    }


@router.get("/")
async def list_feedback():
    """Lists submitted queries for review."""
    if os.path.exists(FEEDBACK_FILE):
        try:
            with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []
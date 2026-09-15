from fastapi import APIRouter, UploadFile, File, Form
from ai.image_analyzer import analyze_image
import uuid

router = APIRouter(prefix="/api/reports", tags=["reports"])

reports_db = []

@router.post("/")
async def create_report(
    photo: UploadFile = File(...),
    lat: float = Form(...),
    lon: float = Form(...),
    description: str = Form(...),
    reporter_type: str = Form(...)
):
    content = await photo.read()
    analysis = analyze_image(content)
    
    report = {
        "report_id": str(uuid.uuid4()),
        "lat": lat,
        "lon": lon,
        "description": description,
        "reporter_type": reporter_type,
        "analysis": analysis
    }
    reports_db.insert(0, report)
    if len(reports_db) > 50:
        reports_db.pop()
    return report

@router.get("/")
async def get_reports():
    return reports_db

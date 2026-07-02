"""
Triage API Endpoints for Apollo PFIP
AI-powered triage classification
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime
import json

from app.api import get_db
from app.models.triage import TriageRecord, PriorityLevel, TriageSource, TriageStatus
from app.models.patient import Patient
from app.models.encounter import Encounter
from app.services.triage_engine import triage_engine
from app.services.audit_logger import audit_logger

router = APIRouter(prefix="/triage", tags=["triage"])


# Pydantic schemas
class TriageCreateRequest(BaseModel):
    encounter_id: int
    chief_complaint: str
    symptoms: Optional[List[str]] = None
    vital_signs: Optional[dict] = None
    force_priority: Optional[PriorityLevel] = None


class TriageUpdateRequest(BaseModel):
    final_priority: Optional[PriorityLevel] = None
    suggested_department: Optional[str] = None
    triage_status: Optional[TriageStatus] = None
    notes: Optional[str] = None


class TriageResponse(BaseModel):
    id: int
    encounter_id: int
    patient_id: int
    chief_complaint: str
    calculated_priority: str
    final_priority: str
    ai_confidence_score: float
    suggested_department: str
    triage_status: str
   
    class Config:
        from_attributes = True


@router.post("/classify", response_model=dict)
async def classify_patient(
    request: TriageCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    AI-powered triage classification
    Analyzes chief complaint and determines P1/P2/P3 priority
    """
    # Fetch encounter
    encounter = await db.get(Encounter, request.encounter_id)
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    
    # Fetch patient
    patient = await db.get(Patient, encounter.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Run AI classification
    priority, confidence, keywords = triage_engine.classify_by_keywords(
        request.chief_complaint
    )
    
    # Calculate risk factors
    risk_factors = triage_engine.calculate_risk_factors(patient, encounter)
    
    # Get department suggestion
    suggested_dept = triage_engine.get_suggested_department(
        request.chief_complaint, risk_factors
    )
    
    return {
        "priority": priority.value,
        "confidence": confidence,
        "keywords_found": keywords,
        "risk_factors": risk_factors,
        "suggested_department": suggested_dept,
        "recommendation": _get_priority_recommendation(priority)
    }


@router.post("/records", response_model=dict)
async def create_triage_record(
    request: TriageCreateRequest,
    current_user_id: int = Query(..., description="Nurse performing triage"),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a complete triage record with AI analysis
    """
    # Fetch encounter
    encounter = await db.get(Encounter, request.encounter_id)
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    
    # Fetch patient
    patient = await db.get(Patient, encounter.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if triage already exists for this encounter
    existing = await db.execute(
        f"SELECT * FROM triage_records WHERE encounter_id = {request.encounter_id}"
    )
    # Note: This is simplified - in production use proper SQLAlchemy queries
    
    # Create triage record via service
    triage_record = await triage_engine.create_triage_record(
        db=db,
        patient=patient,
        encounter=encounter,
        chief_complaint=request.chief_complaint,
        symptoms=request.symptoms,
        vital_signs=request.vital_signs,
        nurse_id=current_user_id
    )
    
    # Override with manual priority if forced
    if request.force_priority:
        triage_record.final_priority = request.force_priority
    
    await db.commit()
    await db.refresh(triage_record)
    
    # Log the triage event
    await audit_logger.log_triage_event(
        db=db,
        user_id=current_user_id,
        triage_id=triage_record.id,
        action="create",
        new_priority=triage_record.final_priority.value,
        ai_confidence=triage_record.ai_confidence_score
    )
    
    return {
        "id": triage_record.id,
        "encounter_id": triage_record.encounter_id,
        "patient_id": triage_record.patient_id,
        "chief_complaint": triage_record.chief_complaint,
        "calculated_priority": triage_record.calculated_priority.value,
        "final_priority": triage_record.final_priority.value,
        "ai_confidence_score": triage_record.ai_confidence_score,
        "suggested_department": triage_record.suggested_department,
        "triage_status": triage_record.triage_status.value,
        "created_at": triage_record.triage_started_at.isoformat()
    }


@router.get("/records/{triage_id}", response_model=dict)
async def get_triage_record(
    triage_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a triage record by ID
    """
    from sqlalchemy import select
    result = await db.execute(
        select(TriageRecord).where(TriageRecord.id == triage_id)
    )
    triage = result.scalar_one_or_none()
    
    if not triage:
        raise HTTPException(status_code=404, detail="Triage record not found")
    
    # Parse JSON fields
    symptoms = json.loads(triage.symptoms) if triage.symptoms else []
    
    return {
        "id": triage.id,
        "encounter_id": triage.encounter_id,
        "patient_id": triage.patient_id,
        "chief_complaint": triage.chief_complaint,
        "symptoms": symptoms,
        "age": triage.age,
        "gender": triage.gender,
        "calculated_priority": triage.calculated_priority.value,
        "final_priority": triage.final_priority.value,
        "ai_confidence_score": triage.ai_confidence_score,
        "suggested_department": triage.suggested_department,
        "triage_status": triage.triage_status.value,
        "vital_signs": {
            "temperature": triage.temperature_celsius,
            "heart_rate": triage.heart_rate_bpm,
            "bp_systolic": triage.blood_pressure_systolic,
            "bp_diastolic": triage.blood_pressure_diastolic,
            "oxygen_saturation": triage.oxygen_saturation
        },
        "risk_factors": {
            "cardiac": triage.cardiac_risk,
            "respiratory": triage.respiratory_risk,
            "neurological": triage.neurological_risk,
            "geriatric": triage.geriatric_risk,
            "pediatric": triage.pediatric_risk,
            "obstetric": triage.obstetric_risk
        } if triage.risk_factors else {},
        "created_at": triage.triage_started_at.isoformat()
    }


@router.get("/records/encounter/{encounter_id}", response_model=dict)
async def get_triage_by_encounter(
    encounter_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get triage record for an encounter
    """
    from sqlalchemy import select
    result = await db.execute(
        select(TriageRecord).where(TriageRecord.encounter_id == encounter_id)
    )
    triage = result.scalar_one_or_none()
    
    if not triage:
        raise HTTPException(status_code=404, detail="No triage found for this encounter")
    
    return {
        "id": triage.id,
        "final_priority": triage.final_priority.value,
        "ai_confidence_score": triage.ai_confidence_score,
        "suggested_department": triage.suggested_department,
        "triage_status": triage.triage_status.value,
        "created_at": triage.triage_started_at.isoformat()
    }


@router.put("/records/{triage_id}", response_model=dict)
async def update_triage_record(
    triage_id: int,
    request: TriageUpdateRequest,
    current_user_id: int = Query(..., description="User updating triage"),
    db: AsyncSession = Depends(get_db)
):
    """
    Update triage record (review override)
    """
    from sqlalchemy import select
    result = await db.execute(
        select(TriageRecord).where(TriageRecord.id == triage_id)
    )
    triage = result.scalar_one_or_none()
    
    if not triage:
        raise HTTPException(status_code=404, detail="Triage record not found")
    
    # Store old values for audit
    old_priority = triage.final_priority.value if triage.final_priority else None
    
    # Apply updates
    if request.final_priority:
        triage.final_priority = request.final_priority
    if request.suggested_department:
        triage.suggested_department = request.suggested_department
    if request.triage_status:
        triage.triage_status = request.triage_status
        if request.triage_status == TriageStatus.COMPLETED:
            triage.review_completed_at = datetime.utcnow()
    if request.notes:
        triage.notes = request.notes
    
    await db.commit()
    await db.refresh(triage)
    
    # Log the update
    await audit_logger.log_triage_event(
        db=db,
        user_id=current_user_id,
        triage_id=triage.id,
        action="update",
        old_priority=old_priority,
        new_priority=triage.final_priority.value
    )
    
    return {
        "message": "Triage updated successfully",
        "id": triage.id,
        "final_priority": triage.final_priority.value
    }


@router.get("/queue/priority")
async def get_queue_priority(
    encounter_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Calculate priority score for queue ordering
    """
    from sqlalchemy import select
    from app.models.queue import QueueEntry
    
    # Get triage record
    result = await db.execute(
        select(TriageRecord).where(TriageRecord.encounter_id == encounter_id)
    )
    triage = result.scalar_one_or_none()
    
    if not triage:
        raise HTTPException(status_code=404, detail="No triage found")
    
    # Get current queue position
    queue_result = await db.execute(
        select(QueueEntry).where(
            QueueEntry.encounter_id == encounter_id,
            QueueEntry.status == "WAITING"
        )
    )
    queue_entry = queue_result.scalar_one_or_none()
    position = queue_entry.queue_position if queue_entry else 0
    
    # Calculate priority score
    priority_score = triage_engine.prioritize_queue_order(triage, position)
    
    return {
        "encounter_id": encounter_id,
        "priority": triage.final_priority.value,
        "queue_position": position,
        "priority_score": round(priority_score, 2),
        "classification": _get_priority_classification(priority_score)
    }


def _get_priority_recommendation(priority: PriorityLevel) -> str:
    """Get recommendation text based on priority"""
    recommendations = {
        PriorityLevel.P1: "Immediate medical attention required. Direct to emergency/critical care.",
        PriorityLevel.P2: "Urgent assessment needed. Prioritize within 30 minutes.",
        PriorityLevel.P3: "Standard queue. Assessment within 2 hours."
    }
    return recommendations.get(priority, "Standard assessment")


def _get_priority_classification(score: float) -> str:
    """Classify based on priority score"""
    if score >= 100:
        return "IMMEDIATE"
    elif score >= 50:
        return "URGENT"
    else:
        return "ROUTINE"

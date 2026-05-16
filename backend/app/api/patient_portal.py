from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import secrets
import string
from app.db.session import get_db
from app.models.patient import Patient
from app.models.patient_session import PatientSession
from app.models.encounter import Encounter, EncounterStatus
from app.schemas.patient_session import (
    PatientSessionCreate,
    PatientSessionResponse,
    PatientLoginRequest,
    PatientLoginResponse,
)
from app.middleware.auth import get_current_user
from app.core.security import create_access_token
from app.core.config import settings

router = APIRouter(prefix="/patient-portal", tags=["Patient Portal"])


def generate_session_password(length: int = 8) -> str:
    """Generate random alphanumeric password for patient session"""
    chars = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(chars) for _ in range(length))


@router.post("/sessions", response_model=PatientSessionResponse, status_code=status.HTTP_201_CREATED)
async def generate_patient_session(
    session_data: PatientSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Generate temporary session credentials for patient after registration.
    Called by receptionist after registering a new patient.
    """
    tenant_id = current_user.get("tenant_id")

    # Verify patient exists
    result = await db.execute(
        select(Patient).where(
            Patient.id == session_data.patient_id,
            Patient.tenant_id == tenant_id,
            Patient.is_active == True,
        )
    )
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Check if an active session already exists
    result = await db.execute(
        select(PatientSession).where(
            PatientSession.patient_id == session_data.patient_id,
            PatientSession.is_active == True,
        )
    )
    existing_session = result.scalar_one_or_none()

    if existing_session:
        raise HTTPException(
            status_code=400,
            detail="Patient already has an active session. End previous session first.",
        )

    # Determine expiration time (default: end of day or 12 hours from now)
    expires_at = session_data.expires_at or (datetime.utcnow() + timedelta(hours=12))

    # Generate session password
    session_password = generate_session_password()

    # Create session
    patient_session = PatientSession(
        patient_id=session_data.patient_id,
        session_password=session_password,
        expires_at=expires_at,
        purpose=session_data.purpose,
        doctor_id=current_user.get("user_id"),
        tenant_id=tenant_id,
    )

    db.add(patient_session)
    await db.commit()
    await db.refresh(patient_session)

    return patient_session


@router.post("/login", response_model=PatientLoginResponse)
async def patient_login(
    login_data: PatientLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Patient login with temporary session ID and password.
    Returns JWT token valid only for patient portal.
    """
    # Find session
    result = await db.execute(
        select(PatientSession).where(
            PatientSession.patient_id == login_data.patient_id,
            PatientSession.session_password == login_data.session_password,
            PatientSession.is_active == True,
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=401, detail="Invalid patient ID or session password"
        )

    # Check if session expired
    if datetime.utcnow() > session.expires_at:
        session.is_active = False
        await db.commit()
        raise HTTPException(status_code=401, detail="Session has expired")

    # Get patient info
    result = await db.execute(
        select(Patient).where(Patient.id == login_data.patient_id)
    )
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Update last accessed time
    session.last_accessed = datetime.utcnow()
    await db.commit()

    # Create JWT token with patient-specific claims
    access_token = create_access_token(
        data={
            "sub": str(patient.id),
            "patient_id": patient.id,
            "type": "patient",
            "tenant_id": session.tenant_id,
        }
    )

    return PatientLoginResponse(
        access_token=access_token,
        patient_id=patient.id,
        patient_name=f"{patient.first_name} {patient.last_name}",
        session_expires_at=session.expires_at,
    )


@router.get("/dashboard")
async def get_patient_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Get patient's current journey status - where they are in the hospital workflow.
    Shows current encounter, next steps, tests needed, etc.
    """
    patient_id = current_user.get("patient_id")

    if not patient_id:
        raise HTTPException(
            status_code=401, detail="This endpoint requires patient authentication"
        )

    # Get patient info
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Get active encounter
    result = await db.execute(
        select(Encounter).where(
            Encounter.patient_id == patient_id,
            Encounter.is_active == True,
            Encounter.status.in_(
                [EncounterStatus.CHECKED_IN, EncounterStatus.IN_QUEUE, EncounterStatus.IN_PROGRESS]
            ),
        )
    )
    active_encounter = result.scalar_one_or_none()

    # Get all encounters for journey history
    result = await db.execute(
        select(Encounter).where(
            Encounter.patient_id == patient_id, Encounter.is_active == True
        )
    )
    encounters = result.scalars().all()

    return {
        "patient": {
            "id": patient.id,
            "name": f"{patient.first_name} {patient.last_name}",
            "mrn": patient.mrn,
            "patient_type": patient.patient_type,
            "registered_at": patient.created_at,
        },
        "active_encounter": {
            "id": active_encounter.id,
            "status": active_encounter.status,
            "department": active_encounter.department,
            "chief_complaint": active_encounter.chief_complaint,
            "priority": active_encounter.priority,
            "check_in_time": active_encounter.check_in_time,
            "current_station": active_encounter.current_station_id,
        }
        if active_encounter
        else None,
        "journey": [
            {
                "status": enc.status,
                "department": enc.department,
                "timestamp": enc.created_at,
                "doctor": enc.assigned_doctor_id,
            }
            for enc in encounters
        ],
        "next_steps": (
            {
                "action": "Tests Ordered"
                if active_encounter.tests_ordered
                else "Awaiting Doctor",
                "location": "Lab" if active_encounter.tests_ordered else "Waiting Room",
                "estimated_time": "30 min",
            }
            if active_encounter
            else None
        ),
    }


@router.get("/notifications")
async def get_patient_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get real-time notifications for patient (tests ordered, location changes, etc)"""
    patient_id = current_user.get("patient_id")

    if not patient_id:
        raise HTTPException(
            status_code=401, detail="This endpoint requires patient authentication"
        )

    # Get active encounter to extract notifications
    result = await db.execute(
        select(Encounter).where(
            Encounter.patient_id == patient_id,
            Encounter.is_active == True,
            Encounter.status.in_(
                [EncounterStatus.CHECKED_IN, EncounterStatus.IN_QUEUE, EncounterStatus.IN_PROGRESS]
            ),
        )
    )
    encounter = result.scalar_one_or_none()

    notifications = []

    if encounter:
        # Test order notification
        if encounter.tests_ordered:
            notifications.append(
                {
                    "type": "test_ordered",
                    "title": "Lab Tests Assigned",
                    "message": "You have lab tests assigned. Visit the Lab on 2nd Floor.",
                    "timestamp": encounter.updated_at,
                    "priority": "high",
                }
            )

        # Status notifications
        if encounter.status == EncounterStatus.IN_PROGRESS:
            notifications.append(
                {
                    "type": "in_progress",
                    "title": "Doctor is Ready",
                    "message": f"Please go to {encounter.department}",
                    "timestamp": encounter.check_in_time,
                    "priority": "high",
                }
            )

    return {
        "total": len(notifications),
        "notifications": sorted(
            notifications, key=lambda x: x["timestamp"], reverse=True
        ),
    }


@router.post("/sessions/{patient_id}/end")
async def end_patient_session(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """End patient session (called by receptionist or system)"""
    tenant_id = current_user.get("tenant_id")

    result = await db.execute(
        select(PatientSession).where(
            PatientSession.patient_id == patient_id,
            PatientSession.is_active == True,
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="No active session found")

    session.is_active = False
    await db.commit()

    return {"message": "Session ended successfully"}

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
from app.db.session import get_db
from app.models.encounter import Encounter, EncounterStatus, PriorityLevel
from app.models.patient import Patient
from app.schemas.encounter import EncounterCreate, EncounterUpdate, EncounterResponse
from app.middleware.auth import get_current_user
import uuid
from datetime import datetime

router = APIRouter(prefix="/encounters", tags=["Encounters"])


@router.post("/", response_model=EncounterResponse, status_code=status.HTTP_201_CREATED)
async def create_encounter(
    encounter_data: EncounterCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new encounter (Check-in)"""
    # Verify patient exists
    result = await db.execute(
        select(Patient).where(
            Patient.id == encounter_data.patient_id,
            Patient.tenant_id == encounter_data.tenant_id,
            Patient.is_active == True
        )
    )
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Generate unique encounter ID
    encounter_id = f"ENC-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    encounter = Encounter(
        encounter_id=encounter_id,
        patient_id=encounter_data.patient_id,
        department=encounter_data.department,
        priority=encounter_data.priority,
        chief_complaint=encounter_data.chief_complaint,
        notes=encounter_data.notes,
        status=EncounterStatus.CHECKED_IN,
        tenant_id=encounter_data.tenant_id,
    )
    
    db.add(encounter)
    await db.commit()
    await db.refresh(encounter)
    
    return encounter


@router.get("/", response_model=List[EncounterResponse])
async def list_encounters(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[EncounterStatus] = None,
    department: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all encounters with optional filters"""
    tenant_id = current_user.get("tenant_id")
    
    query = select(Encounter).where(
        Encounter.tenant_id == tenant_id,
        Encounter.is_active == True
    )
    
    if status:
        query = query.where(Encounter.status == status)
    
    if department:
        query = query.where(Encounter.department == department)
    
    query = query.offset(skip).limit(limit).order_by(Encounter.created_at.desc())
    
    result = await db.execute(query)
    encounters = result.scalars().all()
    
    return encounters


@router.get("/active", response_model=List[EncounterResponse])
async def get_active_encounters(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all active encounters (not completed or cancelled)"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Encounter).where(
            Encounter.tenant_id == tenant_id,
            Encounter.is_active == True,
            Encounter.status.in_([
                EncounterStatus.CHECKED_IN,
                EncounterStatus.IN_QUEUE,
                EncounterStatus.IN_PROGRESS
            ])
        ).order_by(Encounter.check_in_time.desc())
    )
    encounters = result.scalars().all()
    
    return encounters


@router.get("/{encounter_id}", response_model=EncounterResponse)
async def get_encounter(
    encounter_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get encounter by ID"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Encounter).where(
            Encounter.id == encounter_id,
            Encounter.tenant_id == tenant_id,
            Encounter.is_active == True
        )
    )
    encounter = result.scalar_one_or_none()
    
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    
    return encounter


@router.put("/{encounter_id}", response_model=EncounterResponse)
async def update_encounter(
    encounter_id: int,
    encounter_data: EncounterUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update encounter"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Encounter).where(
            Encounter.id == encounter_id,
            Encounter.tenant_id == tenant_id,
            Encounter.is_active == True
        )
    )
    encounter = result.scalar_one_or_none()
    
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    
    # Update fields
    update_data = encounter_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(encounter, field, value)
    
    await db.commit()
    await db.refresh(encounter)
    
    return encounter


@router.post("/{encounter_id}/check-out", response_model=EncounterResponse)
async def check_out_encounter(
    encounter_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Check-out encounter (Complete)"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Encounter).where(
            Encounter.id == encounter_id,
            Encounter.tenant_id == tenant_id,
            Encounter.is_active == True
        )
    )
    encounter = result.scalar_one_or_none()
    
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    
    if encounter.status == EncounterStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Encounter already completed")
    
    encounter.status = EncounterStatus.COMPLETED
    encounter.check_out_time = datetime.utcnow()
    
    await db.commit()
    await db.refresh(encounter)
    
    return encounter


@router.post("/{encounter_id}/cancel", response_model=EncounterResponse)
async def cancel_encounter(
    encounter_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Cancel encounter"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Encounter).where(
            Encounter.id == encounter_id,
            Encounter.tenant_id == tenant_id,
            Encounter.is_active == True
        )
    )
    encounter = result.scalar_one_or_none()
    
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    
    encounter.status = EncounterStatus.CANCELLED
    
    await db.commit()
    await db.refresh(encounter)
    
    return encounter


@router.delete("/{encounter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_encounter(
    encounter_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Soft delete encounter"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Encounter).where(
            Encounter.id == encounter_id,
            Encounter.tenant_id == tenant_id
        )
    )
    encounter = result.scalar_one_or_none()
    
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    
    encounter.is_active = False
    await db.commit()
    
    return None

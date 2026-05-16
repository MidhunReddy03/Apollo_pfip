from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
from app.db.session import get_db
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.middleware.auth import get_current_user, get_tenant_id
import uuid
from datetime import datetime

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_data: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new patient"""
    # Generate unique patient ID
    unique_suffix = str(uuid.uuid4())[:8].upper()
    date_prefix = datetime.now().strftime('%Y%m%d')
    patient_id = f"PAT-{date_prefix}-{unique_suffix}"
    mrn = f"MRN-{date_prefix}-{unique_suffix}"
    tenant_id = current_user.get("tenant_id") or patient_data.tenant_id

    emergency_contact_name = patient_data.emergency_contact_name
    emergency_contact_phone = patient_data.emergency_contact_phone

    if patient_data.emergency_contact:
        if not emergency_contact_name:
            emergency_contact_name = patient_data.emergency_contact
        if not emergency_contact_phone:
            emergency_contact_phone = patient_data.emergency_contact
    
    patient = Patient(
        mrn=mrn,
        patient_id=patient_id,
        first_name=patient_data.first_name,
        last_name=patient_data.last_name,
        date_of_birth=patient_data.date_of_birth,
        gender=patient_data.gender.value,
        phone=patient_data.phone,
        email=patient_data.email,
        address=patient_data.address,
        patient_type=patient_data.patient_type.value,
        emergency_contact_name=emergency_contact_name,
        emergency_contact_phone=emergency_contact_phone,
        blood_group=patient_data.blood_group,
        allergies=patient_data.allergies,
        whatsapp_number=patient_data.whatsapp_number,
        whatsapp_opt_in=patient_data.whatsapp_opt_in or "no",
        tenant_id=tenant_id,
    )
    
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    
    return patient


@router.get("/", response_model=List[PatientResponse])
async def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all patients"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Patient)
        .where(Patient.tenant_id == tenant_id, Patient.is_active == True)
        .offset(skip)
        .limit(limit)
        .order_by(Patient.created_at.desc())
    )
    patients = result.scalars().all()
    
    return patients


@router.get("/search", response_model=List[PatientResponse])
async def search_patients(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Search patients by name, ID, or phone"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Patient)
        .where(
            Patient.tenant_id == tenant_id,
            Patient.is_active == True,
            or_(
                Patient.first_name.ilike(f"%{q}%"),
                Patient.last_name.ilike(f"%{q}%"),
                Patient.patient_id.ilike(f"%{q}%"),
                Patient.phone.ilike(f"%{q}%")
            )
        )
        .limit(50)
    )
    patients = result.scalars().all()
    
    return patients


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get patient by ID"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.tenant_id == tenant_id,
            Patient.is_active == True
        )
    )
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: int,
    patient_data: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update patient"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.tenant_id == tenant_id,
            Patient.is_active == True
        )
    )
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Update fields
    update_data = patient_data.model_dump(exclude_unset=True)
    if "emergency_contact" in update_data:
        legacy_contact = update_data.pop("emergency_contact")
        if legacy_contact:
            update_data.setdefault("emergency_contact_name", legacy_contact)
            update_data.setdefault("emergency_contact_phone", legacy_contact)

    for field, value in update_data.items():
        setattr(patient, field, value)
    
    await db.commit()
    await db.refresh(patient)
    
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Soft delete patient"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.tenant_id == tenant_id
        )
    )
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    patient.is_active = False
    await db.commit()
    
    return None

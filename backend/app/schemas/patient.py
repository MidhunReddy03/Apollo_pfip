from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.patient import PatientType, Gender


class PatientBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: str
    gender: Gender
    phone: str = Field(..., min_length=1, max_length=20)
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    patient_type: PatientType
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    whatsapp_number: Optional[str] = None
    whatsapp_opt_in: Optional[str] = Field(default="no", pattern="^(yes|no)$")
    # Legacy field retained for compatibility with older frontend payloads
    emergency_contact: Optional[str] = None


class PatientCreate(PatientBase):
    tenant_id: Optional[str] = None


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[Gender] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    patient_type: Optional[PatientType] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    whatsapp_number: Optional[str] = None
    whatsapp_opt_in: Optional[str] = Field(default=None, pattern="^(yes|no)$")
    emergency_contact: Optional[str] = None


class PatientResponse(PatientBase):
    id: int
    mrn: str
    patient_id: str
    tenant_id: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

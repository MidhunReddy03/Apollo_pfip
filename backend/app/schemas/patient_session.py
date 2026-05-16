from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PatientSessionCreate(BaseModel):
    """Generate session for patient after registration"""
    patient_id: int = Field(..., description="Patient ID")
    expires_at: Optional[datetime] = None  # If None, defaults to end of day
    purpose: Optional[str] = None


class PatientSessionResponse(BaseModel):
    """Session info returned after generation"""
    id: int
    patient_id: int
    session_password: str
    expires_at: datetime
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class PatientLoginRequest(BaseModel):
    """Patient login with session ID and password"""
    patient_id: int = Field(..., description="Patient ID from kiosk/registration")
    session_password: str = Field(..., description="Temporary session password")


class PatientLoginResponse(BaseModel):
    """Response after successful patient login"""
    access_token: str
    token_type: str = "bearer"
    patient_id: int
    patient_name: str
    session_expires_at: datetime

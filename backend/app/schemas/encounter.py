from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.encounter import EncounterStatus, PriorityLevel


class EncounterBase(BaseModel):
    patient_id: int
    department: str = Field(..., min_length=1, max_length=100)
    priority: PriorityLevel = PriorityLevel.NORMAL
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None


class EncounterCreate(EncounterBase):
    tenant_id: str


class EncounterUpdate(BaseModel):
    status: Optional[EncounterStatus] = None
    priority: Optional[PriorityLevel] = None
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None


class EncounterResponse(EncounterBase):
    id: int
    encounter_id: str
    status: EncounterStatus
    tenant_id: str
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

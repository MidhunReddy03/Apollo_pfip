from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.station import StationStatus, StationType


class StationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    station_type: StationType
    department: str = Field(..., min_length=1, max_length=100)
    floor: Optional[str] = None
    room_number: Optional[str] = None
    capacity: int = Field(default=1, ge=1)


class StationCreate(StationBase):
    tenant_id: str


class StationUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[StationStatus] = None
    floor: Optional[str] = None
    room_number: Optional[str] = None
    capacity: Optional[int] = None


class StationResponse(StationBase):
    id: int
    station_id: str
    status: StationStatus
    current_occupancy: int
    qr_code: Optional[str] = None
    tenant_id: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

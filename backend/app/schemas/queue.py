from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class QueueBase(BaseModel):
    encounter_id: int
    station_id: int


class QueueCreate(QueueBase):
    tenant_id: str
    priority_score: float = 0.0


class QueueUpdate(BaseModel):
    queue_position: Optional[int] = None
    priority_score: Optional[float] = None
    estimated_wait_time: Optional[int] = None


class QueueResponse(QueueBase):
    id: int
    queue_position: int
    priority_score: float
    joined_at: datetime
    called_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_wait_time: Optional[int] = None
    tenant_id: str
    
    class Config:
        from_attributes = True

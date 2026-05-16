from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Enum as SQLEnum, Text, JSON
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
from datetime import datetime
import enum


class EncounterStatus(str, enum.Enum):
    REGISTERED = "registered"
    CHECKED_IN = "checked_in"
    IN_QUEUE = "in_queue"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class PriorityLevel(str, enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"
    EMERGENCY = "emergency"


class EncounterType(str, enum.Enum):
    CONSULTATION = "consultation"
    DIAGNOSTIC = "diagnostic"
    PROCEDURE = "procedure"
    FOLLOW_UP = "follow_up"
    EMERGENCY = "emergency"


class Encounter(TenantBaseModel):
    __tablename__ = "encounters"
    
    encounter_id = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    encounter_type = Column(SQLEnum(EncounterType), nullable=False, default=EncounterType.CONSULTATION)
    status = Column(SQLEnum(EncounterStatus), nullable=False, default=EncounterStatus.REGISTERED)
    priority = Column(SQLEnum(PriorityLevel), nullable=False, default=PriorityLevel.NORMAL)
    
    check_in_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    check_out_time = Column(DateTime, nullable=True)
    
    department = Column(String(100), nullable=False)
    chief_complaint = Column(Text, nullable=True)
    symptoms = Column(Text, nullable=True)
    
    vitals = Column(JSON, nullable=True)
    tests_ordered = Column(JSON, nullable=True)
    tests_completed = Column(JSON, nullable=True)
    
    diagnosis = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    prescriptions = Column(JSON, nullable=True)
    
    follow_up_required = Column(String(10), nullable=False, default="no")
    follow_up_date = Column(String(50), nullable=True)
    
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=True)
    current_station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)
    
    wait_time_minutes = Column(Integer, nullable=True)
    service_time_minutes = Column(Integer, nullable=True)
    
    notes = Column(Text, nullable=True)
    extra_metadata = Column(JSON, nullable=True)
    
    patient = relationship("Patient", backref="encounters")

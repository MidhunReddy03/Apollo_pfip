"""
AI Triage Models for Apollo PFIP
P1/P2/P3 classification system based on Apollo protocols
"""

from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Float, Enum as SQLEnum, Text, JSON
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
from datetime import datetime
import enum


class PriorityLevel(str, enum.Enum):
    """Triage priority levels following Apollo protocols"""
    P1 = "p1"          # Critical/Red - Immediate attention (< 30 mins)
    P2 = "p2"          # Urgent/Yellow - Rapid attention (< 1 hour)
    P3 = "p3"          # Routine/Green - Standard queue (< 2 hours)


class TriageSource(str, enum.Enum):
    """Source of triage decision"""
    AI_AUTOMATED = "ai_automated"
    AI_ASSISTED = "ai_assisted"
    MANUAL_NURSE = "manual_nurse"
    MANUAL_DOCTOR = "manual_doctor"
    SYSTEM_DEFAULT = "system_default"


class TriageStatus(str, enum.Enum):
    """Status of triage process"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERRIDDEN = "overridden"
    CANCELLED = "cancelled"


class TriageRecord(TenantBaseModel):
    """
    Complete triage record for patient encounter
    Captures AI analysis, nurse validation, and final priority
    """
    __tablename__ = "triage_records"
    
    # Core identifiers
    encounter_id = Column(Integer, ForeignKey("encounters.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    # Nurse/Practitioner
    triage_nurse_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    supervising_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Patient symptoms and complaints
    chief_complaint = Column(Text, nullable=False)
    chief_complaint_normalized = Column(Text, nullable=True)     # AI-processed version
    
    # Detailed symptoms (structured)
    symptoms = Column(JSON, nullable=True)                       # List of {symptom: str, severity: number}
    symptom_onset = Column(String(50), nullable=True)           # Acute (<24h), Subacute (1-7d), Chronic (>7d)
    symptom_location = Column(String(200), nullable=True)       # Where the symptom is located
    
    # Patient context
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=True)
    pregnancy_status = Column(String(20), nullable=True)         # For female patients
    
    # Clinical measurements
    temperature_celsius = Column(Float, nullable=True)
    heart_rate_bpm = Column(Integer, nullable=True)
    blood_pressure_systolic = Column(Integer, nullable=True)
    blood_pressure_diastolic = Column(Integer, nullable=True)
    respiratory_rate = Column(Integer, nullable=True)
    oxygen_saturation = Column(Integer, nullable=True)          # SpO2 %
    blood_sugar = Column(Float, nullable=True)                    # mg/dL or mmol/L
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    
    # Mobility assessment (Apollo-specific)
    mobility_score = Column(String(20), nullable=True)          # Ambulatory, Wheelchair, Bedridden
    gait_assessment = Column(String(50), nullable=True)         # Normal, Limping, Assisted
    pain_score = Column(Integer, nullable=True)                 # 0-10 scale
    
    # Risk factors identified
    risk_factors = Column(JSON, nullable=True)                   # List of risk factors
    allergies = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    medical_history = Column(Text, nullable=True)
    
    # AI classification
    calculated_priority = Column(SQLEnum(PriorityLevel), nullable=True)
    ai_confidence_score = Column(Float, nullable=True)          # 0.0-1.0
    
    # AI analysis details (for transparency)
    keywords_identified = Column(JSON, nullable=True)            # List of keywords found
    risk_score_components = Column(JSON, nullable=True)         # {cardiac: 0.8, respiratory: 0.3, ...}
    
    # Risk categories based on Apollo protocols
    cardiac_risk = Column(Float, nullable=True)                 # 0.0-1.0
    respiratory_risk = Column(Float, nullable=True)
    neurological_risk = Column(Float, nullable=True)
    surgical_risk = Column(Float, nullable=True)
    obstetric_risk = Column(Float, nullable=True)               # Pregnancy-related
    pediatric_risk = Column(Float, nullable=True)
    geriatric_risk = Column(Float, nullable=True)               # Age-related (>65)
    
    # Final priority (after nurse review)
    final_priority = Column(SQLEnum(PriorityLevel), nullable=False)
    priority_override = Column(Boolean, default=False, nullable=False)
    override_reason = Column(Text, nullable=True)
    override_justification = Column(Text, nullable=True)
    
    # Source tracking
    source = Column(SQLEnum(TriageSource), nullable=False, default=TriageSource.AI_ASSISTED)
    status = Column(SQLEnum(TriageStatus), nullable=False, default=TriageStatus.COMPLETED)
    
    # Department and speciality assignment
    suggested_department = Column(String(100), nullable=True)
    suggested_speciality = Column(String(100), nullable=True)
    
    # Timing
    triage_started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    triage_completed_at = Column(DateTime, nullable=True)
    review_completed_at = Column(DateTime, nullable=True)
    
    # Notes
    nurse_notes = Column(Text, nullable=True)
    system_notes = Column(Text, nullable=True)
    clinical_notes = Column(Text, nullable=True)
    
    # Quality metrics
    triage_quality_score = Column(Float, nullable=True)         # Post-consultation validation
    disposition_accuracy = Column(Float, nullable=True)         # How accurate was the triage?
    
    # Apollo integration
    apollo_protocol_version = Column(String(20), nullable=True)  # Which Apollo protocol version used
    apollo_clinic_code = Column(String(50), nullable=True)       # Which Apollo clinic
    
    # Relationships
    encounter = relationship("Encounter", backref="triage_records")
    patient = relationship("Patient", backref="triage_records")
    nurse = relationship("User", foreign_keys=[triage_nurse_id])
    doctor = relationship("User", foreign_keys=[supervising_doctor_id])

    def __repr__(self):
        return f"<TriageRecord {self.final_priority} for Patient {self.patient_id}>"
    
    @property
    def triage_duration_minutes(self):
        """Calculate triage duration in minutes"""
        if not self.triage_completed_at:
            return None
        return (self.triage_completed_at - self.triage_started_at).total_seconds() / 60
    
    @property
    def is_ai_priority_match(self):
        """Check if AI priority matches final priority"""
        if not self.calculated_priority:
            return True  # No AI calculation available
        return self.calculated_priority.value == self.final_priority.value
    
    @property
    def severity_color(self):
        """Get CSS color for priority display"""
        colors = {
            "p1": "#DC2626",  # Red
            "p2": "#F59E0B",  # Amber
            "p3": "#10B981",  # Green
        }
        return colors.get(self.final_priority.value, "#6B7280")  # Gray fallback
    
    @property
    def is_high_risk(self):
        """Check if patient has any red flags"""
        return (self.cardiac_risk and self.cardiac_risk > 0.7) or \
               (self.respiratory_risk and self.respiratory_risk > 0.7) or \
               (self.neurological_risk and self.neurological_risk > 0.7)
    
    @property
    def vitals_summary(self):
        """Format vital signs for display"""
        vitals = []
        if self.temperature_celsius:
            vitals.append(f"Temp: {self.temperature_celsius:.1f}°C")
        if self.heart_rate_bpm:
            vitals.append(f"HR: {self.heart_rate_bpm} bpm")
        if self.blood_pressure_systolic and self.blood_pressure_diastolic:
            vitals.append(f"BP: {self.blood_pressure_systolic}/{self.blood_pressure_diastolic}")
        if self.oxygen_saturation:
            vitals.append(f"SpO2: {self.oxygen_saturation}%")
        return ", ".join(vitals)


class TriageAuditRecord(TenantBaseModel):
    """
    Audit trail for triage decision making
    Records every step in the triage process
    """
    __tablename__ = "triage_audit_records"
    
    triage_record_id = Column(Integer, ForeignKey("triage_records.id"), nullable=False)
    action = Column(String(50), nullable=False)                  # create, update, override, validate
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_role = Column(String(50), nullable=True)
    
    # Before/After states
    previous_priority = Column(String(20), nullable=True)
    new_priority = Column(String(20), nullable=True)
    
    # Context
    reason = Column(Text, nullable=True)
    clinical_basis = Column(Text, nullable=True)
    
    # Technical details
    ai_model_version = Column(String(50), nullable=True)
    ai_used_keywords = Column(JSON, nullable=True)
    ai_suggested_department = Column(String(100), nullable=True)
    
    # Timing
    occurred_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    triage_record = relationship("TriageRecord")
    actor = relationship("User")
    
    def __repr__(self):
        return f"<TriageAudit {self.action} for Triage {self.triage_record_id}>"
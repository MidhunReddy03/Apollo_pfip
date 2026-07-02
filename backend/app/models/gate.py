"""
Discharge Gate Models for Apollo PFIP
Handles Lab Reports, Pharmacy, and Clearance gates
"""

from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Enum as SQLEnum, Text, Boolean
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
from datetime import datetime
import enum


class GateType(str, enum.Enum):
    """Types of discharge gates following Apollo workflow"""
    LAB_REPORTS = "lab_reports"
    PHARMACY = "pharmacy"
    CLEARANCE = "clearance"


class GateStatus(str, enum.Enum):
    """Gate clearance status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Gate(TenantBaseModel):
    """
    Discharge Gate model for tracking each step of the discharge process
    Maps to Apollo's discharge requirements
    """
    __tablename__ = "gates"
    
    # Core identifiers
    encounter_id = Column(Integer, ForeignKey("encounters.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    # Gate properties
    gate_type = Column(SQLEnum(GateType), nullable=False)
    gate_status = Column(SQLEnum(GateStatus), nullable=False, default=GateStatus.PENDING)
    
    # Apollo-specific fields
    reference_number = Column(String(100), nullable=True)  # Lab No, Prescription No, etc.
    department = Column(String(100), nullable=True)         # Which department handles this gate
    
    # Timing
    initiated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    
    # For Lab Reports Gate
    lab_tests_ordered = Column(Text, nullable=True)       # JSON array of tests
    lab_tests_completed = Column(Text, nullable=True)      # JSON array of completed tests
    lab_report_available = Column(Boolean, default=False, nullable=False)
    lab_report_url = Column(String(500), nullable=True)    # Link to digital report
    
    # For Pharmacy Gate
    medications_prescribed = Column(Text, nullable=True)    # JSON array of medications
    medications_dispensed = Column(Text, nullable=True)     # JSON array of dispensed meds
    pharmacy_notes = Column(Text, nullable=True)
    pickup_location = Column(String(100), nullable=True)
    
    # For Clearance Gate
    clearance_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    clearance_notes = Column(Text, nullable=True)
    clearance_reason = Column(String(200), nullable=True)   # Why clearance is needed
    
    # QR Exit Pass
    exit_pass_generated = Column(Boolean, default=False, nullable=False)
    exit_pass_qr = Column(String(500), nullable=True)       # QR code data/storage path
    exit_pass_issued_at = Column(DateTime, nullable=True)
    exit_pass_expires_at = Column(DateTime, nullable=True)
    
    # Apollo integration
    apollo_lab_id = Column(String(50), nullable=True)      # Apollo Diagnostics reference
    apollo_pharmacy_id = Column(String(50), nullable=True)   # Apollo Pharmacy reference
    apollo_doctor_id = Column(String(50), nullable=True)    # Apollo Doctor reference
    
    # Audit trail
    last_updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    audit_log = Column(Text, nullable=True)                # JSON array of status changes
    
    # Relationships
    encounter = relationship("Encounter", backref="gates")
    patient = relationship("Patient", backref="gates")
    doctor = relationship("User", foreign_keys=[clearance_doctor_id])
    updater = relationship("User", foreign_keys=[last_updated_by])

    def __repr__(self):
        return f"<Gate {self.gate_type}: {self.gate_status} for Encounter {self.encounter_id}>"
    
    @property
    def is_completed(self):
        """Check if gate is fully completed"""
        return self.gate_status == GateStatus.COMPLETED
    
    @property
    def processing_time_minutes(self):
        """Calculate processing time in minutes"""
        if not self.completed_at:
            return None
        return (self.completed_at - self.initiated_at).total_seconds() / 60
    
    def can_generate_exit_pass(self):
        """
        Check if this gate allows exit pass generation
        Following Apollo's rules:
        - Lab Reports: All tests completed and report available
        - Pharmacy: All medications dispensed
        - Clearance: Doctor has approved
        """
        if self.gate_status != GateStatus.COMPLETED:
            return False
        
        if self.gate_type == GateType.LAB_REPORTS:
            return self.lab_report_available
        elif self.gate_type == GateType.PHARMACY:
            # Check if all prescribed medications are dispensed
            return True  # TODO: Implement actual check
        elif self.gate_type == GateType.CLEARANCE:
            return self.clearance_doctor_id is not None
        
        return False


class ExitPass(TenantBaseModel):
    """
    Digital Exit Pass for patient discharge
    QR-based, following Apollo's digital pass system
    """
    __tablename__ = "exit_passes"
    
    # Core identifiers
    encounter_id = Column(Integer, ForeignKey("encounters.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    gate_id = Column(Integer, ForeignKey("gates.id"), nullable=False)
    
    # QR code data
    qr_data = Column(Text, nullable=False)                   # Encrypted QR payload
    qr_image_path = Column(String(500), nullable=True)      # Generated QR image path
    
    # Pass details
    pass_code = Column(String(50), unique=True, nullable=False, index=True)
    valid_from = Column(DateTime, default=datetime.utcnow, nullable=False)
    valid_until = Column(DateTime, nullable=False)          # Typically 24 hours from generation
    
    # Security
    is_active = Column(Boolean, default=True, nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    used_at = Column(DateTime, nullable=True)
    used_by_station = Column(String(100), nullable=True)
    used_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Apollo integration
    apollo_patient_id = Column(String(50), nullable=True)
    apollo_facility_code = Column(String(50), nullable=True)
    
    # Metadata
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Relationships
    encounter = relationship("Encounter", backref="exit_passes")
    patient = relationship("Patient", backref="exit_passes")
    gate = relationship("Gate", backref="exit_passes")
    generator = relationship("User", foreign_keys=[generated_by])
    user = relationship("User", foreign_keys=[used_by_user_id])

    def __repr__(self):
        return f"<ExitPass {self.pass_code}: {'Active' if self.is_active else 'Inactive'}>"
    
    @property
    def is_valid(self):
        """Check if exit pass is currently valid"""
        if not self.is_active:
            return False
        if self.is_used:
            return False
            
        now = datetime.utcnow()
        return self.valid_from <= now <= self.valid_until
    
    @property
    def remaining_validity_hours(self):
        """Hours until pass expires"""
        if not self.is_active or self.is_used:
            return 0
            
        now = datetime.utcnow()
        if now > self.valid_until:
            return 0
            
        return (self.valid_until - now).total_seconds() / 3600
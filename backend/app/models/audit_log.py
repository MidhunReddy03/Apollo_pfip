"""
Audit Log Model for Apollo PFIP
100% logging of critical transitions as per PFIP requirements
"""

from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text, JSON
from app.models.base import TenantBaseModel
from datetime import datetime
import enum


class AuditAction(str, enum.Enum):
    """Types of audit actions"""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    VIEW = "view"
    LOGIN = "login"
    LOGOUT = "logout"
    EXPORT = "export"
    IMPORT = "import"
    APPROVE = "approve"
    REJECT = "reject"
    SYSTEM = "system"


class AuditResource(str, enum.Enum):
    """Auditable resources"""
    PATIENT = "patient"
    ENCOUNTER = "encounter"
    USER = "user"
    STATION = "station"
    QUEUE = "queue"
    GATE = "gate"
    EXIT_PASS = "exit_pass"
    TRIAGE = "triage"
    SYSTEM = "system"


class AuditLog(TenantBaseModel):
    """
    Comprehensive audit trail logging
    Logs 100% of critical transitions as per PFIP requirements
    """
    __tablename__ = "audit_logs"
    
    # User context
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nullable for system actions
    username = Column(String(100), nullable=True)
    user_role = Column(String(50), nullable=True)
    user_tenant_id = Column(String(50), nullable=True)  # Store tenant at time of action
    
    # Action context
    action = Column(String(50), nullable=False)                    # Enum stored as string
    resource = Column(String(50), nullable=False)                # Enum stored as string
    
    # Resource identification
    resource_id = Column(String(50), nullable=True)               # Usually model ID as string
    resource_name = Column(String(200), nullable=True)            # Human-readable name
    
    # Department/context
    department = Column(String(100), nullable=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)
    
    # Change details
    previous_state = Column(JSON, nullable=True)                   # Old data as JSON
    new_state = Column(JSON, nullable=True)                       # New data as JSON
    
    # For updates: specific changes
    changed_fields = Column(JSON, nullable=True)                  # Array of changed field names
    old_values = Column(JSON, nullable=True)                      # Old values for changed fields
    new_values = Column(JSON, nullable=True)                      # New values for changed fields
    
    # Technical context
    ip_address = Column(String(45), nullable=True)                # IPv4 or IPv6
    user_agent = Column(Text, nullable=True)
    request_path = Column(String(500), nullable=True)
    request_method = Column(String(10), nullable=True)
    request_id = Column(String(100), nullable=True)              # Correlation ID
    
    # Apollo integration
    apollo_system_id = Column(String(50), nullable=True)        # If integrated with Apollo systems
    apollo_facility_code = Column(String(50), nullable=True)     # Which Apollo facility
    
    # Timing
    occurred_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Security & Compliance
    is_hipaa_compliant = Column(Boolean, default=True, nullable=False)
    is_sensitive = Column(Boolean, default=False, nullable=False)
    redacted = Column(Boolean, default=False, nullable=False)   # If data was redacted
    
    # For clinical safety
    clinical_context = Column(Text, nullable=True)               # Medical context of action
    patient_impact = Column(String(200), nullable=True)         # How action affects patient
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    station = relationship("Station")
    
    def __repr__(self):
        return f"<AuditLog {self.action} {self.resource} by {self.username} at {self.occurred_at}>"
    
    @property
    def is_critical(self):
        """Determine if this is a critical transition as per PFIP requirements"""
        critical_resources = {"patient", "encounter", "queue", "gate", "triage", "exit_pass"}
        critical_actions = {"create", "update", "delete", "approve", "reject"}
        
        return (self.resource in critical_resources and 
                self.action in critical_actions)
    
    @property
    def delta_summary(self):
        """Text summary of changes"""
        if not self.changed_fields or not self.old_values or not self.new_values:
            return "No field changes recorded"
        
        changes = []
        for i, field in enumerate(self.changed_fields):
            old_val = self.old_values[i] if i < len(self.old_values) else None
            new_val = self.new_values[i] if i < len(self.new_values) else None
            
            if old_val != new_val:
                changes.append(f"{field}: '{old_val}' → '{new_val}'")
        
        return "; ".join(changes) if changes else "No changes"


class TriageAudit(TenantBaseModel):
    """
    Specialized audit trail for triage actions
    Critical for clinical safety and liability
    """
    __tablename__ = "triage_audits"
    
    # Triage context
    triage_id = Column(Integer, ForeignKey("triage_records.id"), nullable=False)
    encounter_id = Column(Integer, ForeignKey("encounters.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    # Who did the triage
    nurse_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    nurse_name = Column(String(200), nullable=True)
    
    # Triage data
    chief_complaint = Column(Text, nullable=True)
    vital_signs = Column(JSON, nullable=True)                    # Initial vitals
    calculated_priority = Column(String(20), nullable=True)     # AI-calculated priority
    final_priority = Column(String(20), nullable=True)           # Nurse-finalized priority
    
    # AI inference data (for ML transparency)
    ai_model_version = Column(String(50), nullable=True)
    ai_confidence_score = Column(String(20), nullable=True)
    ai_factors_considered = Column(JSON, nullable=True)
    
    # Risk factors identified
    red_flags = Column(JSON, nullable=True)                      # Critical symptoms
    yellow_flags = Column(JSON, nullable=True)                    # Warning symptoms
    
    # Clinical context
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    comorbidities = Column(JSON, nullable=True)                   # Pre-existing conditions
    medications = Column(JSON, nullable=True)                     # Current medications
    
    # Override information (if nurse changed AI suggestion)
    override_reason = Column(Text, nullable=True)
    override_justification = Column(Text, nullable=True)
    
    # Timing
    triage_started_at = Column(DateTime, nullable=True)
    triage_completed_at = Column(DateTime, nullable=True)
    
    # Quality & Safety
    quality_check_passed = Column(Boolean, nullable=True)
    peer_reviewed = Column(Boolean, default=False, nullable=False)
    peer_reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    triage_record = relationship("TriageRecord", foreign_keys=[triage_id])
    encounter = relationship("Encounter")
    patient = relationship("Patient")
    nurse = relationship("User", foreign_keys=[nurse_id])
    peer_reviewer = relationship("User", foreign_keys=[peer_reviewer_id])
    
    def __repr__(self):
        return f"<TriageAudit {self.final_priority or self.calculated_priority} for Encounter {self.encounter_id}>"
    
    @property
    def triage_duration_minutes(self):
        """Calculate triage duration in minutes"""
        if not self.triage_started_at or not self.triage_completed_at:
            return None
        return (self.triage_completed_at - self.triage_started_at).total_seconds() / 60
    
    @property
    def was_ai_overridden(self):
        """Check if AI recommendation was overridden"""
        return (self.calculated_priority is not None and 
                self.final_priority is not None and
                self.calculated_priority != self.final_priority)
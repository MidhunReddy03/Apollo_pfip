from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Boolean
from app.models.base import TenantBaseModel
from datetime import datetime, timedelta


class PatientSession(TenantBaseModel):
    """Temporary session credentials for patients - valid only during hospital visit"""
    __tablename__ = "patient_sessions"
    
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    session_password = Column(String(50), nullable=False)  # Temporary password
    
    # Session validity
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)  # End of hospital visit
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Additional info
    purpose = Column(String(100), nullable=True)  # e.g., "General Checkup"
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # For tracking portal access
    last_accessed = Column(DateTime, nullable=True)
    device_info = Column(String(200), nullable=True)  # Browser/device info

from sqlalchemy import Column, Integer, String, Text, JSON, Enum as SQLEnum
from app.models.base import TenantBaseModel
import enum


class PatientType(str, enum.Enum):
    """Patient classification types"""
    IP = "ip"  # In-Patient
    OP = "op"  # Out-Patient
    HC = "hc"  # Health Check


class Gender(str, enum.Enum):
    """Patient gender options"""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class PatientStatus(str, enum.Enum):
    """Patient status in the system"""
    REGISTERED = "registered"
    CHECKED_IN = "checked_in"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Patient(TenantBaseModel):
    """Enhanced Patient model with classification and workflow"""
    __tablename__ = "patients"

    # Basic Information
    mrn = Column(String(50), unique=True, nullable=False, index=True)  # Medical Record Number
    patient_id = Column(String(50), unique=True, nullable=False, index=True)  # System-generated ID
    
    # Personal Details
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(String(20), nullable=False)
    gender = Column(String(20), nullable=False)
    
    # Contact Information
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    
    # Emergency Contact
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    
    # Classification
    patient_type = Column(String(10), nullable=False, default="op")
    status = Column(String(20), nullable=False, default="registered")
    
    # Medical Information
    blood_group = Column(String(10), nullable=True)
    allergies = Column(Text, nullable=True)
    medical_history = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    
    # WhatsApp Bot Integration
    whatsapp_number = Column(String(20), nullable=True)
    whatsapp_opt_in = Column(String(10), nullable=False, default="no")
    
    # Additional Metadata
    notes = Column(Text, nullable=True)
    extra_metadata = Column(JSON, nullable=True)  # For flexible additional data

    def __repr__(self):
        return f"<Patient {self.patient_id}: {self.first_name} {self.last_name}>"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

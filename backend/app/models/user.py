from sqlalchemy import Column, String, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
import enum


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    HOSPITAL_ADMIN = "hospital_admin"
    FLOOR_MANAGER = "floor_manager"
    RECEPTIONIST = "receptionist"
    TECHNICIAN = "technician"
    DOCTOR = "doctor"
    PATIENT = "patient"


class User(TenantBaseModel):
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.PATIENT)
    
    # Relationships will be added as we build other modules

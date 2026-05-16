from sqlalchemy import Column, String, Enum as SQLEnum, Integer, Boolean
from app.models.base import TenantBaseModel
import enum


class StationStatus(str, enum.Enum):
    FREE = "free"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"
    OFFLINE = "offline"


class StationType(str, enum.Enum):
    XRAY = "xray"
    ECG = "ecg"
    ULTRASOUND = "ultrasound"
    TREADMILL = "treadmill"
    VITAL_CHECK = "vital_check"
    BLOOD_TEST = "blood_test"
    CONSULTATION = "consultation"
    OTHER = "other"


class Station(TenantBaseModel):
    __tablename__ = "stations"
    
    station_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    station_type = Column(SQLEnum(StationType), nullable=False)
    status = Column(SQLEnum(StationStatus), nullable=False, default=StationStatus.FREE)
    
    department = Column(String(100), nullable=False)
    floor = Column(String(20), nullable=True)
    room_number = Column(String(20), nullable=True)
    
    capacity = Column(Integer, default=1, nullable=False)
    current_occupancy = Column(Integer, default=0, nullable=False)
    
    # QR code for check-in
    qr_code = Column(String(255), nullable=True)

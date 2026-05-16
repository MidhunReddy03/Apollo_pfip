from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
from datetime import datetime


class Queue(TenantBaseModel):
    __tablename__ = "queues"
    
    encounter_id = Column(Integer, ForeignKey("encounters.id"), nullable=False)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    
    queue_position = Column(Integer, nullable=False)
    priority_score = Column(Float, default=0.0, nullable=False)
    
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    called_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    estimated_wait_time = Column(Integer, nullable=True)  # in minutes
    
    # Relationships
    encounter = relationship("Encounter", backref="queues")
    station = relationship("Station", backref="queues")

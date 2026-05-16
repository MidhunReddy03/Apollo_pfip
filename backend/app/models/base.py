from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, String, Boolean
from sqlalchemy.ext.declarative import declared_attr
from app.db.session import Base


class BaseModel(Base):
    """Base model with common fields for all tables"""
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower()


class TenantBaseModel(BaseModel):
    """Base model with tenant isolation"""
    __abstract__ = True
    
    tenant_id = Column(String(50), nullable=False, index=True)

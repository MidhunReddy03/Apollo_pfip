from sqlalchemy import Column, Integer, String, Text, JSON, ForeignKey, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
import enum


class WorkflowStatus(str, enum.Enum):
    """Workflow execution status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DELAYED = "delayed"
    CANCELLED = "cancelled"


class TestPriority(str, enum.Enum):
    """Test priority levels"""
    EMERGENCY = "emergency"
    URGENT = "urgent"
    ROUTINE = "routine"


class Workflow(TenantBaseModel):
    """Patient workflow with optimized test sequencing"""
    __tablename__ = "workflows"

    # Relationships
    encounter_id = Column(Integer, ForeignKey("encounters.id"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    
    # Workflow Details
    workflow_number = Column(String(50), unique=True, nullable=False, index=True)
    status = Column(SQLEnum(WorkflowStatus), nullable=False, default=WorkflowStatus.PENDING)
    
    # Test Sequence (JSON array of test steps)
    # Example: [{"step": 1, "test": "X-Ray", "station_id": 1, "duration": 15, "dependencies": []}, ...]
    test_sequence = Column(JSON, nullable=False)
    
    # Optimization Data
    estimated_total_time = Column(Integer, nullable=False)  # in minutes
    actual_total_time = Column(Integer, nullable=True)  # in minutes
    optimization_score = Column(Float, nullable=True)  # 0-100
    
    # Current Progress
    current_step = Column(Integer, nullable=False, default=0)
    completed_steps = Column(JSON, nullable=True, default=list)  # Array of completed step numbers
    
    # Timing
    started_at = Column(String(50), nullable=True)
    completed_at = Column(String(50), nullable=True)
    expected_completion_at = Column(String(50), nullable=True)
    
    # Delays and Issues
    delay_reason = Column(Text, nullable=True)
    delay_duration = Column(Integer, nullable=True)  # in minutes
    
    # Notes
    notes = Column(Text, nullable=True)
    extra_metadata = Column(JSON, nullable=True)

    def __repr__(self):
        return f"<Workflow {self.workflow_number}: {self.status}>"


class TestDefinition(TenantBaseModel):
    """Master list of available tests and their properties"""
    __tablename__ = "test_definitions"

    # Test Details
    test_code = Column(String(50), unique=True, nullable=False, index=True)
    test_name = Column(String(200), nullable=False)
    department = Column(String(100), nullable=False)  # Radiology, Lab, Cardiology, etc.
    
    # Timing
    average_duration = Column(Integer, nullable=False)  # in minutes
    setup_time = Column(Integer, nullable=False, default=0)  # in minutes
    
    # Requirements
    requires_fasting = Column(String(10), nullable=False, default="no")
    requires_preparation = Column(String(10), nullable=False, default="no")
    preparation_instructions = Column(Text, nullable=True)
    
    # Dependencies (JSON array of test codes that must be done before this)
    dependencies = Column(JSON, nullable=True, default=list)
    
    # Parallel Execution (JSON array of test codes that can be done in parallel)
    can_parallel_with = Column(JSON, nullable=True, default=list)
    
    # Priority
    default_priority = Column(SQLEnum(TestPriority), nullable=False, default=TestPriority.ROUTINE)
    
    # Equipment/Station
    required_equipment = Column(String(200), nullable=True)
    preferred_station_type = Column(String(100), nullable=True)
    
    # Cost and Billing
    cost = Column(Float, nullable=True)
    billing_code = Column(String(50), nullable=True)
    
    # Status
    is_available = Column(String(10), nullable=False, default="yes")
    
    # Additional Info
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    extra_metadata = Column(JSON, nullable=True)

    def __repr__(self):
        return f"<TestDefinition {self.test_code}: {self.test_name}>"

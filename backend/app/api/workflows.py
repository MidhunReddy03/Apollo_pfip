from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.middleware.auth import get_current_user
from app.models.workflow import Workflow, WorkflowStatus, TestDefinition
from app.models.encounter import Encounter
from app.models.patient import Patient
from app.services.workflow_optimizer import WorkflowOptimizer, TestNode
from pydantic import BaseModel, Field


router = APIRouter(prefix="/workflows", tags=["Workflows"])


# Schemas
class TestDefinitionCreate(BaseModel):
    test_code: str
    test_name: str
    department: str
    average_duration: int
    setup_time: int = 0
    requires_fasting: str = "no"
    requires_preparation: str = "no"
    preparation_instructions: Optional[str] = None
    dependencies: List[str] = []
    can_parallel_with: List[str] = []
    default_priority: str = "routine"
    required_equipment: Optional[str] = None
    preferred_station_type: Optional[str] = None


class TestDefinitionResponse(BaseModel):
    id: int
    test_code: str
    test_name: str
    department: str
    average_duration: int
    requires_fasting: str
    dependencies: List[str]
    can_parallel_with: List[str]
    is_available: str
    
    class Config:
        from_attributes = True


class WorkflowOptimizeRequest(BaseModel):
    encounter_id: int
    test_codes: List[str]
    station_availability: Optional[dict] = None


class WorkflowOptimizeResponse(BaseModel):
    workflow_number: str
    sequence: List[dict]
    total_sequential_time: int
    optimized_time: int
    time_saved: int
    parallel_opportunities: int
    optimization_score: float
    fasting_required: bool


class WorkflowResponse(BaseModel):
    id: int
    workflow_number: str
    encounter_id: int
    patient_id: int
    status: str
    test_sequence: List[dict]
    estimated_total_time: int
    current_step: int
    started_at: Optional[str]
    expected_completion_at: Optional[str]
    
    class Config:
        from_attributes = True


# Test Definition Endpoints
@router.post("/test-definitions", response_model=TestDefinitionResponse, status_code=status.HTTP_201_CREATED)
async def create_test_definition(
    test_data: TestDefinitionCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new test definition"""
    # Check if test code already exists
    result = await db.execute(
        select(TestDefinition).where(
            TestDefinition.test_code == test_data.test_code,
            TestDefinition.tenant_id == current_user["tenant_id"]
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Test code already exists")
    
    test_def = TestDefinition(
        tenant_id=current_user["tenant_id"],
        **test_data.dict()
    )
    db.add(test_def)
    await db.commit()
    await db.refresh(test_def)
    
    return test_def


@router.get("/test-definitions", response_model=List[TestDefinitionResponse])
async def get_test_definitions(
    department: Optional[str] = None,
    is_available: str = "yes",
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all test definitions"""
    query = select(TestDefinition).where(
        TestDefinition.tenant_id == current_user["tenant_id"],
        TestDefinition.is_available == is_available
    )
    
    if department:
        query = query.where(TestDefinition.department == department)
    
    result = await db.execute(query)
    return result.scalars().all()


# Workflow Optimization Endpoints
@router.post("/optimize", response_model=WorkflowOptimizeResponse)
async def optimize_workflow(
    request: WorkflowOptimizeRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Optimize test sequence for an encounter
    Returns optimized workflow with time estimates
    """
    # Verify encounter exists
    result = await db.execute(
        select(Encounter).where(
            Encounter.id == request.encounter_id,
            Encounter.tenant_id == current_user["tenant_id"]
        )
    )
    encounter = result.scalar_one_or_none()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    
    # Get test definitions
    result = await db.execute(
        select(TestDefinition).where(
            TestDefinition.test_code.in_(request.test_codes),
            TestDefinition.tenant_id == current_user["tenant_id"]
        )
    )
    test_defs = result.scalars().all()
    
    if not test_defs:
        raise HTTPException(status_code=400, detail="No valid tests found")
    
    # Initialize optimizer
    optimizer = WorkflowOptimizer()
    
    # Add test definitions to optimizer
    for test_def in test_defs:
        test_node = TestNode(
            test_code=test_def.test_code,
            test_name=test_def.test_name,
            duration=test_def.average_duration,
            department=test_def.department,
            requires_fasting=(test_def.requires_fasting == "yes"),
            dependencies=test_def.dependencies or [],
            can_parallel_with=test_def.can_parallel_with or []
        )
        optimizer.add_test_definition(test_node)
    
    # Optimize sequence
    optimization_result = optimizer.optimize_sequence(
        request.test_codes,
        request.station_availability
    )
    
    if "error" in optimization_result:
        raise HTTPException(status_code=400, detail=optimization_result["error"])
    
    # Create workflow record
    workflow_number = f"WF{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    workflow = Workflow(
        tenant_id=current_user["tenant_id"],
        encounter_id=request.encounter_id,
        patient_id=encounter.patient_id,
        workflow_number=workflow_number,
        status=WorkflowStatus.PENDING,
        test_sequence=optimization_result["sequence"],
        estimated_total_time=optimization_result["optimized_time"],
        optimization_score=optimization_result["optimization_score"],
        expected_completion_at=(
            datetime.now().isoformat() 
            if optimization_result["optimized_time"] > 0 
            else None
        )
    )
    
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)
    
    return {
        "workflow_number": workflow_number,
        **optimization_result
    }


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get workflow by ID"""
    result = await db.execute(
        select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.tenant_id == current_user["tenant_id"]
        )
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return workflow


@router.get("/encounter/{encounter_id}", response_model=WorkflowResponse)
async def get_workflow_by_encounter(
    encounter_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get workflow for an encounter"""
    result = await db.execute(
        select(Workflow).where(
            Workflow.encounter_id == encounter_id,
            Workflow.tenant_id == current_user["tenant_id"]
        )
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found for this encounter")
    
    return workflow


@router.patch("/{workflow_id}/start")
async def start_workflow(
    workflow_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start workflow execution"""
    result = await db.execute(
        select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.tenant_id == current_user["tenant_id"]
        )
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow.status = WorkflowStatus.IN_PROGRESS
    workflow.started_at = datetime.now().isoformat()
    
    await db.commit()
    
    return {"message": "Workflow started", "workflow_id": workflow_id}


@router.patch("/{workflow_id}/complete-step")
async def complete_workflow_step(
    workflow_id: int,
    step_number: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a workflow step as completed"""
    result = await db.execute(
        select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.tenant_id == current_user["tenant_id"]
        )
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Update completed steps
    completed = workflow.completed_steps or []
    if step_number not in completed:
        completed.append(step_number)
        workflow.completed_steps = completed
    
    # Update current step
    workflow.current_step = step_number + 1
    
    # Check if all steps completed
    if len(completed) >= len(workflow.test_sequence):
        workflow.status = WorkflowStatus.COMPLETED
        workflow.completed_at = datetime.now().isoformat()
        
        # Calculate actual time
        if workflow.started_at:
            started = datetime.fromisoformat(workflow.started_at)
            actual_time = int((datetime.now() - started).total_seconds() / 60)
            workflow.actual_total_time = actual_time
    
    await db.commit()
    
    return {
        "message": "Step completed",
        "current_step": workflow.current_step,
        "completed_steps": workflow.completed_steps,
        "status": workflow.status
    }


@router.get("/patient/{patient_id}/active", response_model=Optional[WorkflowResponse])
async def get_active_workflow_for_patient(
    patient_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get active workflow for a patient"""
    result = await db.execute(
        select(Workflow).where(
            Workflow.patient_id == patient_id,
            Workflow.tenant_id == current_user["tenant_id"],
            Workflow.status.in_([WorkflowStatus.PENDING, WorkflowStatus.IN_PROGRESS])
        ).order_by(Workflow.created_at.desc())
    )
    workflow = result.scalar_one_or_none()
    
    return workflow

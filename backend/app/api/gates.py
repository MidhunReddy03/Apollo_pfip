"""
Gates API Endpoints for Apollo PFIP
Discharge gate management
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime

from app.api import get_db
from app.models.gate import Gate, GateStatus, GateType
from app.services.gate_manager import gate_manager
from app.services.audit_logger import audit_logger

router = APIRouter(prefix="/gates", tags=["gates"])


class GateUpdateRequest(BaseModel):
    status: GateStatus
    notes: Optional[str] = None
    lab_report_available: Optional[bool] = None
    medicines_dispensed: Optional[bool] = None
    clearance_amount: Optional[float] = None


class GateInitializeRequest(BaseModel):
    encounter_id: int


@router.post("/initialize", response_model=dict)
async def initialize_discharge_gates(
    request: GateInitializeRequest,
    current_user_id: int = Query(..., description="User initializing gates"),
    db: AsyncSession = Depends(get_db)
):
    """
    Initialize discharge gates for an encounter
    
    Creates three gates:
    - Lab Reports (lab results pending)
    - Pharmacy (medicines to dispense)
    - Clearance (final administrative clearance)
    """
    gates = await gate_manager.initialize_discharge_gates(
        db=db,
        encounter_id=request.encounter_id,
        initializing_user_id=current_user_id
    )
    
    # Log the gate initialization
    for gate in gates.values():
        await audit_logger.log_gate_event(
            db=db,
            user_id=current_user_id,
            gate_id=gate.id,
            action="create",
            new_status=gate.gate_status.value,
            gate_type=gate.gate_type.value
        )
    
    return {
        "encounter_id": request.encounter_id,
        "gates": {
            gate_type: {
                "id": gate.id,
                "status": gate.gate_status.value,
                "created_at": gate.created_at.isoformat()
            }
            for gate_type, gate in gates.items()
        },
        "message": "Discharge gates initialized successfully"
    }


@router.get("/encounter/{encounter_id}", response_model=dict)
async def get_encounter_gates(
    encounter_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all gates for an encounter with their status
    """
    gates = await gate_manager.get_gates_for_encounter(
        db=db, 
        encounter_id=encounter_id
    )
    
    gate_data = {}
    for gate in gates:
        gate_data[gate.gate_type.value] = {
            "id": gate.id,
            "status": gate.gate_status.value,
            "notes": gate.notes,
            "completed_at": gate.completed_at.isoformat() if gate.completed_at else None,
            "completed_by": gate.completed_by,
            "lab_report_available": gate.lab_report_available,
            "medicines_dispensed": gate.medicines_dispensed,
            "clearance_amount": gate.clearance_amount
        }
    
    return {
        "encounter_id": encounter_id,
        "gates": gate_data,
        "gate_count": len(gates),
        "completed_count": sum(1 for g in gates if g.gate_status == GateStatus.COMPLETED)
    }


@router.get("/encounter/{encounter_id}/status", response_model=dict)
async def get_discharge_status(
    encounter_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive discharge status
    
    Returns whether patient is ready for discharge based on gate completion
    """
    status = await gate_manager.get_discharge_status(
        db=db, 
        encounter_id=encounter_id
    )
    
    return status


@router.put("/{gate_id}", response_model=dict)
async def update_gate(
    gate_id: int,
    request: GateUpdateRequest,
    current_user_id: int = Query(..., description="User updating gate"),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a gate's status
    
    Examples:
    - Mark lab reports as complete
    - Mark pharmacy as dispensed
    - Complete clearance
    """
    gate = await gate_manager.update_gate(
        db=db,
        gate_id=gate_id,
        new_status=request.status,
        staff_id=current_user_id,
        notes=request.notes,
        lab_report_available=request.lab_report_available,
        medicines_dispensed=request.medicines_dispensed,
        clearance_amount=request.clearance_amount
    )
    
    # Log the gate update
    await audit_logger.log_gate_event(
        db=db,
        user_id=current_user_id,
        gate_id=gate.id,
        action="update",
        old_status=None,  # Could fetch old status
        new_status=gate.gate_status.value,
        gate_type=gate.gate_type.value
    )
    
    return {
        "id": gate.id,
        "gate_type": gate.gate_type.value,
        "status": gate.gate_status.value,
        "notes": gate.notes,
        "completed_at": gate.completed_at.isoformat() if gate.completed_at else None,
        "completed_by": gate.completed_by
    }


@router.post("/encounter/{encounter_id}/exit-pass", response_model=dict)
async def generate_exit_pass(
    encounter_id: int,
    current_user_id: int = Query(..., description="User generating exit pass"),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate exit pass when all gates are complete
    
    Only works when all three gates (Lab, Pharmacy, Clearance) are complete
    """
    try:
        exit_pass = await gate_manager.generate_exit_pass(
            db=db,
            encounter_id=encounter_id,
            generating_user_id=current_user_id
        )
        
        # Log the exit pass generation
        await audit_logger.log_exit_pass_event(
            db=db,
            user_id=current_user_id,
            pass_id=exit_pass.id,
            encounter_id=encounter_id,
            action="generate"
        )
        
        return {
            "id": exit_pass.id,
            "pass_code": exit_pass.pass_code,
            "qr_code": exit_pass.qr_code,
            "issued_at": exit_pass.issued_at.isoformat(),
            "valid_until": exit_pass.valid_until.isoformat(),
            "discharge_summary": exit_pass.discharge_summary,
            "follow_up_instructions": exit_pass.follow_up_instructions,
            "status": exit_pass.status
        }
    
    except ValueError as e:
        # Get current gate status for error message
        status = await gate_manager.get_discharge_status(db, encounter_id)
        
        raise HTTPException(
            status_code=400,
            detail={
                "message": str(e),
                "current_status": status,
                "solution": "Complete all gates before generating exit pass"
            }
        )


@router.get("/types")
async def get_gate_types():
    """
    Get available gate types
    """
    return {
        "gate_types": [
            {
                "value": gt.value,
                "display_name": gt.value.replace("_", " ").title(),
                "description": _get_gate_description(gt)
            }
            for gt in GateType
        ]
    }


def _get_gate_description(gate_type: GateType) -> str:
    """Get description for each gate type"""
    descriptions = {
        GateType.LAB_REPORTS: "Lab test results must be available before discharge",
        GateType.PHARMACY: "All prescribed medicines must be dispensed",
        GateType.CLEARANCE: "Administrative clearance and bill settlement"
    }
    return descriptions.get(gate_type, "")

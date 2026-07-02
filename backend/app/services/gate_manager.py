"""
Gate Manager Service for Apollo PFIP
Manages discharge gates: Lab, Pharmacy, Clearance
"""

from typing import List, Optional, Dict
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.gate import Gate, GateStatus, GateType
from app.models.exit_pass import ExitPass
from app.models.encounter import Encounter
from app.models.patient import Patient


class GateManager:
    """
    Manages patient discharge gate workflow
    
    Gate Types:
    - LAB_REPORTS: Lab test results pending
    - PHARMACY: Medicines to be dispensed
    - CLEARANCE: Final administrative clearance
    
    Flow:
    1. Patient ready for discharge → Gates initialized as PENDING
    2. Each department completes their task → Gate marked COMPLETED
    3. All gates complete → Exit pass can be generated
    """
    
    async def initialize_discharge_gates(
        self,
        db: AsyncSession,
        encounter_id: int,
        initializing_user_id: int
    ) -> Dict[str, Gate]:
        """
        Initialize all three discharge gates for a patient
        Returns dict of gate_type -> Gate object
        """
        gates = {}
        
        # Check if gates already exist for this encounter
        existing = await db.execute(
            select(Gate).where(Gate.encounter_id == encounter_id)
        )
        existing_gates = existing.scalars().all()
        
        if existing_gates:
            # Return existing gates
            for gate in existing_gates:
                gates[gate.gate_type.value] = gate
            return gates
        
        # Create gates in order
        gate_types = [
            (GateType.LAB_REPORTS, "Lab Reports Gate"),
            (GateType.PHARMACY, "Pharmacy Gate"),
            (GateType.CLEARANCE, "Clearance Gate")
        ]
        
        for gate_type, display_name in gate_types:
            gate = Gate(
                encounter_id=encounter_id,
                gate_type=gate_type,
                gate_status=GateStatus.PENDING,
                assigned_staff_id=initializing_user_id,
                notes=f"{display_name} - Pending completion"
            )
            db.add(gate)
            gates[gate_type.value] = gate
        
        await db.commit()
        
        # Refresh to get IDs
        for gate in gates.values():
            await db.refresh(gate)
        
        return gates
    
    async def update_gate(
        self,
        db: AsyncSession,
        gate_id: int,
        new_status: GateStatus,
        staff_id: int,
        notes: Optional[str] = None,
        lab_report_available: Optional[bool] = None,
        medicines_dispensed: Optional[bool] = None,
        clearance_amount: Optional[float] = None
    ) -> Gate:
        """
        Update a gate's status and related fields
        """
        result = await db.execute(
            select(Gate).where(Gate.id == gate_id)
        )
        gate = result.scalar_one_or_none()
        
        if not gate:
            raise ValueError(f"Gate {gate_id} not found")
        
        # Update status
        gate.gate_status = new_status
        
        # Update completion info
        if new_status == GateStatus.COMPLETED:
            gate.completed_at = datetime.utcnow()
            gate.completed_by = staff_id
        
        # Update notes
        if notes:
            gate.notes = notes
        
        # Update gate-specific fields
        if gate.gate_type == GateType.LAB_REPORTS:
            if lab_report_available is not None:
                gate.lab_report_available = lab_report_available
                gate.notes = f"Lab reports {'available' if lab_report_available else 'not available'}"
        
        elif gate.gate_type == GateType.PHARMACY:
            if medicines_dispensed is not None:
                gate.medicines_dispensed = medicines_dispensed
                gate.notes = f"Medicines {'dispensed' if medicines_dispensed else 'pending'}"
        
        elif gate.gate_type == GateType.CLEARANCE:
            if clearance_amount is not None:
                gate.clearance_amount = clearance_amount
                gate.notes = f"Clearance completed - Amount: {clearance_amount}"
        
        await db.commit()
        await db.refresh(gate)
        
        return gate
    
    async def get_gates_for_encounter(
        self,
        db: AsyncSession,
        encounter_id: int
    ) -> List[Gate]:
        """
        Get all gates for an encounter
        """
        result = await db.execute(
            select(Gate)
            .where(Gate.encounter_id == encounter_id)
            .order_by(Gate.gate_type)
        )
        return result.scalars().all()
    
    async def check_all_gates_completed(
        self,
        db: AsyncSession,
        encounter_id: int
    ) -> bool:
        """
        Check if all gates are completed for an encounter
        """
        gates = await self.get_gates_for_encounter(db, encounter_id)
        
        if len(gates) != 3:
            return False  # Not all gates initialized
        
        return all(gate.gate_status == GateStatus.COMPLETED for gate in gates)
    
    async def get_discharge_status(
        self,
        db: AsyncSession,
        encounter_id: int
    ) -> Dict:
        """
        Get comprehensive discharge status for an encounter
        """
        gates = await self.get_gates_for_encounter(db, encounter_id)
        
        if not gates:
            return {
                "status": "NOT_STARTED",
                "gates": [],
                "ready_for_discharge": False
            }
        
        gate_statuses = {
            "lab": None,
            "pharmacy": None,
            "clearance": None
        }
        
        for gate in gates:
            if gate.gate_type == GateType.LAB_REPORTS:
                gate_statuses["lab"] = {
                    "status": gate.gate_status.value,
                    "completed_at": gate.completed_at.isoformat() if gate.completed_at else None,
                    "notes": gate.notes
                }
            elif gate.gate_type == GateType.PHARMACY:
                gate_statuses["pharmacy"] = {
                    "status": gate.gate_status.value,
                    "completed_at": gate.completed_at.isoformat() if gate.completed_at else None,
                    "notes": gate.notes
                }
            elif gate.gate_type == GateType.CLEARANCE:
                gate_statuses["clearance"] = {
                    "status": gate.gate_status.value,
                    "completed_at": gate.completed_at.isoformat() if gate.completed_at else None,
                    "notes": gate.notes
                }
        
        all_completed = await self.check_all_gates_completed(db, encounter_id)
        
        return {
            "status": "COMPLETED" if all_completed else "IN_PROGRESS",
            "gates": gate_statuses,
            "ready_for_discharge": all_completed,
            "gate_count": len(gates),
            "completed_count": sum(1 for g in gates if g.gate_status == GateStatus.COMPLETED)
        }
    
    async def generate_exit_pass(
        self,
        db: AsyncSession,
        encounter_id: int,
        generating_user_id: int
    ) -> ExitPass:
        """
        Generate exit pass when all gates are complete
        """
        # Verify all gates completed
        if not await self.check_all_gates_completed(db, encounter_id):
            raise ValueError("Cannot generate exit pass - not all gates completed")
        
        # Check if exit pass already exists
        existing = await db.execute(
            select(ExitPass).where(ExitPass.encounter_id == encounter_id)
        )
        existing_pass = existing.scalar_one_or_none()
        
        if existing_pass:
            return existing_pass
        
        # Get encounter details
        encounter_result = await db.execute(
            select(Encounter).where(Encounter.id == encounter_id)
        )
        encounter = encounter_result.scalar_one_or_none()
        
        if not encounter:
            raise ValueError(f"Encounter {encounter_id} not found")
        
        # Get patient details
        patient_result = await db.execute(
            select(Patient).where(Patient.id == encounter.patient_id)
        )
        patient = patient_result.scalar_one_or_none()
        
        if not patient:
            raise ValueError(f"Patient not found for encounter")
        
        # Generate unique exit pass code
        import uuid
        pass_code = f"EP{encounter_id:06d}{datetime.utcnow().strftime('%Y%m%d')}"
        qr_code = f"APOLLO_EXIT_{pass_code}_{uuid.uuid4().hex[:8].upper()}"
        
        # Create exit pass
        exit_pass = ExitPass(
            encounter_id=encounter_id,
            patient_id=patient.id,
            pass_code=pass_code,
            qr_code=qr_code,
            issued_by=generating_user_id,
            valid_until=datetime.utcnow() + timedelta(hours=24),
            discharge_summary=f"Discharged from {encounter.department or 'Emergency'} on {datetime.utcnow().strftime('%Y-%m-%d')}",
            follow_up_instructions="Please collect medicines from pharmacy and follow up as advised",
            status="ACTIVE"
        )
        
        db.add(exit_pass)
        await db.commit()
        await db.refresh(exit_pass)
        
        return exit_pass


# Singleton
gate_manager = GateManager()

"""
Audit Logger Service for Apollo PFIP
Comprehensive audit trail for all critical operations
"""

import json
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.audit_log import AuditLog, AuditAction


class AuditLogger:
    """
    Comprehensive audit logging service
    
    Tracks all critical transitions in the system:
    - Patient data changes
    - Encounter status changes
    - Queue operations
    - Gate operations
    - Triage decisions
    - Exit pass generation
    - User authentication events
    
    Critical Resources (always logged):
    - patient, encounter, queue, gate, triage, exit_pass
    """
    
    # Critical resource types that require 100% audit coverage
    CRITICAL_RESOURCES = {
        "patient", "encounter", "queue", "gate", 
        "triage", "exit_pass", "user", "authentication"
    }
    
    # Actions that are always considered critical
    CRITICAL_ACTIONS = {
        "create", "update", "delete", "approve", 
        "reject", "discharge", "transfer", "cancel"
    }
    
    def is_critical_event(
        self, 
        resource: str, 
        action: str
    ) -> bool:
        """
        Determine if an event should be marked as critical
        """
        resource_lower = resource.lower()
        action_lower = action.lower()
        
        # Check if resource is in critical list
        if resource_lower in self.CRITICAL_RESOURCES:
            return True
        
        # Check if action is critical
        if action_lower in self.CRITICAL_ACTIONS:
            return True
        
        return False
    
    async def log_event(
        self,
        db: AsyncSession,
        user_id: Optional[int],
        resource: str,
        resource_id: int,
        action: str,
        old_value: Optional[Dict] = None,
        new_value: Optional[Dict] = None,
        metadata: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """
        Log an audit event
        
        Args:
            db: Database session
            user_id: User performing the action (None for system)
            resource: Type of resource (e.g., 'patient', 'encounter')
            resource_id: ID of the resource
            action: Action performed (create, update, delete, etc.)
            old_value: Previous state (for updates)
            new_value: New state (for creates/updates)
            metadata: Additional context
            ip_address: Client IP for security tracking
            user_agent: Client user agent
            
        Returns:
            Created AuditLog entry
        """
        is_critical = self.is_critical_event(resource, action)
        
        # Determine action type
        action_enum = self._get_action_enum(action)
        
        audit_log = AuditLog(
            user_id=user_id,
            resource=resource,
            resource_id=str(resource_id),
            action=action_enum,
            old_value=json.dumps(old_value) if old_value else None,
            new_value=json.dumps(new_value) if new_value else None,
            metadata=json.dumps(metadata) if metadata else None,
            ip_address=ip_address,
            user_agent=user_agent,
            is_critical=is_critical,
            session_id=metadata.get("session_id") if metadata else None,
            event_timestamp=datetime.utcnow()
        )
        
        db.add(audit_log)
        await db.commit()
        await db.refresh(audit_log)
        
        return audit_log
    
    def _get_action_enum(self, action: str) -> AuditAction:
        """Convert action string to enum"""
        action_lower = action.lower()
        
        action_map = {
            "create": AuditAction.CREATE,
            "read": AuditAction.READ,
            "update": AuditAction.UPDATE,
            "delete": AuditAction.DELETE,
            "login": AuditAction.LOGIN,
            "logout": AuditAction.LOGOUT,
            "approve": AuditAction.APPROVE,
            "reject": AuditAction.REJECT,
            "transfer": AuditAction.TRANSFER,
            "discharge": AuditAction.DISCHARGE,
        }
        
        return action_map.get(action_lower, AuditAction.OTHER)
    
    async def log_patient_event(
        self,
        db: AsyncSession,
        user_id: Optional[int],
        patient_id: int,
        action: str,
        old_data: Optional[Dict] = None,
        new_data: Optional[Dict] = None,
        metadata: Optional[Dict] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Convenience method for patient events"""
        return await self.log_event(
            db=db,
            user_id=user_id,
            resource="patient",
            resource_id=patient_id,
            action=action,
            old_value=old_data,
            new_value=new_data,
            metadata=metadata,
            ip_address=ip_address
        )
    
    async def log_encounter_event(
        self,
        db: AsyncSession,
        user_id: Optional[int],
        encounter_id: int,
        action: str,
        old_status: Optional[str] = None,
        new_status: Optional[str] = None,
        metadata: Optional[Dict] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Convenience method for encounter events"""
        old_value = {"status": old_status} if old_status else None
        new_value = {"status": new_status} if new_status else None
        
        return await self.log_event(
            db=db,
            user_id=user_id,
            resource="encounter",
            resource_id=encounter_id,
            action=action,
            old_value=old_value,
            new_value=new_value,
            metadata=metadata,
            ip_address=ip_address
        )
    
    async def log_queue_event(
        self,
        db: AsyncSession,
        user_id: Optional[int],
        queue_entry_id: int,
        action: str,
        old_position: Optional[int] = None,
        new_position: Optional[int] = None,
        metadata: Optional[Dict] = None
    ) -> AuditLog:
        """Convenience method for queue events"""
        old_value = {"position": old_position} if old_position else None
        new_value = {"position": new_position} if new_position else None
        
        return await self.log_event(
            db=db,
            user_id=user_id,
            resource="queue",
            resource_id=queue_entry_id,
            action=action,
            old_value=old_value,
            new_value=new_value,
            metadata=metadata
        )
    
    async def log_triage_event(
        self,
        db: AsyncSession,
        user_id: Optional[int],
        triage_id: int,
        action: str,
        old_priority: Optional[str] = None,
        new_priority: Optional[str] = None,
        ai_confidence: Optional[float] = None,
        metadata: Optional[Dict] = None
    ) -> AuditLog:
        """Convenience method for triage events"""
        old_value = {"priority": old_priority} if old_priority else None
        new_value = {
            "priority": new_priority,
            "ai_confidence": ai_confidence
        } if new_priority else None
        
        return await self.log_event(
            db=db,
            user_id=user_id,
            resource="triage",
            resource_id=triage_id,
            action=action,
            old_value=old_value,
            new_value=new_value,
            metadata=metadata
        )
    
    async def log_gate_event(
        self,
        db: AsyncSession,
        user_id: Optional[int],
        gate_id: int,
        action: str,
        old_status: Optional[str] = None,
        new_status: Optional[str] = None,
        gate_type: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> AuditLog:
        """Convenience method for gate events"""
        old_value = {"status": old_status, "gate_type": gate_type} if old_status else None
        new_value = {"status": new_status, "gate_type": gate_type} if new_status else None
        
        return await self.log_event(
            db=db,
            user_id=user_id,
            resource="gate",
            resource_id=gate_id,
            action=action,
            old_value=old_value,
            new_value=new_value,
            metadata=metadata
        )
    
    async def log_exit_pass_event(
        self,
        db: AsyncSession,
        user_id: Optional[int],
        pass_id: int,
        encounter_id: int,
        action: str,
        metadata: Optional[Dict] = None
    ) -> AuditLog:
        """Convenience method for exit pass events"""
        return await self.log_event(
            db=db,
            user_id=user_id,
            resource="exit_pass",
            resource_id=pass_id,
            action=action,
            new_value={"encounter_id": encounter_id},
            metadata=metadata
        )
    
    async def log_auth_event(
        self,
        db: AsyncSession,
        user_id: Optional[int],
        action: str,
        success: bool,
        username: Optional[str] = None,
        ip_address: Optional[str] = None,
        failure_reason: Optional[str] = None
    ) -> AuditLog:
        """Log authentication events"""
        metadata = {
            "username": username,
            "success": success,
            "failure_reason": failure_reason
        }
        
        return await self.log_event(
            db=db,
            user_id=user_id,
            resource="authentication",
            resource_id=user_id or 0,
            action=action,
            metadata=metadata,
            ip_address=ip_address
        )
    
    async def get_audit_trail(
        self,
        db: AsyncSession,
        resource: Optional[str] = None,
        resource_id: Optional[int] = None,
        user_id: Optional[int] = None,
        is_critical: Optional[bool] = None,
        limit: int = 100
    ) -> List[AuditLog]:
        """
        Retrieve audit trail with filters
        """
        query = select(AuditLog).order_by(desc(AuditLog.event_timestamp))
        
        if resource:
            query = query.where(AuditLog.resource == resource)
        
        if resource_id:
            query = query.where(AuditLog.resource_id == str(resource_id))
        
        if user_id:
            query = query.where(AuditLog.user_id == user_id)
        
        if is_critical is not None:
            query = query.where(AuditLog.is_critical == is_critical)
        
        query = query.limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_critical_events(
        self,
        db: AsyncSession,
        hours_lookback: int = 24,
        limit: int = 100
    ) -> List[AuditLog]:
        """
        Get all critical events in the last N hours
        """
        from datetime import timedelta
        
        cutoff = datetime.utcnow() - timedelta(hours=hours_lookback)
        
        query = select(AuditLog).where(
            AuditLog.is_critical == True,
            AuditLog.event_timestamp >= cutoff
        ).order_by(desc(AuditLog.event_timestamp)).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()


# Singleton instance
audit_logger = AuditLogger()
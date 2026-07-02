"""
Audit API Endpoints for Apollo PFIP
Comprehensive audit trail and compliance reporting
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
import json
from datetime import datetime, timedelta

from app.api import get_db
from app.services.audit_logger import audit_logger
from app.models.audit_log import AuditAction

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/events", response_model=dict)
async def get_audit_events(
    resource: Optional[str] = Query(None, description="Filter by resource type"),
    resource_id: Optional[int] = Query(None, description="Filter by resource ID"),
    user_id: Optional[int] = Query(None, description="Filter by user"),
    is_critical: Optional[bool] = Query(None, description="Filter critical events only"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum events to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve audit trail with optional filters
    
    Use this to investigate what happened in the system:
    - Filter by patient to see all changes to their records
    - Filter by encounter to see its full lifecycle
    - Filter by user to see their actions
    """
    events = await audit_logger.get_audit_trail(
        db=db,
        resource=resource,
        resource_id=resource_id,
        user_id=user_id,
        is_critical=is_critical,
        limit=limit
    )
    
    return {
        "events": [
            {
                "id": e.id,
                "user_id": e.user_id,
                "resource": e.resource,
                "resource_id": e.resource_id,
                "action": e.action.value if e.action else None,
                "old_value": json.loads(e.old_value) if e.old_value else None,
                "new_value": json.loads(e.new_value) if e.new_value else None,
                "metadata": json.loads(e.metadata) if e.metadata else None,
                "ip_address": e.ip_address,
                "is_critical": e.is_critical,
                "timestamp": e.event_timestamp.isoformat()
            }
            for e in events
        ],
        "count": len(events)
    }


@router.get("/critical", response_model=dict)
async def get_critical_events(
    hours: int = Query(24, ge=1, le=168, description="Look back hours"),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all critical events in the last N hours
    
    Critical events include:
    - Patient data changes
    - Encounter status transitions
    - Queue operations
    - Gate operations
    - Triage decisions
    - Exit pass generation
    - User authentication
    """
    events = await audit_logger.get_critical_events(
        db=db,
        hours_lookback=hours,
        limit=limit
    )
    
    return {
        "events": [
            {
                "id": e.id,
                "user_id": e.user_id,
                "resource": e.resource,
                "resource_id": e.resource_id,
                "action": e.action.value if e.action else None,
                "new_value": json.loads(e.new_value) if e.new_value else None,
                "is_critical": e.is_critical,
                "timestamp": e.event_timestamp.isoformat()
            }
            for e in events
        ],
        "count": len(events),
        "time_window_hours": hours
    }


@router.get("/patient/{patient_id}", response_model=dict)
async def get_patient_audit_trail(
    patient_id: int,
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db)
):
    """
    Get complete audit trail for a patient
    
    Shows all changes to patient record, encounters, triage, etc.
    """
    events = await audit_logger.get_audit_trail(
        db=db,
        resource="patient",
        resource_id=patient_id,
        limit=limit
    )
    
    # Also get encounter-related events
    encounter_events = await audit_logger.get_audit_trail(
        db=db,
        resource="encounter",
        resource_id=patient_id,  # Note: This might need adjustment based on ID mapping
        limit=limit
    )
    
    all_events = events + encounter_events
    
    # Sort by timestamp
    all_events.sort(key=lambda x: x.event_timestamp, reverse=True)
    all_events = all_events[:limit]
    
    return {
        "patient_id": patient_id,
        "events": [
            {
                "resource": e.resource,
                "resource_id": e.resource_id,
                "action": e.action.value if e.action else None,
                "changes": _format_audit_changes(e),
                "user_id": e.user_id,
                "timestamp": e.event_timestamp.isoformat()
            }
            for e in all_events
        ],
        "total_events": len(all_events)
    }


@router.get("/encounter/{encounter_id}", response_model=dict)
async def get_encounter_audit_trail(
    encounter_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get complete audit trail for an encounter
    
    Shows the full lifecycle: creation, triage, queue, gates, discharge
    """
    # Get all events for this encounter
    all_events = await audit_logger.get_audit_trail(
        db=db,
        resource_id=encounter_id,
        limit=200
    )
    
    # Also fetch events where encounter_id is stored differently
    # This depends on implementation - simplified for now
    
    return {
        "encounter_id": encounter_id,
        "events": [
            {
                "id": e.id,
                "resource": e.resource,
                "action": e.action.value if e.action else None,
                "changes": _format_audit_changes(e),
                "user_id": e.user_id,
                "ip_address": e.ip_address,
                "is_critical": e.is_critical,
                "timestamp": e.event_timestamp.isoformat()
            }
            for e in all_events
        ],
        "timeline": _build_timeline(all_events)
    }


@router.get("/statistics/summary", response_model=dict)
async def get_audit_statistics(
    hours: int = Query(24, ge=1, le=720),
    db: AsyncSession = Depends(get_db)
):
    """
    Get audit statistics summary
    
    Useful for compliance reporting and monitoring
    """
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    
    from sqlalchemy import select, func
    from app.models.audit_log import AuditLog
    
    # Total events
    total_result = await db.execute(
        select(func.count(AuditLog.id)).where(AuditLog.event_timestamp >= cutoff)
    )
    total_events = total_result.scalar() or 0
    
    # Critical events
    critical_result = await db.execute(
        select(func.count(AuditLog.id)).where(
            AuditLog.event_timestamp >= cutoff,
            AuditLog.is_critical == True
        )
    )
    critical_events = critical_result.scalar() or 0
    
    # Events by action
    actions_result = await db.execute(
        select(AuditLog.action, func.count(AuditLog.id))
        .where(AuditLog.event_timestamp >= cutoff)
        .group_by(AuditLog.action)
    )
    events_by_action = {}
    for action, count in actions_result.all():
        if action:
            events_by_action[action.value] = count
    
    # Events by resource
    resource_result = await db.execute(
        select(AuditLog.resource, func.count(AuditLog.id))
        .where(AuditLog.event_timestamp >= cutoff)
        .group_by(AuditLog.resource)
    )
    events_by_resource = {}
    for resource, count in resource_result.all():
        if resource:
            events_by_resource[resource] = count
    
    # Active users
    users_result = await db.execute(
        select(func.count(func.distinct(AuditLog.user_id)))
        .where(
            AuditLog.event_timestamp >= cutoff,
            AuditLog.user_id.isnot(None)
        )
    )
    active_users = users_result.scalar() or 0
    
    return {
        "period_hours": hours,
        "total_events": total_events,
        "critical_events": critical_events,
        "critical_percentage": round(critical_events / total_events * 100, 1) if total_events > 0 else 0,
        "events_by_action": events_by_action,
        "events_by_resource": events_by_resource,
        "active_users": active_users,
        "generated_at": datetime.utcnow().isoformat()
    }


@router.get("/compliance/report", response_model=dict)
async def generate_compliance_report(
    start_date: str = Query(..., description="Start date ISO format"),
    end_date: str = Query(..., description="End date ISO format"),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate compliance report for audit period
    
    Useful for regulatory compliance (HIPAA, etc.)
    """
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    
    # Get all critical events in period
    events = await audit_logger.get_audit_trail(
        db=db,
        is_critical=True,
        limit=10000  # Large limit for full report
    )
    
    # Filter by date range
    filtered_events = [e for e in events if start <= e.event_timestamp <= end]
    
    return {
        "report_period": {
            "start": start_date,
            "end": end_date
        },
        "summary": {
            "total_critical_events": len(filtered_events),
            "unique_users": len(set(e.user_id for e in filtered_events if e.user_id)),
            "unique_patients": len(set(e.resource_id for e in filtered_events if e.resource == "patient"))
        },
        "events": [
            {
                "timestamp": e.event_timestamp.isoformat(),
                "resource": e.resource,
                "resource_id": e.resource_id,
                "action": e.action.value if e.action else None,
                "user_id": e.user_id,
                "ip_address": e.ip_address,
                "changes_summary": _get_changes_summary(e)
            }
            for e in filtered_events
        ],
        "generated_at": datetime.utcnow().isoformat()
    }


def _format_audit_changes(event) -> dict:
    """Format old/new values for display"""
    changes = {}
    
    if event.old_value:
        try:
            old = json.loads(event.old_value)
            changes["before"] = old
        except:
            pass
    
    if event.new_value:
        try:
            new = json.loads(event.new_value)
            changes["after"] = new
        except:
            pass
    
    return changes


def _build_timeline(events: List) -> List[dict]:
    """Build chronological timeline from events"""
    timeline = []
    for e in sorted(events, key=lambda x: x.event_timestamp):
        timeline.append({
            "timestamp": e.event_timestamp.isoformat(),
            "event": f"{e.action.value if e.action else '.unknown'} {e.resource}"
        })
    return timeline


def _get_changes_summary(event) -> str:
    """Get brief summary of changes"""
    if event.new_value:
        try:
            new = json.loads(event.new_value)
            if "status" in new:
                return f"Status changed to {new['status']}"
            return str(new)
        except:
            pass
    return "See details"

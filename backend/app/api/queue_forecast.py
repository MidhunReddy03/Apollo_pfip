"""
Queue Forecast API Endpoints for Apollo PFIP
M/M/1 Queue Theory Implementation
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import get_db
from app.models.triage import PriorityLevel
from app.services.queue_forecast import queue_forecast

router = APIRouter(prefix="/queue-forecast", tags=["queue-forecast"])


@router.get("/metrics", response_model=dict)
async def get_queue_metrics(
    department: Optional[str] = Query(None, description="Filter by department"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current queue performance metrics using M/M/1 queue theory
    
    Returns:
    - λ (arrival rate): Patients arriving per hour
    - μ (service rate): Patients served per hour  
    - ρ (utilization): System utilization (ρ < 1 = stable)
    - Average waiting time in queue
    - Average time in system
    - Probability system is idle
    - Probability customer must wait
    """
    metrics = await queue_forecast.get_current_queue_metrics(
        db=db, 
        department=department
    )
    
    return {
        "arrival_rate_per_hour": metrics.lambda_arrival_rate,
        "service_rate_per_hour": metrics.mu_service_rate,
        "utilization": metrics.rho_utilization,
        "utilization_percentage": round(metrics.rho_utilization * 100, 1),
        "avg_waiting_time_minutes": metrics.avg_waiting_time,
        "avg_system_time_minutes": metrics.avg_system_time,
        "avg_queue_length": metrics.avg_queue_length,
        "avg_system_length": metrics.avg_system_length,
        "probability_idle": metrics.probability_idle,
        "probability_wait": metrics.probability_wait,
        "system_stable": metrics.rho_utilization < 1.0
    }


@router.get("/wait-time/predict", response_model=dict)
async def predict_wait_time(
    encounter_id: int,
    priority: PriorityLevel = Query(PriorityLevel.P3, description="Patient priority level"),
    department: Optional[str] = Query(None, description="Filter by department"),
    db: AsyncSession = Depends(get_db)
):
    """
    Predict wait time for a specific patient
    
    Considers:
    - Current queue length
    - Patient priority (P1 jumps queue, P3 waits longer)
    - Current system utilization
    - Historical service times
    """
    # Get queue entry to find position
    from sqlalchemy import select
    from app.models.queue import QueueEntry
    
    result = await db.execute(
        select(QueueEntry).where(
            QueueEntry.encounter_id == encounter_id,
            QueueEntry.status == "WAITING"
        )
    )
    queue_entry = result.scalar_one_or_none()
    
    position = queue_entry.queue_position if queue_entry else None
    
    prediction = await queue_forecast.predict_wait_time(
        db=db,
        patient_priority=priority,
        position_in_queue=position,
        department=department
    )
    
    return prediction


@router.get("/wait-time/by-position", response_model=dict)
async def predict_wait_by_position(
    position: int = Query(..., description="Position in queue"),
    priority: PriorityLevel = Query(PriorityLevel.P3, description="Patient priority level"),
    department: Optional[str] = Query(None, description="Filter by department"),
    db: AsyncSession = Depends(get_db)
):
    """
    Predict wait time based on queue position (without specific encounter)
    """
    prediction = await queue_forecast.predict_wait_time(
        db=db,
        patient_priority=priority,
        position_in_queue=position,
        department=department
    )
    
    return prediction


@router.get("/forecast", response_model=dict)
async def get_queue_forecast(
    hours_ahead: int = Query(4, ge=1, le=24, description="Hours to forecast ahead"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get queue forecast summary for upcoming periods
    
    Provides:
    - Current system metrics
    - Projected queue length over time
    - Projected wait times
    - Operational recommendations
    """
    forecast = await queue_forecast.get_forecast_summary(
        db=db,
        hours_ahead=hours_ahead
    )
    
    return forecast


@router.get("/status", response_model=dict)
async def get_system_status(
    db: AsyncSession = Depends(get_db)
):
    """
    Get quick system status
    """
    metrics = await queue_forecast.get_current_queue_metrics(db)
    
    # Determine status
    if metrics.rho_utilization >= 0.95:
        status = "CRITICAL"
        color = "red"
        message = "System at capacity - consider patient diversion"
    elif metrics.rho_utilization >= 0.85:
        status = "HIGH"
        color = "orange"
        message = "High utilization - expect delays"
    elif metrics.rho_utilization >= 0.70:
        status = "MODERATE"
        color = "yellow"
        message = "System busy but stable"
    else:
        status = "NORMAL"
        color = "green"
        message = "Operating within normal parameters"
    
    return {
        "status": status,
        "color": color,
        "message": message,
        "utilization": metrics.rho_utilization,
        "queue_length": metrics.avg_queue_length,
        "estimated_wait_minutes": metrics.avg_waiting_time
    }


@router.get("/by-department", response_model=dict)
async def get_metrics_by_department(
    db: AsyncSession = Depends(get_db)
):
    """
    Get queue metrics broken down by department
    """
    departments = ["Emergency", "Cardiology", "Orthopedics", "Pediatrics", "General Medicine"]
    
    results = {}
    for dept in departments:
        metrics = await queue_forecast.get_current_queue_metrics(
            db=db, 
            department=dept
        )
        results[dept] = {
            "utilization": metrics.rho_utilization,
            "avg_wait_minutes": metrics.avg_waiting_time,
            "avg_queue_length": metrics.avg_queue_length,
            "stable": metrics.rho_utilization < 1.0
        }
    
    return {
        "departments": results,
        "timestamp": "2024-01-01T00:00:00Z"  # Would use datetime.utcnow() in production
    }

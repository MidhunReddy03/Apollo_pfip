from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.db.session import get_db
from app.models.queue import Queue
from app.models.encounter import Encounter, EncounterStatus, PriorityLevel
from app.models.station import Station, StationStatus
from app.schemas.queue import QueueCreate, QueueUpdate, QueueResponse
from app.middleware.auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter(prefix="/queues", tags=["Queues"])


def calculate_priority_score(encounter: Encounter, wait_time_minutes: int) -> float:
    """Calculate dynamic priority score based on multiple factors"""
    score = 0.0
    
    # Emergency severity weight (0-50 points)
    priority_weights = {
        PriorityLevel.EMERGENCY: 50,
        PriorityLevel.URGENT: 40,
        PriorityLevel.HIGH: 30,
        PriorityLevel.NORMAL: 20,
        PriorityLevel.LOW: 10,
    }
    score += priority_weights.get(encounter.priority, 20)
    
    # Wait time weight (0-30 points) - increases over time
    # Every 10 minutes adds 5 points, max 30
    score += min(30, (wait_time_minutes // 10) * 5)
    
    # Department priority (0-20 points)
    department_weights = {
        'emergency': 20,
        'cardiology': 15,
        'radiology': 10,
        'general': 5,
    }
    score += department_weights.get(encounter.department.lower(), 5)
    
    return score


@router.post("/", response_model=QueueResponse, status_code=status.HTTP_201_CREATED)
async def add_to_queue(
    queue_data: QueueCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Add encounter to station queue"""
    # Verify encounter exists
    result = await db.execute(
        select(Encounter).where(
            Encounter.id == queue_data.encounter_id,
            Encounter.tenant_id == queue_data.tenant_id,
            Encounter.is_active == True
        )
    )
    encounter = result.scalar_one_or_none()
    
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    
    # Verify station exists and is available
    result = await db.execute(
        select(Station).where(
            Station.id == queue_data.station_id,
            Station.tenant_id == queue_data.tenant_id,
            Station.is_active == True
        )
    )
    station = result.scalar_one_or_none()
    
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    
    if station.status == StationStatus.OFFLINE:
        raise HTTPException(status_code=400, detail="Station is offline")
    
    # Check if already in queue
    result = await db.execute(
        select(Queue).where(
            Queue.encounter_id == queue_data.encounter_id,
            Queue.station_id == queue_data.station_id,
            Queue.completed_at.is_(None),
            Queue.tenant_id == queue_data.tenant_id
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already in queue")
    
    # Get current queue position
    result = await db.execute(
        select(func.count(Queue.id)).where(
            Queue.station_id == queue_data.station_id,
            Queue.completed_at.is_(None),
            Queue.tenant_id == queue_data.tenant_id
        )
    )
    queue_count = result.scalar() or 0
    
    # Calculate priority score
    wait_time = 0  # New entry
    priority_score = calculate_priority_score(encounter, wait_time)
    
    # Estimate wait time (5 minutes per person ahead)
    estimated_wait = queue_count * 5
    
    queue = Queue(
        encounter_id=queue_data.encounter_id,
        station_id=queue_data.station_id,
        queue_position=queue_count + 1,
        priority_score=priority_score,
        estimated_wait_time=estimated_wait,
        tenant_id=queue_data.tenant_id,
    )
    
    db.add(queue)
    
    # Update encounter status
    encounter.status = EncounterStatus.IN_QUEUE
    
    await db.commit()
    await db.refresh(queue)
    
    return queue


@router.get("/", response_model=List[QueueResponse])
async def list_queues(
    station_id: Optional[int] = None,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all queues with optional filters"""
    tenant_id = current_user.get("tenant_id")
    
    query = select(Queue).where(Queue.tenant_id == tenant_id)
    
    if station_id:
        query = query.where(Queue.station_id == station_id)
    
    if active_only:
        query = query.where(Queue.completed_at.is_(None))
    
    query = query.order_by(Queue.priority_score.desc(), Queue.joined_at.asc())
    
    result = await db.execute(query)
    queues = result.scalars().all()
    
    return queues


@router.get("/station/{station_id}", response_model=List[QueueResponse])
async def get_station_queue(
    station_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get queue for specific station"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Queue).where(
            Queue.station_id == station_id,
            Queue.tenant_id == tenant_id,
            Queue.completed_at.is_(None)
        ).order_by(Queue.priority_score.desc(), Queue.queue_position.asc())
    )
    queues = result.scalars().all()
    
    return queues


@router.post("/{queue_id}/call", response_model=QueueResponse)
async def call_next_patient(
    queue_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Call next patient in queue"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Queue).where(
            Queue.id == queue_id,
            Queue.tenant_id == tenant_id
        )
    )
    queue = result.scalar_one_or_none()
    
    if not queue:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    
    if queue.called_at:
        raise HTTPException(status_code=400, detail="Patient already called")
    
    queue.called_at = datetime.utcnow()
    
    # Update encounter status
    result = await db.execute(
        select(Encounter).where(Encounter.id == queue.encounter_id)
    )
    encounter = result.scalar_one_or_none()
    if encounter:
        encounter.status = EncounterStatus.IN_PROGRESS
    
    # Update station occupancy
    result = await db.execute(
        select(Station).where(Station.id == queue.station_id)
    )
    station = result.scalar_one_or_none()
    if station:
        station.current_occupancy += 1
        if station.current_occupancy >= station.capacity:
            station.status = StationStatus.OCCUPIED
    
    await db.commit()
    await db.refresh(queue)
    
    return queue


@router.post("/{queue_id}/start", response_model=QueueResponse)
async def start_service(
    queue_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Start service for patient"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Queue).where(
            Queue.id == queue_id,
            Queue.tenant_id == tenant_id
        )
    )
    queue = result.scalar_one_or_none()
    
    if not queue:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    
    queue.started_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(queue)
    
    return queue


@router.post("/{queue_id}/complete", response_model=QueueResponse)
async def complete_service(
    queue_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Complete service for patient"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Queue).where(
            Queue.id == queue_id,
            Queue.tenant_id == tenant_id
        )
    )
    queue = result.scalar_one_or_none()
    
    if not queue:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    
    queue.completed_at = datetime.utcnow()
    
    # Update station occupancy
    result = await db.execute(
        select(Station).where(Station.id == queue.station_id)
    )
    station = result.scalar_one_or_none()
    if station and station.current_occupancy > 0:
        station.current_occupancy -= 1
        if station.current_occupancy < station.capacity:
            station.status = StationStatus.FREE
    
    await db.commit()
    await db.refresh(queue)
    
    return queue


@router.delete("/{queue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_queue(
    queue_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Remove patient from queue"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Queue).where(
            Queue.id == queue_id,
            Queue.tenant_id == tenant_id
        )
    )
    queue = result.scalar_one_or_none()
    
    if not queue:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    
    await db.delete(queue)
    await db.commit()
    
    return None


@router.post("/recalculate-priorities", response_model=dict)
async def recalculate_priorities(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Recalculate priority scores for all active queues"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Queue).where(
            Queue.tenant_id == tenant_id,
            Queue.completed_at.is_(None)
        )
    )
    queues = result.scalars().all()
    
    updated_count = 0
    for queue in queues:
        # Get encounter
        result = await db.execute(
            select(Encounter).where(Encounter.id == queue.encounter_id)
        )
        encounter = result.scalar_one_or_none()
        
        if encounter:
            # Calculate wait time
            wait_time = (datetime.utcnow() - queue.joined_at).total_seconds() / 60
            
            # Recalculate priority
            new_score = calculate_priority_score(encounter, int(wait_time))
            queue.priority_score = new_score
            updated_count += 1
    
    await db.commit()
    
    return {"message": f"Updated {updated_count} queue priorities"}

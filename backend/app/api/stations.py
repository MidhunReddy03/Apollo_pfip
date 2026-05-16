from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.db.session import get_db
from app.models.station import Station, StationStatus, StationType
from app.schemas.station import StationCreate, StationUpdate, StationResponse
from app.middleware.auth import get_current_user
import uuid
from datetime import datetime

router = APIRouter(prefix="/stations", tags=["Stations"])


@router.post("/", response_model=StationResponse, status_code=status.HTTP_201_CREATED)
async def create_station(
    station_data: StationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new station"""
    # Generate unique station ID
    station_id = f"STN-{station_data.station_type.value.upper()}-{str(uuid.uuid4())[:6].upper()}"
    
    station = Station(
        station_id=station_id,
        name=station_data.name,
        station_type=station_data.station_type,
        department=station_data.department,
        floor=station_data.floor,
        room_number=station_data.room_number,
        capacity=station_data.capacity,
        status=StationStatus.FREE,
        current_occupancy=0,
        tenant_id=station_data.tenant_id,
    )
    
    db.add(station)
    await db.commit()
    await db.refresh(station)
    
    return station


@router.get("/", response_model=List[StationResponse])
async def list_stations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[StationStatus] = None,
    station_type: Optional[StationType] = None,
    department: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all stations with optional filters"""
    tenant_id = current_user.get("tenant_id")
    
    query = select(Station).where(
        Station.tenant_id == tenant_id,
        Station.is_active == True
    )
    
    if status:
        query = query.where(Station.status == status)
    
    if station_type:
        query = query.where(Station.station_type == station_type)
    
    if department:
        query = query.where(Station.department == department)
    
    query = query.offset(skip).limit(limit).order_by(Station.created_at.desc())
    
    result = await db.execute(query)
    stations = result.scalars().all()
    
    return stations


@router.get("/available", response_model=List[StationResponse])
async def get_available_stations(
    station_type: Optional[StationType] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all available (free) stations"""
    tenant_id = current_user.get("tenant_id")
    
    query = select(Station).where(
        Station.tenant_id == tenant_id,
        Station.is_active == True,
        Station.status == StationStatus.FREE
    )
    
    if station_type:
        query = query.where(Station.station_type == station_type)
    
    result = await db.execute(query)
    stations = result.scalars().all()
    
    return stations


@router.get("/{station_id}", response_model=StationResponse)
async def get_station(
    station_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get station by ID"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Station).where(
            Station.id == station_id,
            Station.tenant_id == tenant_id,
            Station.is_active == True
        )
    )
    station = result.scalar_one_or_none()
    
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    
    return station


@router.put("/{station_id}", response_model=StationResponse)
async def update_station(
    station_id: int,
    station_data: StationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update station"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Station).where(
            Station.id == station_id,
            Station.tenant_id == tenant_id,
            Station.is_active == True
        )
    )
    station = result.scalar_one_or_none()
    
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    
    # Update fields
    update_data = station_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(station, field, value)
    
    await db.commit()
    await db.refresh(station)
    
    return station


@router.post("/{station_id}/status", response_model=StationResponse)
async def update_station_status(
    station_id: int,
    new_status: StationStatus,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update station status"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Station).where(
            Station.id == station_id,
            Station.tenant_id == tenant_id,
            Station.is_active == True
        )
    )
    station = result.scalar_one_or_none()
    
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    
    station.status = new_status
    
    # Reset occupancy if going to maintenance or offline
    if new_status in [StationStatus.MAINTENANCE, StationStatus.OFFLINE]:
        station.current_occupancy = 0
    
    await db.commit()
    await db.refresh(station)
    
    return station


@router.delete("/{station_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_station(
    station_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Soft delete station"""
    tenant_id = current_user.get("tenant_id")
    
    result = await db.execute(
        select(Station).where(
            Station.id == station_id,
            Station.tenant_id == tenant_id
        )
    )
    station = result.scalar_one_or_none()
    
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    
    station.is_active = False
    await db.commit()
    
    return None

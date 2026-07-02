"""
M/M/1 Queue Forecasting Service for Apollo PFIP
Implements M/M/1 queue theory for patient flow prediction
"""

import math
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.queue import QueueEntry, QueueStatus
from app.models.encounter import Encounter
from app.models.triage import TriageRecord, PriorityLevel


@dataclass
class QueueMetrics:
    """Container for queue performance metrics"""
    lambda_arrival_rate: float  # Average arrival rate (patients per hour)
    mu_service_rate: float      # Average service rate (patients per hour)
    rho_utilization: float      # System utilization (lambda/mu)
    avg_waiting_time: float     # Average waiting time in queue (minutes)
    avg_system_time: float      # Average time in system (minutes)
    avg_queue_length: float     # Average number in queue
    avg_system_length: float    # Average number in system
    probability_idle: float     # Probability system is idle
    probability_wait: float     # Probability customer waits
    
    def to_dict(self) -> Dict:
        return {
            "arrival_rate_per_hour": self.lambda_arrival_rate,
            "service_rate_per_hour": self.mu_service_rate,
            "utilization": round(self.rho_utilization, 3),
            "avg_waiting_time_minutes": round(self.avg_waiting_time, 2),
            "avg_system_time_minutes": round(self.avg_system_time, 2),
            "avg_queue_length": round(self.avg_queue_length, 2),
            "avg_system_length": round(self.avg_system_length, 2),
            "probability_idle": round(self.probability_idle, 3),
            "probability_wait": round(self.probability_wait, 3)
        }


class QueueForecastEngine:
    """
    M/M/1 Queue Theory Implementation for Patient Flow
    
    Assumptions:
    - Single server (one examination room/doctor)
    - Poisson arrivals (exponential inter-arrival times)
    - Exponential service times
    - Infinite queue capacity
    
    Notation:
    - λ (lambda) = arrival rate
    - μ (mu) = service rate
    - ρ (rho) = utilization = λ/μ
    """
    
    # Historical service time statistics by priority (in minutes)
    SERVICE_TIME_ESTIMATES = {
        PriorityLevel.P1: 15,   # Emergency - quick stabilization then transfer
        PriorityLevel.P2: 30,   # Urgent - comprehensive assessment
        PriorityLevel.P3: 20,   # Routine - standard consultation
    }
    
    @staticmethod
    def calculate_exponential_probability(rate: float, time: float) -> float:
        """Calculate P(T <= t) for exponential distribution"""
        return 1 - math.exp(-rate * time)
    
    @staticmethod
    def calculate_poisson_probability(lambda_val: float, k: int) -> float:
        """Calculate P(N = k) for Poisson distribution"""
        return (lambda_val ** k * math.exp(-lambda_val)) / math.factorial(k)
    
    async def calculate_arrival_rate(
        self, 
        db: AsyncSession, 
        hours_lookback: int = 24,
        department: Optional[str] = None
    ) -> float:
        """
        Calculate arrival rate (λ) from historical data
        Returns: patients per hour
        """
        # Get all encounters in the time window
        cutoff_time = datetime.utcnow() - timedelta(hours=hours_lookback)
        
        query = select(Encounter).where(Encounter.created_at >= cutoff_time)
        if department:
            query = query.where(Encounter.department == department)
        
        result = await db.execute(query)
        encounters = result.scalars().all()
        
        if not encounters:
            return 0.5  # Default estimate
        
        # Calculate arrival rate
        hours_elapsed = min(hours_lookback, 24)  # Cap at 24 hours
        arrival_rate = len(encounters) / hours_elapsed
        
        return arrival_rate
    
    async def calculate_service_rate(
        self,
        db: AsyncSession,
        hours_lookback: int = 24,
        department: Optional[str] = None
    ) -> float:
        """
        Calculate service rate (μ) from historical data
        Returns: patients per hour
        """
        # Get completed encounters in the time window
        cutoff_time = datetime.utcnow() - timedelta(hours=hours_lookback)
        
        query = select(Encounter).where(
            Encounter.created_at >= cutoff_time,
            Encounter.status == "COMPLETED"
        )
        
        if department:
            query = query.where(Encounter.department == department)
        
        result = await db.execute(query)
        completed_encounters = result.scalars().all()
        
        if not completed_encounters:
            return 2.0  # Default: 2 patients per hour (30 min avg)
        
        # Calculate average service time from completed encounters
        total_service_time = 0
        count = 0
        
        for encounter in completed_encounters:
            if encounter.completed_at and encounter.created_at:
                duration = (encounter.completed_at - encounter.created_at).total_seconds() / 60
                if duration > 0:
                    total_service_time += duration
                    count += 1
        
        if count > 0:
            avg_service_time_minutes = total_service_time / count
            service_rate = 60 / avg_service_time_minutes  # Convert to per hour
        else:
            service_rate = 2.0  # Default fallback
        
        return service_rate
    
    async def get_current_queue_metrics(
        self,
        db: AsyncSession,
        department: Optional[str] = None,
        priority: Optional[PriorityLevel] = None
    ) -> QueueMetrics:
        """
        Calculate current queue metrics using M/M/1 formulas
        """
        # Calculate rates from historical data
        lambda_arrival = await self.calculate_arrival_rate(db, hours_lookback=24, department=department)
        mu_service = await self.calculate_service_rate(db, hours_lookback=24, department=department)
        
        # Handle edge cases
        if lambda_arrival <= 0:
            lambda_arrival = 0.5
        if mu_service <= 0:
            mu_service = 2.0
        
        # Calculate utilization
        rho = lambda_arrival / mu_service
        
        # M/M/1 Queue Formulas
        # Probability system is idle
        p_idle = 1 - rho if rho < 1 else 0
        
        # Probability customer waits (has to wait in queue)
        p_wait = rho if rho < 1 else 1
        
        # Average waiting time in queue (minutes)
        if rho < 1:
            avg_wait_minutes = (rho ** 2) / (mu_service * (1 - rho)) * 60
        else:
            # System unstable - infinite wait
            avg_wait_minutes = float('inf')
        
        # Average time in system (waiting + service)
        avg_system_minutes = avg_wait_minutes + (60 / mu_service)
        
        # Average number in queue
        avg_queue_len = (rho ** 2) / (1 - rho) if rho < 1 else float('inf')
        
        # Average number in system
        avg_system_len = rho / (1 - rho) if rho < 1 else float('inf')
        
        return QueueMetrics(
            lambda_arrival_rate=round(lambda_arrival, 2),
            mu_service_rate=round(mu_service, 2),
            rho_utilization=round(rho, 3),
            avg_waiting_time=round(avg_wait_minutes, 2),
            avg_system_time=round(avg_system_minutes, 2),
            avg_queue_length=round(avg_queue_len, 2),
            avg_system_length=round(avg_system_len, 2),
            probability_idle=round(p_idle, 3),
            probability_wait=round(p_wait, 3)
        )
    
    async def predict_wait_time(
        self,
        db: AsyncSession,
        patient_priority: PriorityLevel = PriorityLevel.P3,
        position_in_queue: Optional[int] = None,
        department: Optional[str] = None
    ) -> Dict:
        """
        Predict wait time for a specific patient
        
        Args:
            db: Database session
            patient_priority: Priority level of patient
            position_in_queue: Current position in queue (if known)
            department: Filter by department
            
        Returns:
            Dictionary with wait time predictions
        """
        # Get current queue metrics
        metrics = await self.get_current_queue_metrics(db, department)
        
        # If position provided, use it; otherwise calculate from queue
        if position_in_queue is None:
            # Get current queue count
            query = select(func.count(QueueEntry.id)).where(
                QueueEntry.status == QueueStatus.WAITING
            )
            if department:
                query = query.where(QueueEntry.department == department)
            
            result = await db.execute(query)
            position_in_queue = result.scalar() or 0
        
        # Adjust service rate based on priority
        # Higher priority patients get faster service
        priority_multiplier = {
            PriorityLevel.P1: 3.0,  # Immediate
            PriorityLevel.P2: 1.5,  # Priority over P3
            PriorityLevel.P3: 1.0   # Normal
        }.get(patient_priority, 1.0)
        
        adjusted_service_rate = metrics.mu_service_rate * priority_multiplier
        
        # Calculate weighted position considering priority
        # Convert position to effective position based on priority
        effective_position = position_in_queue / priority_multiplier
        
        # Base wait time calculation
        if metrics.rho_utilization >= 0.95:
            # System near saturation - use worst-case estimate
            estimated_wait = effective_position * (60 / adjusted_service_rate) * 1.5
        elif metrics.rho_utilization >= 1.0:
            # System overloaded
            estimated_wait = float('inf')
        else:
            # Normal calculation
            # Each patient ahead takes approximately 1/service_rate hours
            # Plus current queue wait time
            base_wait_per_patient = 60 / adjusted_service_rate
            estimated_wait = effective_position * base_wait_per_patient
            
            # Add current queue wait time for context
            estimated_wait += metrics.avg_waiting_time
        
        return {
            "current_utilization": metrics.rho_utilization,
            "arrival_rate_per_hour": metrics.lambda_arrival_rate,
            "service_rate_per_hour": metrics.mu_service_rate,
            "estimated_wait_minutes": round(min(estimated_wait, 480), 1),  # Cap at 8 hours
            "position_in_queue": position_in_queue,
            "priority_adjusted_wait": round(estimated_wait / priority_multiplier, 1),
            "confidence": "high" if metrics.rho_utilization < 0.7 else "medium" if metrics.rho_utilization < 0.9 else "low",
            "system_status": "stable" if metrics.rho_utilization < 0.8 else "busy" if metrics.rho_utilization < 0.95 else "overloaded"
        }
    
    async def get_forecast_summary(
        self,
        db: AsyncSession,
        hours_ahead: int = 4
    ) -> Dict:
        """
        Generate forecast summary for upcoming periods
        
        Args:
            db: Database session
            hours_ahead: Number of hours to forecast ahead
            
        Returns:
            Forecast data for multiple time horizons
        """
        current_metrics = await self.get_current_queue_metrics(db)
        
        forecasts = []
        for hour_offset in range(0, hours_ahead + 1, 1):
            # Simple linear projection with decay
            # (In production, this would use more sophisticated time-series)
            projected_arrival = current_metrics.lambda_arrival_rate
            
            forecasts.append({
                "hour_offset": hour_offset,
                "projected_arrivals": round(projected_arrival * (1 + hour_offset * 0.05), 1),
                "projected_queue_length": round(
                    current_metrics.avg_queue_length * (1 + hour_offset * 0.1), 1
                ),
                "projected_wait_time": round(
                    current_metrics.avg_waiting_time * (1 + hour_offset * 0.15), 1
                )
            })
        
        return {
            "current_metrics": current_metrics.to_dict(),
            "forecasts": forecasts,
            "recommendation": self._generate_recommendation(current_metrics)
        }
    
    def _generate_recommendation(self, metrics: QueueMetrics) -> str:
        """Generate operational recommendation based on queue metrics"""
        
        if metrics.rho_utilization >= 0.95:
            return "URGENT: Consider diverting patients to other facilities or adding temporary staff"
        elif metrics.rho_utilization >= 0.85:
            return "ALERT: High utilization - prepare for delays, consider expedited discharge"
        elif metrics.rho_utilization >= 0.70:
            return "NOTICE: Moderate utilization - monitor queue, may need additional resources in 2 hours"
        elif metrics.rho_utilization < 0.30:
            return "LOW: Below optimal utilization - consider scheduling follow-ups or marketing"
        else:
            return "NORMAL: System operating within expected parameters"


# Singleton instance
queue_forecast = QueueForecastEngine()
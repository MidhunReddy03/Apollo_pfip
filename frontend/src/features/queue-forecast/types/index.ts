export interface QueueMetrics {
  arrival_rate_per_hour: number;
  service_rate_per_hour: number;
  utilization: number;
  avg_waiting_time: number;
  avg_system_time: number;
  avg_queue_length: number;
  avg_system_length: number;
  probability_idle: number;
  probability_wait: number;
  system_stable: boolean;
}

export interface WaitTimePrediction {
  current_utilization: number;
  arrival_rate_per_hour: number;
  service_rate_per_hour: number;
  estimated_wait_minutes: number;
  position_in_queue: number;
  priority_adjusted_wait: number;
  confidence: 'high' | 'medium' | 'low';
  system_status: 'stable' | 'busy' | 'overloaded';
}

export interface QueueForecast {
  current_metrics: QueueMetrics;
  forecasts: Array<{
    hour_offset: number;
    projected_arrivals: number;
    projected_queue_length: number;
    projected_wait_time: number;
  }>;
  recommendation: string;
}

export interface SystemStatus {
  status: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL';
  color: 'red' | 'orange' | 'yellow' | 'green';
  message: string;
  utilization: number;
  queue_length: number;
  estimated_wait_minutes: number;
}

export interface DepartmentMetrics {
  department: string;
  utilization: number;
  avg_wait_minutes: number;
  avg_queue_length: number;
  stable: boolean;
}

export interface DepartmentComparison {
  departments: Record<string, {
    utilization: number;
    avg_wait_minutes: number;
    avg_queue_length: number;
    stable: boolean;
  }>;
  timestamp: string;
}
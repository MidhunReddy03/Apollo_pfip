export type PriorityLevel = 'P1' | 'P2' | 'P3';

export interface TriageRecord {
  id: number;
  encounter_id: number;
  patient_id: number;
  patient_name: string;
  age: number;
  gender: string;
  chief_complaint: string;
  symptoms: string[];
  priority: PriorityLevel;
  ai_confidence_score: number;
  vital_signs: {
    temperature: number;
    heart_rate: number;
    blood_pressure: string;
    oxygen_saturation: number;
  };
  suggested_department: string;
  arrival_time: string;
  wait_time_estimate: string;
  risk_factors: {
    cardiac: number;
    respiratory: number;
    neurological: number;
    geriatric: number;
    pediatric: number;
    obstetric: number;
  };
  triage_status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED';
  ai_keywords: string[];
  nurse_override: boolean;
  notes?: string;
}

export interface TriageCreateRequest {
  encounter_id: number;
  chief_complaint: string;
  symptoms?: string[];
  vital_signs?: {
    temperature?: number;
    heart_rate?: number;
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    oxygen_saturation?: number;
  };
}

export interface TriageUpdateRequest {
  final_priority: PriorityLevel;
  triage_status?: 'COMPLETED';
  notes?: string;
}

export interface QueuePrediction {
  current_utilization: number;
  arrival_rate_per_hour: number;
  service_rate_per_hour: number;
  estimated_wait_minutes: number;
  position_in_queue: number;
  priority_adjusted_wait: number;
  confidence: 'high' | 'medium' | 'low';
  system_status: 'stable' | 'busy' | 'overloaded';
}

export interface DepartmentMetrics {
  department: string;
  utilization: number;
  avg_wait_minutes: number;
  avg_queue_length: number;
  stable: boolean;
}

export interface TriageStats {
  total: number;
  p1: number;
  p2: number;
  p3: number;
  avg_processing_time: string;
  ai_accuracy: number;
  nurse_override_rate: number;
  common_symptoms: Array<{
    symptom: string;
    count: number;
    severity: PriorityLevel;
  }>;
}
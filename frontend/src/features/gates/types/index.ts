export type GateStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type GateType = 'LAB_REPORTS' | 'PHARMACY' | 'CLEARANCE';

export interface Gate {
  id: number;
  encounter_id: number;
  gate_type: GateType;
  gate_status: GateStatus;
  notes: string;
  created_at: string;
  completed_at?: string;
  completed_by?: number;
  lab_report_available?: boolean;
  medicines_dispensed?: boolean;
  clearance_amount?: number;
}

export interface DischargeStatus {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  gates: {
    lab?: GateStatusDetail;
    pharmacy?: GateStatusDetail;
    clearance?: GateStatusDetail;
  };
  ready_for_discharge: boolean;
  gate_count: number;
  completed_count: number;
}

export interface GateStatusDetail {
  status: GateStatus;
  completed_at?: string;
  notes?: string;
}

export interface ExitPass {
  id: number;
  encounter_id: number;
  patient_id: number;
  pass_code: string;
  qr_code: string;
  issued_at: string;
  issued_by: number;
  valid_until: string;
  discharge_summary: string;
  follow_up_instructions: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
}

export interface GateUpdateRequest {
  status: GateStatus;
  notes?: string;
  lab_report_available?: boolean;
  medicines_dispensed?: boolean;
  clearance_amount?: number;
}

export interface GateInitializeRequest {
  encounter_id: number;
}
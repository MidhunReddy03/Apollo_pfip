export interface AuditLog {
  id: number;
  user_id: number;
  resource: string;
  resource_id: string;
  action: string;
  old_value: any;
  new_value: any;
  metadata: any;
  ip_address: string;
  is_critical: boolean;
  timestamp: string;
}

export interface AuditStats {
  period_hours: number;
  total_events: number;
  critical_events: number;
  critical_percentage: number;
  events_by_action: Record<string, number>;
  events_by_resource: Record<string, number>;
  active_users: number;
  generated_at: string;
}

export interface ComplianceReport {
  report_period: {
    start: string;
    end: string;
  };
  summary: {
    total_critical_events: number;
    unique_users: number;
    unique_patients: number;
  };
  events: AuditLog[];
  generated_at: string;
}
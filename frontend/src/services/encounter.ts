import { apiClient } from './api';

export interface Encounter {
  id: number;
  encounter_id: string;
  patient_id: number;
  status: 'checked_in' | 'in_queue' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'emergency';
  check_in_time: string;
  check_out_time?: string;
  department: string;
  chief_complaint?: string;
  notes?: string;
  tenant_id: string;
  is_active: boolean;
  created_at: string;
}

export interface EncounterCreate {
  patient_id: number;
  department: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent' | 'emergency';
  chief_complaint?: string;
  notes?: string;
  tenant_id: string;
}

export const encounterService = {
  async getAll(status?: string, department?: string): Promise<Encounter[]> {
    const params: any = {};
    if (status) params.status = status;
    if (department) params.department = department;
    return apiClient.get<Encounter[]>('/api/v1/encounters', params);
  },

  async getActive(): Promise<Encounter[]> {
    return apiClient.get<Encounter[]>('/api/v1/encounters/active');
  },

  async getById(id: number): Promise<Encounter> {
    return apiClient.get<Encounter>(`/api/v1/encounters/${id}`);
  },

  async create(data: EncounterCreate): Promise<Encounter> {
    return apiClient.post<Encounter>('/api/v1/encounters', data);
  },

  async update(id: number, data: Partial<EncounterCreate>): Promise<Encounter> {
    return apiClient.put<Encounter>(`/api/v1/encounters/${id}`, data);
  },

  async checkOut(id: number): Promise<Encounter> {
    return apiClient.post<Encounter>(`/api/v1/encounters/${id}/check-out`);
  },

  async cancel(id: number): Promise<Encounter> {
    return apiClient.post<Encounter>(`/api/v1/encounters/${id}/cancel`);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete(`/api/v1/encounters/${id}`);
  },
};

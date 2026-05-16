import { apiClient } from './api';

export interface Station {
  id: number;
  station_id: string;
  name: string;
  station_type: 'xray' | 'ecg' | 'ultrasound' | 'treadmill' | 'vital_check' | 'blood_test' | 'consultation' | 'other';
  status: 'free' | 'occupied' | 'maintenance' | 'offline';
  department: string;
  floor?: string;
  room_number?: string;
  capacity: number;
  current_occupancy: number;
  qr_code?: string;
  tenant_id: string;
  is_active: boolean;
  created_at: string;
}

export interface StationCreate {
  name: string;
  station_type: 'xray' | 'ecg' | 'ultrasound' | 'treadmill' | 'vital_check' | 'blood_test' | 'consultation' | 'other';
  department: string;
  floor?: string;
  room_number?: string;
  capacity?: number;
  tenant_id: string;
}

export const stationService = {
  async getAll(status?: string, stationType?: string, department?: string): Promise<Station[]> {
    const params: any = {};
    if (status) params.status = status;
    if (stationType) params.station_type = stationType;
    if (department) params.department = department;
    return apiClient.get<Station[]>('/api/v1/stations', params);
  },

  async getAvailable(stationType?: string): Promise<Station[]> {
    const params: any = {};
    if (stationType) params.station_type = stationType;
    return apiClient.get<Station[]>('/api/v1/stations/available', params);
  },

  async getById(id: number): Promise<Station> {
    return apiClient.get<Station>(`/api/v1/stations/${id}`);
  },

  async create(data: StationCreate): Promise<Station> {
    return apiClient.post<Station>('/api/v1/stations', data);
  },

  async update(id: number, data: Partial<StationCreate>): Promise<Station> {
    return apiClient.put<Station>(`/api/v1/stations/${id}`, data);
  },

  async updateStatus(id: number, status: 'free' | 'occupied' | 'maintenance' | 'offline'): Promise<Station> {
    return apiClient.post<Station>(`/api/v1/stations/${id}/status?new_status=${status}`);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete(`/api/v1/stations/${id}`);
  },
};

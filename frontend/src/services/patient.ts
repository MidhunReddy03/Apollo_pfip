import { apiClient } from './api';

export interface Patient {
  id: number;
  mrn: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: string;
  patient_type: string;
  emergency_contact?: string; // legacy frontend compatibility
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_group?: string;
  allergies?: string;
  whatsapp_number?: string;
  whatsapp_opt_in?: 'yes' | 'no';
  tenant_id: string;
  is_active: boolean;
  created_at: string;
}

export interface PatientCreate {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: string;
  patient_type: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_group?: string;
  allergies?: string;
  whatsapp_number?: string;
  whatsapp_opt_in?: 'yes' | 'no';
  tenant_id: string;
}

export const patientService = {
  async getAll(): Promise<Patient[]> {
    return apiClient.get<Patient[]>('/api/v1/patients');
  },

  async getById(id: number): Promise<Patient> {
    return apiClient.get<Patient>(`/api/v1/patients/${id}`);
  },

  async create(data: PatientCreate): Promise<Patient> {
    return apiClient.post<Patient>('/api/v1/patients', data);
  },

  async update(id: number, data: Partial<PatientCreate>): Promise<Patient> {
    return apiClient.put<Patient>(`/api/v1/patients/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete(`/api/v1/patients/${id}`);
  },

  async search(query: string): Promise<Patient[]> {
    return apiClient.get<Patient[]>('/api/v1/patients/search', { q: query });
  },
};

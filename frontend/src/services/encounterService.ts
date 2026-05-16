import { useAuthStore } from '../store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface EncounterCreate {
  patient_id: number;
  tenant_id: string;
  department: string;
  priority: string;
  chief_complaint: string;
  notes?: string;
}

interface EncounterUpdate {
  status?: string;
  notes?: string;
}

const getToken = () => {
  const token = useAuthStore.getState().token;
  return token ? `Bearer ${token}` : null;
};

const headers = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: token }),
  };
};

export const encounterService = {
  async createEncounter(data: EncounterCreate) {
    const res = await fetch(`${API_URL}/api/v1/encounters/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getActiveEncounters() {
    const res = await fetch(`${API_URL}/api/v1/encounters/active`, {
      method: 'GET',
      headers: headers(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateEncounter(encounterId: number, data: EncounterUpdate) {
    const res = await fetch(`${API_URL}/api/v1/encounters/${encounterId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async completeEncounter(encounterId: number) {
    const res = await fetch(`${API_URL}/api/v1/encounters/${encounterId}/check-out`, {
      method: 'POST',
      headers: headers(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async cancelEncounter(encounterId: number) {
    const res = await fetch(`${API_URL}/api/v1/encounters/${encounterId}/cancel`, {
      method: 'POST',
      headers: headers(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

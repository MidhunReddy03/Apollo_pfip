const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getToken = () => {
  const token = localStorage.getItem('patient_token');
  return token ? `Bearer ${token}` : null;
};

const headers = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: token }),
  };
};

export const patientPortalService = {
  async loginWithSessionCredentials(patientId: number, sessionPassword: string) {
    const res = await fetch(`${API_URL}/api/v1/patient-portal/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        session_password: sessionPassword,
      }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Login failed');
    }
    return res.json();
  },

  async getDashboard() {
    const res = await fetch(`${API_URL}/api/v1/patient-portal/dashboard`, {
      method: 'GET',
      headers: headers(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getNotifications() {
    const res = await fetch(`${API_URL}/api/v1/patient-portal/notifications`, {
      method: 'GET',
      headers: headers(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async endSession(patientId: number) {
    const res = await fetch(`${API_URL}/api/v1/patient-portal/sessions/${patientId}/end`, {
      method: 'POST',
      headers: headers(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

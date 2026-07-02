import { useState, useCallback } from 'react';
import axios from 'axios';
import { AuditLog, AuditStats, ComplianceReport } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const useAuditApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const handleError = (error: unknown): string => {
    console.error('API Error:', error);
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.message || 'An error occurred';
    }
    return 'An unexpected error occurred';
  };

  const getAuditEvents = useCallback(async (params?: {
    resource?: string;
    resource_id?: number;
    user_id?: number;
    is_critical?: boolean;
    limit?: number;
  }): Promise<{ events: AuditLog[]; count: number }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/audit/events`, {
        headers: getAuthHeaders(),
        params: params
      });
      return response.data;
    } catch (err) {
      const message = handleError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCriticalEvents = useCallback(async (hours: number = 24, limit: number = 100): Promise<{ events: AuditLog[]; count: number }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/audit/critical`, {
        headers: getAuthHeaders(),
        params: { hours, limit }
      });
      return response.data;
    } catch (err) {
      const message = handleError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPatientAuditTrail = useCallback(async (patientId: number): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/audit/patient/${patientId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (err) {
      const message = handleError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getEncounterAuditTrail = useCallback(async (encounterId: number): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/audit/encounter/${encounterId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (err) {
      const message = handleError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAuditStatistics = useCallback(async (hours: number = 24): Promise<AuditStats> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/audit/statistics/summary`, {
        headers: getAuthHeaders(),
        params: { hours }
      });
      return response.data;
    } catch (err) {
      const message = handleError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateComplianceReport = useCallback(async (startDate: string, endDate: string): Promise<ComplianceReport> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/audit/compliance/report`, {
        headers: getAuthHeaders(),
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } catch (err) {
      const message = handleError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    setError,
    getAuditEvents,
    getCriticalEvents,
    getPatientAuditTrail,
    getEncounterAuditTrail,
    getAuditStatistics,
    generateComplianceReport,
  };
};
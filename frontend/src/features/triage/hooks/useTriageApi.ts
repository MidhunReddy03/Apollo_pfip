import { useState, useCallback } from 'react';
import axios from 'axios';
import { TriageRecord, TriageCreateRequest, TriageUpdateRequest, PriorityLevel, QueuePrediction } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const useTriageApi = () => {
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

  const getTriageRecords = useCallback(async (): Promise<TriageRecord[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/triage/records`, {
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

  const createTriageRecord = useCallback(async (request: TriageCreateRequest): Promise<TriageRecord> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/triage/records`, request, {
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

  const updateTriagePriority = useCallback(async (triageId: number, priority: PriorityLevel): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const request: TriageUpdateRequest = {
        final_priority: priority,
        triage_status: 'COMPLETED'
      };
      await axios.put(`${API_BASE}/triage/records/${triageId}`, request, {
        headers: getAuthHeaders()
      });
    } catch (err) {
      const message = handleError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTriageRecord = useCallback(async (triageId: number): Promise<TriageRecord> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/triage/records/${triageId}`, {
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

  const predictWaitTime = useCallback(async (encounterId: number, priority: PriorityLevel = 'P3'): Promise<QueuePrediction> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/queue-forecast/wait-time/predict`, {
        headers: getAuthHeaders(),
        params: {
          encounter_id: encounterId,
          priority
        }
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

  const getQueueMetrics = useCallback(async (department?: string): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/queue-forecast/metrics`, {
        headers: getAuthHeaders(),
        params: { department }
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

  const triageClassification = useCallback(async (chiefComplaint: string): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/triage/classify`, {
        chief_complaint: chiefComplaint,
      }, {
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

  const getQueueForecast = useCallback(async (hoursAhead: number = 4): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/queue-forecast/forecast`, {
        headers: getAuthHeaders(),
        params: { hours_ahead: hoursAhead }
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

  const getSystemStatus = useCallback(async (): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/queue-forecast/status`, {
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

  return {
    loading,
    error,
    setError,
    getTriageRecords,
    createTriageRecord,
    updateTriagePriority,
    getTriageRecord,
    predictWaitTime,
    getQueueMetrics,
    triageClassification,
    getQueueForecast,
    getSystemStatus,
  };
};
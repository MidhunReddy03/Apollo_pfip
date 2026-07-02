import { useState, useCallback } from 'react';
import axios from 'axios';
import { QueueMetrics, WaitTimePrediction, QueueForecast, SystemStatus, DepartmentComparison } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const useQueueForecastApi = () => {
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

  const getQueueMetrics = useCallback(async (department?: string): Promise<QueueMetrics> => {
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

  const predictWaitTime = useCallback(async (
    encounterId: number | null,
    priority: 'P1' | 'P2' | 'P3' = 'P3',
    department?: string
  ): Promise<WaitTimePrediction> => {
    setLoading(true);
    setError(null);
    try {
      const url = encounterId 
        ? `${API_BASE}/queue-forecast/wait-time/predict`
        : `/queue-forecast/wait-time/by-position`;
      
      const response = await axios.get(url, {
        headers: getAuthHeaders(),
        params: {
          ...(encounterId ? { encounter_id: encounterId } : {}),
          priority,
          position: 1, // Default position if not provided
          department
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

  const getQueueForecast = useCallback(async (hoursAhead: number = 4): Promise<QueueForecast> => {
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

  const getSystemStatus = useCallback(async (): Promise<SystemStatus> => {
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

  const getDepartmentMetrics = useCallback(async (): Promise<DepartmentComparison> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/queue-forecast/by-department`, {
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

  const predictWaitByPosition = useCallback(async (
    position: number,
    priority: 'P1' | 'P2' | 'P3' = 'P3',
    department?: string
  ): Promise<WaitTimePrediction> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/queue-forecast/wait-time/by-position`, {
        headers: getAuthHeaders(),
        params: {
          position,
          priority,
          department
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

  const getRealTimeUpdates = useCallback(async (callback: (data: QueueMetrics) => void, interval: number = 30000): Promise<NodeJS.Timeout> => {
    const intervalId = setInterval(async () => {
      try {
        const metrics = await getQueueMetrics();
        callback(metrics);
      } catch (err) {
        console.error('Failed to get real-time updates:', err);
      }
    }, interval);

    return intervalId;
  }, [getQueueMetrics]);

  return {
    loading,
    error,
    setError,
    getQueueMetrics,
    predictWaitTime,
    getQueueForecast,
    getSystemStatus,
    getDepartmentMetrics,
    predictWaitByPosition,
    getRealTimeUpdates,
  };
};
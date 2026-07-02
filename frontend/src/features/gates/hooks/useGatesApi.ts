import { useState, useCallback } from 'react';
import axios from 'axios';
import { Gate, DischargeStatus, ExitPass, GateUpdateRequest, GateStatus } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const useGatesApi = () => {
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

  const initializeGates = useCallback(async (encounterId: number, userId: number): Promise<Record<string, Gate>> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE}/gates/initialize`,
        { encounter_id: encounterId },
        {
          headers: getAuthHeaders(),
          params: { current_user_id: userId }
        }
      );
      return response.data.gates;
    } catch (err) {
      const message = handleError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getEncounterGates = useCallback(async (encounterId: number): Promise<Gate[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/gates/encounter/${encounterId}`, {
        headers: getAuthHeaders()
      });
      return Object.values(response.data.gates);
    } catch (err) {
      const message = handleError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDischargeStatus = useCallback(async (encounterId: number): Promise<DischargeStatus> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/gates/encounter/${encounterId}/status`, {
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

  const updateGate = useCallback(async (
    gateId: number, 
    request: GateUpdateRequest,
    userId: number
  ): Promise<Gate> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(
        `${API_BASE}/gates/${gateId}`,
        request,
        {
          headers: getAuthHeaders(),
          params: { current_user_id: userId }
        }
      );
      return response.data;
    } catch (err) {
      const message = handleError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateExitPass = useCallback(async (encounterId: number, userId: number): Promise<ExitPass> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE}/gates/encounter/${encounterId}/exit-pass`,
        {},
        {
          headers: getAuthHeaders(),
          params: { current_user_id: userId }
        }
      );
      return response.data;
    } catch (err) {
      const message = handleError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const completeGate = useCallback(async (gateId: number, userId: number, notes?: Partial<GateUpdateRequest>): Promise<Gate> => {
    return updateGate(gateId, { 
      status: 'COMPLETED' as GateStatus,
      notes: notes?.notes || 'Gate completed successfully',
      ...notes 
    }, userId);
  }, [updateGate]);

  const startGateProcessing = useCallback(async (gateId: number, userId: number): Promise<Gate> => {
    return updateGate(gateId, { 
      status: 'IN_PROGRESS' as GateStatus,
      notes: 'Gate processing started'
    }, userId);
  }, [updateGate]);

  const cancelGate = useCallback(async (gateId: number, userId: number): Promise<Gate> => {
    return updateGate(gateId, { 
      status: 'CANCELLED' as GateStatus,
      notes: 'Gate cancelled'
    }, userId);
  }, [updateGate]);

  const getGateTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/gates/types`, {
        headers: getAuthHeaders()
      });
      return response.data.gate_types;
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
    initializeGates,
    getEncounterGates,
    getDischargeStatus,
    updateGate,
    generateExitPass,
    completeGate,
    startGateProcessing,
    cancelGate,
    getGateTypes,
  };
};
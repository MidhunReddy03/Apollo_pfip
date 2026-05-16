import { apiClient } from './api';

export interface QueueEntry {
  id: number;
  encounter_id: number;
  station_id: number;
  queue_position: number;
  priority_score: number;
  joined_at: string;
  called_at?: string;
  started_at?: string;
  completed_at?: string;
  estimated_wait_time?: number;
  tenant_id: string;
}

export interface QueueCreate {
  encounter_id: number;
  station_id: number;
  tenant_id: string;
  priority_score?: number;
}

export const queueService = {
  async getAll(stationId?: number, activeOnly: boolean = true): Promise<QueueEntry[]> {
    const params: any = { active_only: activeOnly };
    if (stationId) params.station_id = stationId;
    return apiClient.get<QueueEntry[]>('/api/v1/queues', params);
  },

  async getStationQueue(stationId: number): Promise<QueueEntry[]> {
    return apiClient.get<QueueEntry[]>(`/api/v1/queues/station/${stationId}`);
  },

  async addToQueue(data: QueueCreate): Promise<QueueEntry> {
    return apiClient.post<QueueEntry>('/api/v1/queues', data);
  },

  async callNext(queueId: number): Promise<QueueEntry> {
    return apiClient.post<QueueEntry>(`/api/v1/queues/${queueId}/call`);
  },

  async startService(queueId: number): Promise<QueueEntry> {
    return apiClient.post<QueueEntry>(`/api/v1/queues/${queueId}/start`);
  },

  async completeService(queueId: number): Promise<QueueEntry> {
    return apiClient.post<QueueEntry>(`/api/v1/queues/${queueId}/complete`);
  },

  async removeFromQueue(queueId: number): Promise<void> {
    return apiClient.delete(`/api/v1/queues/${queueId}`);
  },

  async recalculatePriorities(): Promise<{ message: string }> {
    return apiClient.post('/api/v1/queues/recalculate-priorities');
  },
};

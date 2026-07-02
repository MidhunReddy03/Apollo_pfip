import { EventEmitter } from 'events';

export type WebSocketEvent = 
  | 'triage_update'
  | 'queue_update'
  | 'gate_update'
  | 'exit_pass_generated'
  | 'patient_discharged'
  | 'system_alert';

export interface WebSocketMessage {
  type: WebSocketEvent;
  data: any;
  timestamp: string;
}

class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;

  constructor() {
    super();
  }

  connect() {
    if (this.isConnected) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.emit(message.type, message.data);
          this.emit('message', message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.emit('disconnected', { code: event.code, reason: event.reason });
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.emit('connection_failed');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  subscribe(channel: WebSocketEvent, callback: (data: any) => void) {
    this.on(channel, callback);
    return () => this.off(channel, callback);
  }

  subscribeTriageUpdates(callback: (triageData: any) => void) {
    return this.subscribe('triage_update', callback);
  }

  subscribeQueueUpdates(callback: (queueData: any) => void) {
    return this.subscribe('queue_update', callback);
  }

  subscribeGateUpdates(callback: (gateData: any) => void) {
    return this.subscribe('gate_update', callback);
  }

  subscribeSystemAlerts(callback: (alertData: any) => void) {
    return this.subscribe('system_alert', callback);
  }

  isConnectionActive() {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// React hook for WebSocket
export const useWebSocket = () => {
  return websocketService;
};

// Mock WebSocket messages for development
export const mockWebSocketData = {
  triage_update: {
    type: 'triage_update' as WebSocketEvent,
    data: {
      patient_id: 1,
      triage_id: 123,
      priority: 'P1',
      ai_confidence_score: 0.94,
      suggested_department: 'Emergency'
    },
    timestamp: new Date().toISOString()
  },
  queue_update: {
    type: 'queue_update' as WebSocketEvent,
    data: {
      utilization: 0.82,
      avg_wait_minutes: 45,
      queue_length: 12,
      new_arrivals: 3
    },
    timestamp: new Date().toISOString()
  },
  gate_update: {
    type: 'gate_update' as WebSocketEvent,
    data: {
      encounter_id: 456,
      gate_type: 'PHARMACY',
      gate_status: 'COMPLETED',
      all_gates_completed: false
    },
    timestamp: new Date().toISOString()
  },
  exit_pass_generated: {
    type: 'exit_pass_generated' as WebSocketEvent,
    data: {
      encounter_id: 456,
      pass_code: 'EP456789',
      qr_code: 'APOLLO_EXIT_EP456789_ABC12345'
    },
    timestamp: new Date().toISOString()
  },
  system_alert: {
    type: 'system_alert' as WebSocketEvent,
    data: {
      severity: 'CRITICAL',
      message: 'System utilization above 95%',
      action_required: true
    },
    timestamp: new Date().toISOString()
  }
};
"""
WebSocket Manager for Apollo PFIP
Real-time event broadcasting
"""

import asyncio
import json
from typing import Dict, List, Set
from datetime import datetime
from fastapi import WebSocket
from app.services.audit_logger import audit_logger
from sqlalchemy.ext.asyncio import AsyncSession


class WebSocketManager:
    """
    Manages active WebSocket connections and broadcasts real-time events
    
    Event types:
    - triage_update: New triage classification or update
    - queue_update: Queue metrics changes
    - gate_update: Gate status changes
    - exit_pass_generated: Exit pass created
    - patient_discharged: Patient discharged
    - system_alert: System-wide alerts
    """
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocketConnection]] = {}
        self.user_connections: Dict[int, Set[str]] = {}
        
    class WebSocketConnection:
        def __init__(self, websocket: WebSocket, user_id: int, connection_id: str):
            self.websocket = websocket
            self.user_id = user_id
            self.connection_id = connection_id
            self.last_activity = datetime.utcnow()
            self.subscribed_channels: Set[str] = set()
            
        def subscribe(self, channel: str):
            self.subscribed_channels.add(channel)
            
        def unsubscribe(self, channel: str):
            self.subscribed_channels.discard(channel)
            
        def is_subscribed(self, channel: str) -> bool:
            return channel in self.subscribed_channels

    def generate_connection_id(self) -> str:
        import uuid
        return str(uuid.uuid4())

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        connection_id = self.generate_connection_id()
        
        connection = self.WebSocketConnection(websocket, user_id, connection_id)
        
        # Add to active connections
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(connection)
        
        # Add to user connections mapping
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(connection_id)
        
        # Send welcome message
        await self.send_personal_message(
            user_id,
            {
                "type": "connection_established",
                "connection_id": connection_id,
                "message": "WebSocket connection established",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        return connection_id

    async def disconnect(self, connection_id: str, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id] = [
                conn for conn in self.active_connections[user_id]
                if conn.connection_id != connection_id
            ]
            
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(connection_id)
            
        # Clean up empty lists
        if user_id in self.active_connections and not self.active_connections[user_id]:
            del self.active_connections[user_id]
            
        if user_id in self.user_connections and not self.user_connections[user_id]:
            del self.user_connections[user_id]

    async def send_personal_message(self, user_id: int, message: dict):
        """Send message to specific user"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.websocket.send_json(message)
                except Exception as e:
                    print(f"Failed to send message to {user_id}: {e}")

    async def broadcast(self, channel: str, message: dict, user_id_filter: List[int] = None):
        """Broadcast message to all subscribed connections"""
        target_users = user_id_filter if user_id_filter else self.active_connections.keys()
        
        for user_id in target_users:
            if user_id in self.active_connections:
                for connection in self.active_connections[user_id]:
                    if connection.is_subscribed(channel):
                        try:
                            message_with_channel = {
                                **message,
                                "channel": channel,
                                "timestamp": datetime.utcnow().isoformat()
                            }
                            await connection.websocket.send_json(message_with_channel)
                        except Exception as e:
                            print(f"Failed to broadcast to {user_id}: {e}")

    async def broadcast_triage_update(self, triage_data: dict, user_id: int = None):
        """Broadcast triage update"""
        message = {
            "type": "triage_update",
            "data": triage_data
        }
        target_users = [user_id] if user_id else None
        await self.broadcast("triage", message, target_users)

    async def broadcast_queue_update(self, queue_data: dict):
        """Broadcast queue metrics update"""
        message = {
            "type": "queue_update",
            "data": queue_data
        }
        await self.broadcast("queue", message)

    async def broadcast_gate_update(self, gate_data: dict, encounter_id: int = None):
        """Broadcast gate status update"""
        message = {
            "type": "gate_update",
            "data": gate_data,
            "encounter_id": encounter_id
        }
        await self.broadcast("gates", message)

    async def broadcast_exit_pass_generated(self, pass_data: dict):
        """Broadcast exit pass generation"""
        message = {
            "type": "exit_pass_generated",
            "data": pass_data
        }
        await self.broadcast("exit_pass", message)

    async def broadcast_patient_discharged(self, patient_data: dict):
        """Broadcast patient discharge"""
        message = {
            "type": "patient_discharged",
            "data": patient_data
        }
        await self.broadcast("discharge", message)

    async def broadcast_system_alert(self, alert_data: dict, severity: str = "WARNING"):
        """Broadcast system alert"""
        message = {
            "type": "system_alert",
            "data": {
                **alert_data,
                "severity": severity,
                "requires_acknowledgment": severity in ["CRITICAL", "HIGH"]
            }
        }
        await self.broadcast("alerts", message)

    async def subscribe_channel(self, user_id: int, connection_id: str, channel: str):
        """Subscribe connection to a channel"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                if connection.connection_id == connection_id:
                    connection.subscribe(channel)
                    
                    # Send subscription confirmation
                    await self.send_personal_message(user_id, {
                        "type": "subscription_confirmed",
                        "channel": channel,
                        "message": f"Subscribed to {channel}"
                    })

    async def unsubscribe_channel(self, user_id: int, connection_id: str, channel: str):
        """Unsubscribe connection from a channel"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                if connection.connection_id == connection_id:
                    connection.unsubscribe(channel)

    def get_active_users_count(self):
        """Get count of active users"""
        return len(self.active_connections)

    def get_total_connections_count(self):
        """Get total number of active connections"""
        total = 0
        for connections in self.active_connections.values():
            total += len(connections)
        return total

    async def handle_ping(self, user_id: int, connection_id: str):
        """Handle ping from client"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                if connection.connection_id == connection_id:
                    connection.last_activity = datetime.utcnow()
                    await self.send_personal_message(user_id, {
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    })

    async def cleanup_inactive_connections(self):
        """Clean up inactive connections (older than 5 minutes)"""
        now = datetime.utcnow()
        for user_id, connections in list(self.active_connections.items()):
            active_connections = []
            for connection in connections:
                # Check if connection is inactive for more than 5 minutes
                inactive_for = (now - connection.last_activity).total_seconds()
                if inactive_for < 300:  # 5 minutes
                    active_connections.append(connection)
                else:
                    # Remove from user_connections
                    if user_id in self.user_connections:
                        self.user_connections[user_id].discard(connection.connection_id)
            
            self.active_connections[user_id] = active_connections
            
            # Clean up empty lists
            if not active_connections:
                del self.active_connections[user_id]
                if user_id in self.user_connections:
                    del self.user_connections[user_id]


# Singleton instance
websocket_manager = WebSocketManager()
async def run_periodic_broadcasts():
    """Run periodic broadcasts for queue metrics"""
    import asyncio
    from app.services.queue_forecast import queue_forecast
    
    while True:
        try:
            from app.db.session import AsyncSessionLocal
            async with AsyncSessionLocal() as db:
                # Get current queue metrics
                metrics = await queue_forecast.get_current_queue_metrics(db)
                
                # Broadcast to all subscribed connections
                await websocket_manager.broadcast_queue_update({
                    "utilization": metrics.rho_utilization,
                    "avg_waiting_time": metrics.avg_waiting_time,
                    "avg_queue_length": metrics.avg_queue_length,
                    "system_stable": metrics.rho_utilization < 1.0,
                    "timestamp": datetime.utcnow().isoformat()
                })
        except Exception as e:
            print(f"Error in periodic broadcast: {e}")
        
        # Wait 30 seconds before next broadcast
        await asyncio.sleep(30)
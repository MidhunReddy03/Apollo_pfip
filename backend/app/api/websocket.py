"""
WebSocket API for Apollo PFIP
Real-time communication endpoints
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, Any
import json
from datetime import datetime

from app.services.websocket_manager import websocket_manager
from app.api import get_current_user_ws

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    # Authentication (in production, you'd use JWT from query params)
    user_id = await authenticate_websocket(websocket)
    if not user_id:
        await websocket.close(code=1008, reason="Authentication required")
        return

    connection_id = await websocket_manager.connect(websocket, user_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            # Handle different message types
            await handle_ws_message(data, user_id, connection_id)
            
    except WebSocketDisconnect:
        await websocket_manager.disconnect(connection_id, user_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket_manager.disconnect(connection_id, user_id)

async def authenticate_websocket(websocket: WebSocket) -> int:
    """Authenticate WebSocket connection"""
    # In production, get token from query params or headers
    token = websocket.query_params.get("token")
    
    # For development, accept any token and return user_id 1
    # In production, validate JWT and extract user_id
    return 1  # Default user_id

async def handle_ws_message(data: Dict[str, Any], user_id: int, connection_id: str):
    """Handle incoming WebSocket messages"""
    message_type = data.get("type")
    
    if message_type == "ping":
        await websocket_manager.handle_ping(user_id, connection_id)
    
    elif message_type == "subscribe":
        channel = data.get("channel")
        if channel:
            await websocket_manager.subscribe_channel(user_id, connection_id, channel)
    
    elif message_type == "unsubscribe":
        channel = data.get("channel")
        if channel:
            await websocket_manager.unsubscribe_channel(user_id, connection_id, channel)
    
    elif message_type == "get_subscriptions":
        # Return current subscriptions
        if user_id in websocket_manager.active_connections:
            for connection in websocket_manager.active_connections[user_id]:
                if connection.connection_id == connection_id:
                    await websocket_manager.send_personal_message(user_id, {
                        "type": "subscriptions",
                        "channels": list(connection.subscribed_channels),
                        "timestamp": datetime.utcnow().isoformat()
                    })
    
    elif message_type == "broadcast_test":
        # Test broadcast functionality
        test_channel = data.get("channel", "test")
        test_message = data.get("message", "Test broadcast")
        
        await websocket_manager.broadcast(test_channel, {
            "type": "test_message",
            "message": test_message,
            "sender": user_id,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    else:
        # Echo message back
        await websocket_manager.send_personal_message(user_id, {
            "type": "echo",
            "original": data,
            "timestamp": datetime.utcnow().isoformat()
        })


@router.get("/ws/stats")
async def get_websocket_stats():
    """Get WebSocket statistics"""
    return {
        "active_users": websocket_manager.get_active_users_count(),
        "total_connections": websocket_manager.get_total_connections_count(),
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/ws/broadcast")
async def broadcast_message(broadcast_data: Dict[str, Any]):
    """Broadcast message to all WebSocket connections (admin only)"""
    channel = broadcast_data.get("channel", "broadcast")
    message = broadcast_data.get("message", {})
    
    await websocket_manager.broadcast(channel, {
        "type": "admin_broadcast",
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {
        "message": f"Broadcast sent to channel '{channel}'",
        "recipients": websocket_manager.get_total_connections_count()
    }

@router.post("/ws/broadcast/triage")
async def broadcast_triage_update(triage_data: Dict[str, Any]):
    """Broadcast triage update"""
    user_id = triage_data.get("user_id")
    
    await websocket_manager.broadcast_triage_update(
        triage_data.get("data", {}),
        user_id
    )
    
    return {
        "message": "Triage update broadcasted",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/ws/broadcast/queue")
async def broadcast_queue_update(queue_data: Dict[str, Any]):
    """Broadcast queue metrics update"""
    await websocket_manager.broadcast_queue_update(
        queue_data.get("data", {})
    )
    
    return {
        "message": "Queue update broadcasted",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/ws/broadcast/gate")
async def broadcast_gate_update(gate_data: Dict[str, Any]):
    """Broadcast gate status update"""
    await websocket_manager.broadcast_gate_update(
        gate_data.get("data", {}),
        gate_data.get("encounter_id")
    )
    
    return {
        "message": "Gate update broadcasted",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/ws/broadcast/alert")
async def broadcast_system_alert(alert_data: Dict[str, Any]):
    """Broadcast system alert"""
    severity = alert_data.get("severity", "WARNING")
    
    await websocket_manager.broadcast_system_alert(
        alert_data.get("data", {}),
        severity
    )
    
    return {
        "message": f"System alert ({severity}) broadcasted",
        "timestamp": datetime.utcnow().isoformat()
    }


# Event handlers for other services to trigger broadcasts
async def on_triage_record_created(db, triage_record, user_id: int):
    """Hook for when a triage record is created"""
    await websocket_manager.broadcast_triage_update({
        "triage_id": triage_record.id,
        "encounter_id": triage_record.encounter_id,
        "patient_id": triage_record.patient_id,
        "priority": triage_record.final_priority.value,
        "ai_confidence_score": triage_record.ai_confidence_score,
        "suggested_department": triage_record.suggested_department,
        "timestamp": datetime.utcnow().isoformat()
    }, user_id)

async def on_gate_updated(db, gate, user_id: int):
    """Hook for when a gate is updated"""
    await websocket_manager.broadcast_gate_update({
        "gate_id": gate.id,
        "encounter_id": gate.encounter_id,
        "gate_type": gate.gate_type.value,
        "gate_status": gate.gate_status.value,
        "timestamp": datetime.utcnow().isoformat()
    }, gate.encounter_id)

async def on_exit_pass_generated(db, exit_pass, user_id: int):
    """Hook for when an exit pass is generated"""
    await websocket_manager.broadcast_exit_pass_generated({
        "pass_id": exit_pass.id,
        "encounter_id": exit_pass.encounter_id,
        "patient_id": exit_pass.patient_id,
        "pass_code": exit_pass.pass_code,
        "timestamp": datetime.utcnow().isoformat()
    })
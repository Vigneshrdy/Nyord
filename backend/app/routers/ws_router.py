from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.orm import Session
from ..websocket_manager import manager
from ..database import get_db
from ..models import User
from ..auth import get_current_user_from_token
import json

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(None)
):
    user_id = None
    
    # Try to authenticate user if token provided
    if token:
        try:
            # Create a simple DB session for authentication
            from ..database import SessionLocal
            db = SessionLocal()
            try:
                user = get_current_user_from_token(token, db)
                user_id = user.id
            except:
                pass  # Continue without authentication
            finally:
                db.close()
        except:
            pass
    
    await manager.connect(websocket, user_id)

    try:
        while True:
            # Listen for messages from client
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                
                # Handle different message types
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                elif message.get("type") == "subscribe_notifications" and user_id:
                    # User is requesting to subscribe to notifications
                    await websocket.send_text(json.dumps({
                        "type": "notification_subscription",
                        "status": "subscribed",
                        "user_id": user_id
                    }))
            except json.JSONDecodeError:
                pass  # Ignore invalid JSON
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
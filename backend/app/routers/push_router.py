from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..utils import get_current_user
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications/push", tags=["push_notifications"])

# In-memory storage for push subscriptions (in production, use database)
push_subscriptions = {}

@router.post("/subscribe")
async def subscribe_to_push(
    subscription_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Subscribe user to push notifications"""
    try:
        user_id = current_user.id
        
        # Store subscription data
        push_subscriptions[user_id] = subscription_data
        
        logger.info(f"User {user_id} subscribed to push notifications")
        
        return {
            "success": True,
            "message": "Successfully subscribed to push notifications"
        }
        
    except Exception as e:
        logger.error(f"Error subscribing to push notifications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to subscribe to push notifications"
        )

@router.post("/unsubscribe")
async def unsubscribe_from_push(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unsubscribe user from push notifications"""
    try:
        user_id = current_user.id
        
        # Remove subscription
        if user_id in push_subscriptions:
            del push_subscriptions[user_id]
        
        logger.info(f"User {user_id} unsubscribed from push notifications")
        
        return {
            "success": True,
            "message": "Successfully unsubscribed from push notifications"
        }
        
    except Exception as e:
        logger.error(f"Error unsubscribing from push notifications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unsubscribe from push notifications"
        )

@router.get("/status")
async def get_push_status(
    current_user: User = Depends(get_current_user)
):
    """Get current push notification subscription status"""
    user_id = current_user.id
    is_subscribed = user_id in push_subscriptions
    
    return {
        "subscribed": is_subscribed,
        "user_id": user_id
    }

@router.post("/test")
async def test_push_notification(
    current_user: User = Depends(get_current_user)
):
    """Send a test push notification to the user"""
    try:
        user_id = current_user.id
        
        if user_id not in push_subscriptions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User not subscribed to push notifications"
            )
        
        # For testing purposes, we'll just return success
        # In a real implementation, you would send the push notification here
        # using web-push library with VAPID keys
        
        logger.info(f"Test push notification requested for user {user_id}")
        
        return {
            "success": True,
            "message": "Test notification sent (simulated)"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending test notification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send test notification"
        )

# Helper function to send push notification (would be used by other parts of the app)
async def send_push_notification(user_id: int, title: str, body: str, category: str = "general", data: dict = None):
    """Send a push notification to a specific user"""
    try:
        if user_id not in push_subscriptions:
            logger.warning(f"User {user_id} not subscribed to push notifications")
            return False
        
        notification_data = {
            "title": title,
            "body": body,
            "icon": "/favicon.ico",
            "badge": "/favicon.ico",
            "tag": f"nyord-{category}-{user_id}",
            "data": {
                "category": category,
                "user_id": user_id,
                **(data or {})
            },
            "requireInteraction": category in ["loan", "kyc"],
            "actions": []
        }
        
        # In a real implementation, you would use web-push library here
        # For now, we'll just log the notification
        logger.info(f"Sending push notification to user {user_id}: {title}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error sending push notification to user {user_id}: {str(e)}")
        return False
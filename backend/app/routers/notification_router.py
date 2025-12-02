from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import Notification, User
from ..schemas import NotificationCreate, NotificationOut, NotificationUpdate, NotificationStats
from ..auth import get_current_user
from ..websocket_manager import manager

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


async def send_real_time_notification(user_id: int, notification_data: dict):
    """Send real-time notification via WebSocket"""
    try:
        await manager.send_personal_message(
            message={
                "type": "notification",
                "data": notification_data
            },
            user_id=user_id
        )
    except Exception as e:
        print(f"Failed to send real-time notification: {e}")


async def create_notification_service(
    db: Session, 
    notification_data: NotificationCreate,
    send_realtime: bool = True
):
    """Service function to create notifications that can be used by other routers"""
    # Create notification
    db_notification = Notification(**notification_data.dict())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    
    # Get from_user name if exists
    from_user_name = None
    if db_notification.from_user_id:
        from_user = db.query(User).filter(User.id == db_notification.from_user_id).first()
        if from_user:
            from_user_name = from_user.username
    
    # Prepare notification data for real-time sending
    notification_out = {
        "id": db_notification.id,
        "user_id": db_notification.user_id,
        "title": db_notification.title,
        "message": db_notification.message,
        "type": db_notification.type,
        "related_id": db_notification.related_id,
        "is_read": db_notification.is_read,
        "created_at": db_notification.created_at.isoformat(),
        "read_at": db_notification.read_at.isoformat() if db_notification.read_at else None,
        "from_user_id": db_notification.from_user_id,
        "from_user_name": from_user_name
    }
    
    # Send real-time notification
    if send_realtime:
        await send_real_time_notification(db_notification.user_id, notification_out)
    
    return db_notification


@router.post("/", response_model=NotificationOut)
async def create_notification(
    notification: NotificationCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new notification"""
    if current_user.role != "admin" and notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to create notifications for other users")
    
    db_notification = await create_notification_service(db, notification)
    
    # Get from_user name for response
    from_user_name = None
    if db_notification.from_user_id:
        from_user = db.query(User).filter(User.id == db_notification.from_user_id).first()
        if from_user:
            from_user_name = from_user.username
    
    # Create response
    notification_out = NotificationOut.from_orm(db_notification)
    notification_out.from_user_name = from_user_name
    
    return notification_out


@router.get("/", response_model=List[NotificationOut])
async def get_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notifications for current user"""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    
    # Add from_user names
    result = []
    for notification in notifications:
        notification_out = NotificationOut.from_orm(notification)
        if notification.from_user_id:
            from_user = db.query(User).filter(User.id == notification.from_user_id).first()
            if from_user:
                notification_out.from_user_name = from_user.username
        result.append(notification_out)
    
    return result


@router.get("/stats", response_model=NotificationStats)
async def get_notification_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification statistics for current user"""
    total_count = db.query(Notification).filter(Notification.user_id == current_user.id).count()
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    return NotificationStats(total_count=total_count, unread_count=unread_count)


@router.put("/mark-all-read")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for current user"""
    try:
        updated_count = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).update({
            "is_read": True,
            "read_at": datetime.utcnow()
        })
        
        db.commit()
        return {"message": f"Marked {updated_count} notifications as read"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating notifications: {str(e)}")


@router.put("/{notification_id}", response_model=NotificationOut)
async def update_notification(
    notification_id: int,
    notification_update: NotificationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update notification (mark as read/unread)"""
    db_notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not db_notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification_update.is_read and not db_notification.is_read:
        db_notification.read_at = datetime.utcnow()
    elif not notification_update.is_read and db_notification.is_read:
        db_notification.read_at = None
    
    db_notification.is_read = notification_update.is_read
    db.commit()
    db.refresh(db_notification)
    
    # Add from_user name
    notification_out = NotificationOut.from_orm(db_notification)
    if db_notification.from_user_id:
        from_user = db.query(User).filter(User.id == db_notification.from_user_id).first()
        if from_user:
            notification_out.from_user_name = from_user.username
    
    return notification_out


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    db_notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not db_notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(db_notification)
    db.commit()
    return {"message": "Notification deleted"}


# Admin endpoints
@router.get("/admin/all", response_model=List[NotificationOut])
async def get_all_notifications(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all notifications (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    notifications = db.query(Notification).order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    
    # Add from_user names
    result = []
    for notification in notifications:
        notification_out = NotificationOut.from_orm(notification)
        if notification.from_user_id:
            from_user = db.query(User).filter(User.id == notification.from_user_id).first()
            if from_user:
                notification_out.from_user_name = from_user.username
        result.append(notification_out)
    
    return result


@router.post("/admin/broadcast", response_model=dict)
async def broadcast_notification(
    title: str,
    message: str,
    notification_type: str = "general",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Broadcast notification to all users (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = db.query(User).filter(User.role == "customer").all()
    
    notifications_created = 0
    for user in users:
        notification_data = NotificationCreate(
            user_id=user.id,
            title=title,
            message=message,
            type=notification_type,
            from_user_id=current_user.id
        )
        await create_notification_service(db, notification_data)
        notifications_created += 1
    
    return {"message": f"Broadcast sent to {notifications_created} users"}
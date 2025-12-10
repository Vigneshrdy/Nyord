import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationApiContext';
import NotificationPopup from './NotificationPopup';
import notificationService from '../services/notificationService';

const NotificationContainer = () => {
  const { notifications, markAsRead } = useNotifications();
  const [popupNotifications, setPopupNotifications] = useState([]);
  const [processedIds, setProcessedIds] = useState(() => {
    try {
      const raw = localStorage.getItem('nyord.processedNotifications');
      if (raw) return new Set(JSON.parse(raw));
    } catch (e) { /* ignore */ }
    return new Set();
  });

  useEffect(() => {
    // Process new notifications and show browser or in-app popup notifications
    if (!notifications?.length) return;

    const newNotifications = notifications.filter(
      notification => !processedIds.has(notification.id) && !notification.read
    );

    if (newNotifications.length === 0) return;

    const willShowBrowser = notificationService.isEnabled();

    newNotifications.forEach(notification => {
      // If browser permission is granted, show device notification; otherwise show in-app popup
      if (willShowBrowser) {
        switch (notification.category) {
          case 'transaction':
            notificationService.showTransactionNotification(notification);
            break;
          case 'loan':
            notificationService.showLoanNotification(notification.message, notification.type === 'loan_approved');
            break;
          case 'kyc':
            notificationService.showKYCNotification(notification.message, notification.type === 'kyc_approved');
            break;
          default:
            notificationService.showAccountNotification(notification.message, notification.type || 'info');
        }
      }

      // mark as processed locally so we don't re-show on reload
      setProcessedIds(prev => {
        const next = new Set(prev);
        next.add(notification.id);
        try { localStorage.setItem('nyord.processedNotifications', JSON.stringify([...next])); } catch (e) {}
        return next;
      });
    });

    // Update popup notifications only when browser permission is NOT granted
    if (!willShowBrowser) {
      const unreadNotifications = notifications.filter(n => !n.read);
      setPopupNotifications(unreadNotifications);
    }
  }, [notifications, processedIds]);

  const handleNotificationRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setPopupNotifications(prev => prev.filter(n => n.id !== notificationId));
      setProcessedIds(prev => {
        const next = new Set(prev);
        next.add(notificationId);
        try { localStorage.setItem('nyord.processedNotifications', JSON.stringify([...next])); } catch (e) {}
        return next;
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <NotificationPopup
      notifications={popupNotifications}
      onNotificationRead={handleNotificationRead}
    />
  );
};

export default NotificationContainer;
import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Add a new notification to the list
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Also show as toast if it's not a silent notification
    if (!notification.silent) {
      showToast(newNotification);
    }
    
    return newNotification.id;
  };

  // Show toast notification
  const showToast = (notification) => {
    const toast = {
      id: notification.id || Date.now() + Math.random(),
      ...notification,
      timestamp: new Date().toISOString()
    };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto-remove toast after delay
    const delay = notification.duration || (notification.type === 'error' ? 6000 : 4000);
    setTimeout(() => {
      removeToast(toast.id);
    }, delay);
  };

  // Remove toast
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Get unread count
  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.read).length;
  };

  // Convenience methods for different notification types
  const showSuccess = (title, message, options = {}) => {
    return addNotification({
      type: 'success',
      title,
      message,
      icon: 'check_circle',
      ...options
    });
  };

  const showError = (title, message, options = {}) => {
    return addNotification({
      type: 'error',
      title,
      message,
      icon: 'error',
      ...options
    });
  };

  const showWarning = (title, message, options = {}) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      icon: 'warning',
      ...options
    });
  };

  const showInfo = (title, message, options = {}) => {
    return addNotification({
      type: 'info',
      title,
      message,
      icon: 'info',
      ...options
    });
  };

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('nyord_notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (error) {
        console.error('Error loading notifications from localStorage:', error);
      }
    }
  }, []);

  // Save notifications to localStorage when they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('nyord_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  const value = {
    notifications,
    toasts,
    addNotification,
    showToast,
    removeToast,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    getUnreadCount,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

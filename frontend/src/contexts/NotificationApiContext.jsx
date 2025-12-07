import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';

const BASE_URL = 'http://localhost:8000';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ws, setWs] = useState(null);

  // Get token from localStorage
  const getToken = () => localStorage.getItem('token');

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    const token = getToken();
    if (!token) {
      console.log('No token available for fetching notifications');
      return;
    }

    console.log('Fetching notifications from API');
    try {
      const response = await fetch(`${BASE_URL}/api/notifications/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Notifications API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched notifications:', data);
        setNotifications(data);
      } else {
        console.error('Failed to fetch notifications:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch notification stats
  const fetchStats = async () => {
    const token = getToken();
    if (!token) {
      console.log('No token available for fetching stats');
      return;
    }

    console.log('Fetching notification stats from API');
    try {
      const response = await fetch(`${BASE_URL}/api/notifications/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Stats API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched stats:', data);
        setUnreadCount(data.unread_count);
      } else {
        console.error('Failed to fetch stats:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  // Setup WebSocket connection with reconnect logic
  useEffect(() => {
    let mounted = true;
    const token = getToken();
    if (!user || !token) {
      console.log('No user or token available for WebSocket connection');
      return;
    }

    console.log('Setting up WebSocket connection for user:', user.id);

    let websocket = null;
    let reconnectTimer = null;

    const connect = () => {
      if (!mounted) return;
      try {
        websocket = new WebSocket(`${BASE_URL.replace('http', 'ws')}/ws?token=${token}`);
      } catch (err) {
        console.error('Failed to construct WebSocket:', err);
        scheduleReconnect();
        return;
      }

      websocket.onopen = () => {
        console.log('WebSocket connected for notifications, user:', user.id);
        try {
          websocket.send(JSON.stringify({ type: 'subscribe_notifications' }));
        } catch (err) {
          console.error('Failed to send subscribe message:', err);
        }
      };

      websocket.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      try {
        const data = JSON.parse(event.data);
        console.log('Parsed WebSocket data:', data);
        
        if (data.type === 'notification' && data.data) {
          console.log('Adding new notification:', data.data);
          // Add new notification to the list
          setNotifications(prev => [data.data, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification using notification service
          const notificationData = data.data;
          if (notificationData.category === 'transaction') {
            notificationService.showTransactionNotification(notificationData);
          } else if (notificationData.category === 'loan') {
            notificationService.showLoanNotification(notificationData.message, notificationData.type === 'loan_approved');
          } else if (notificationData.category === 'kyc') {
            notificationService.showKYCNotification(notificationData.message, notificationData.type === 'kyc_approved');
          } else {
            notificationService.showAccountNotification(notificationData.message, notificationData.type || 'info');
          }
        } else if (data.type === 'transaction.success') {
          console.log('Transaction completed:', data);
          // Refresh notifications to get any new transaction notifications
          setTimeout(() => {
            fetchNotifications();
            fetchStats();
          }, 1000); // Wait a bit for backend to process notifications
          
          // Trigger balance refresh for the user
          window.dispatchEvent(new CustomEvent('balanceUpdate', {
            detail: {
              transactionId: data.transaction_id,
              amount: data.amount,
              newSrcBalance: data.new_src_balance,
              newDestBalance: data.new_dest_balance
            }
          }));
        } else if (data.type === 'notification_subscription') {
          console.log('Notification subscription confirmed:', data);
        } else {
          console.log('Unhandled WebSocket message type:', data.type, data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        // force close to trigger onclose and reconnection flow
        try { websocket.close(); } catch (_) {}
      };

      websocket.onclose = (event) => {
        console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason);
        if (!mounted) return;
        // Reconnect after delay unless closed intentionally (1000)
        if (event.code !== 1000 && user && getToken()) {
          scheduleReconnect();
        }
      };

      setWs(websocket);
    };

    const scheduleReconnect = () => {
      if (reconnectTimer) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        console.log('Attempting to reconnect WebSocket...');
        connect();
      }, 5000);
    };

    connect();

    return () => {
      mounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (websocket) {
        try { websocket.close(1000, 'closing'); } catch (_) {}
      }
    };
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    if (user && getToken()) {
      fetchNotifications();
      fetchStats();
    }
  }, [user]);

  // Request notification permission
  // We do not automatically prompt for Notification permission on page load
  // to avoid unexpected browser permission popups. Permission should be
  // requested from a user action (settings/opt-in) when appropriate.

  const markAsRead = async (notificationId) => {
    const token = getToken();
    if (!token) return;
    
    try {
      const response = await fetch(`${BASE_URL}/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      const response = await fetch(`${BASE_URL}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    const token = getToken();
    if (!token) return;
    
    try {
      const response = await fetch(`${BASE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getUnreadNotifications = () => {
    return notifications.filter(n => !n.is_read);
  };

  // Toast functions for showing temporary notifications
  const showSuccess = (message) => {
    // You can implement toast notifications here or just log for now
    console.log('Success:', message);
    // Optionally show browser notification
    if (Notification.permission === 'granted') {
      new Notification('Success', { body: message, icon: '/success-icon.png' });
    }
  };

  const showError = (message) => {
    console.log('Error:', message);
    if (Notification.permission === 'granted') {
      new Notification('Error', { body: message, icon: '/error-icon.png' });
    }
  };

  const showWarning = (message) => {
    console.log('Warning:', message);
    if (Notification.permission === 'granted') {
      new Notification('Warning', { body: message, icon: '/warning-icon.png' });
    }
  };

  const showInfo = (message) => {
    console.log('Info:', message);
    if (Notification.permission === 'granted') {
      new Notification('Info', { body: message, icon: '/info-icon.png' });
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadNotifications,
    refreshNotifications: fetchNotifications,
    refreshStats: fetchStats,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
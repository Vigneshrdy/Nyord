import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const BASE_URL = window.location.protocol === 'https:' ? 'https://taksari.me' : 'http://taksari.me';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ws, setWs] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected', 'connecting', 'disconnected', 'polling'

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

  // Setup WebSocket connection with fallback to polling
  useEffect(() => {
    const token = getToken();
    if (!user || !token) {
      console.log('No user or token available for WebSocket connection');
      return;
    }

    let websocket = null;
    let reconnectAttempts = 0;
    let pollingInterval = null;
    let isWebSocketConnected = false;
    const maxReconnectAttempts = 3;
    const reconnectDelay = 5000;
    const pollingInterval_ms = 10000; // Poll every 10 seconds as fallback

    const startPolling = () => {
      if (pollingInterval) return; // Already polling
      
      console.log('Starting polling fallback for real-time updates');
      setConnectionStatus('polling');
      pollingInterval = setInterval(() => {
        if (!isWebSocketConnected) {
          fetchNotifications();
          fetchStats();
        }
      }, pollingInterval_ms);
    };

    const stopPolling = () => {
      if (pollingInterval) {
        console.log('Stopping polling fallback');
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };

    const connectWebSocket = () => {
      try {
        console.log(`Setting up WebSocket connection for user: ${user.id}, attempt: ${reconnectAttempts + 1}`);
        setConnectionStatus('connecting');
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//taksari.me/ws?token=${token}`;
        websocket = new WebSocket(wsUrl);
        
        const connectionTimeout = setTimeout(() => {
          if (websocket && websocket.readyState === WebSocket.CONNECTING) {
            console.log('WebSocket connection timeout, falling back to polling');
            websocket.close();
            startPolling();
          }
        }, 5000);

        websocket.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket connected for notifications, user:', user.id);
          isWebSocketConnected = true;
          reconnectAttempts = 0;
          setConnectionStatus('connected');
          stopPolling(); // Stop polling since WebSocket is working
          
          try {
            websocket.send(JSON.stringify({ type: 'subscribe_notifications' }));
          } catch (error) {
            console.error('Error sending subscription message:', error);
          }
        };

        websocket.onmessage = (event) => {
          console.log('WebSocket message received:', event.data);
          try {
            const data = JSON.parse(event.data);
            console.log('Parsed WebSocket data:', data);
            
            if (data.type === 'notification' && data.data) {
              console.log('Adding new notification:', data.data);
              setNotifications(prev => [data.data, ...prev]);
              setUnreadCount(prev => prev + 1);
              
              if (Notification.permission === 'granted') {
                new Notification(data.data.title, {
                  body: data.data.message,
                  icon: '/favicon.ico'
                });
              }
            } else if (data.type === 'transaction.success') {
              console.log('Transaction completed:', data);
              setTimeout(() => {
                fetchNotifications();
                fetchStats();
              }, 1000);
              
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
          clearTimeout(connectionTimeout);
          console.error('WebSocket error:', error);
          isWebSocketConnected = false;
          setConnectionStatus('disconnected');
        };

        websocket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason);
          isWebSocketConnected = false;
          
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts && user && getToken()) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect WebSocket in ${reconnectDelay/1000}s... (${reconnectAttempts}/${maxReconnectAttempts})`);
            setTimeout(connectWebSocket, reconnectDelay);
          } else {
            console.log('WebSocket reconnection failed or max attempts reached, using polling fallback');
            startPolling();
          }
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        startPolling();
      }
    };

    // Start connection attempt
    connectWebSocket();
    setWs(websocket);

    return () => {
      console.log('Cleaning up WebSocket and polling');
      isWebSocketConnected = false;
      stopPolling();
      if (websocket) {
        websocket.close(1000, 'Component unmounting');
      }
    };
  }, [user]);

  // Initial data fetch and periodic refresh
  useEffect(() => {
    if (user && getToken()) {
      fetchNotifications();
      fetchStats();
      
      // Set up periodic refresh every 30 seconds
      const refreshInterval = setInterval(() => {
        fetchNotifications();
        fetchStats();
      }, 30000);

      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [user]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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
    connectionStatus,
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
import React, { useState, useEffect } from 'react';
    import { Bell, X, Check, Smartphone } from 'lucide-react';
import notificationService from '../services/notificationService';
import { pushNotificationManager } from '../services/pushNotificationService';

const NotificationPermissionBanner = () => {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    const checkPermission = () => {
      if (notificationService.isSupported()) {
        const currentPermission = notificationService.getPermissionStatus();
        setPermission(currentPermission);
        setShow(currentPermission === 'default');
      }
    };

    // Initialize push notification manager
    pushNotificationManager.initialize();
    checkPermission();
  }, []);

  const requestPermission = async () => {
    setIsEnabling(true);
    try {
      const result = await notificationService.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // Subscribe to push notifications for device alerts
        await pushNotificationManager.subscribe();
        
        setShow(false);
        // Show test notification
        notificationService.showAccountNotification('Notifications enabled! You\'ll now receive real-time updates on screen and device alerts.', 'success');
      } else if (result === 'denied') {
        setShow(false);
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setIsEnabling(false);
    }
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('notificationBannerDismissed', 'true');
  };

  if (!show || !notificationService.isSupported()) {
    return null;
  }

  // Check if user previously dismissed
  if (localStorage.getItem('notificationBannerDismissed')) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4 rounded-lg mb-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white bg-opacity-20 rounded-full">
          <Bell size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Enable Notifications</h3>
          <p className="text-sm opacity-90 mb-3">
            Get real-time alerts for transactions, account updates, and important banking notifications. 
            Includes both on-screen popups and device push notifications.
          </p>
          <div className="flex gap-2">
            <button
              onClick={requestPermission}
              disabled={isEnabling}
              className="bg-white text-teal-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEnabling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-600 border-t-transparent"></div>
                  Enabling...
                </>
              ) : (
                <>
                  <Check size={16} />
                  <Smartphone size={16} />
                  Enable Notifications
                </>
              )}
            </button>
            <button
              onClick={dismiss}
              className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-30 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;
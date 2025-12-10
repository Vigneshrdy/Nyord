import React, { useState, useEffect } from 'react';
import { X, Check, Bell, DollarSign, FileText, AlertCircle, CheckCircle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationPopup = ({ notifications = [], onNotificationRead }) => {
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    // Show new unread notifications
    const newNotifications = notifications.filter(n => 
      !n.read && !visibleNotifications.find(v => v.id === n.id)
    );
    
    if (newNotifications.length > 0) {
      setVisibleNotifications(prev => [...prev, ...newNotifications.slice(-3)]); // Show max 3
      
      // Auto hide after 6 seconds for non-important notifications
      newNotifications.forEach(notification => {
        const isImportant = notification.category === 'loan' || notification.category === 'kyc';
        if (!isImportant) {
          setTimeout(() => {
            hideNotification(notification.id);
          }, 6000);
        }
      });
    }
  }, [notifications]);

  const hideNotification = (id) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification) => {
    onNotificationRead(notification.id);
    hideNotification(notification.id);
  };

  const getNotificationIcon = (category, type) => {
    switch (category) {
      case 'transaction':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'loan':
        return type === 'loan_approved' ? 
          <CheckCircle className="w-5 h-5 text-green-500" /> : 
          <FileText className="w-5 h-5 text-blue-500" />;
      case 'kyc':
        return type === 'kyc_approved' ? 
          <CheckCircle className="w-5 h-5 text-green-500" /> : 
          <User className="w-5 h-5 text-blue-500" />;
      case 'account':
        return <Bell className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (category, type) => {
    if (type === 'loan_approved' || type === 'kyc_approved') {
      return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
    }
    switch (category) {
      case 'transaction':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'loan':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'kyc':
        return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'account':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-800/50';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      <AnimatePresence>
        {visibleNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`
              relative p-4 rounded-lg shadow-lg border-l-4 cursor-pointer
              backdrop-blur-sm bg-white/90 dark:bg-gray-800/90
              ${getNotificationColor(notification.category, notification.type)}
              hover:shadow-xl transition-all duration-200
            `}
            onClick={() => handleNotificationClick(notification)}
          >
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                hideNotification(notification.id);
              }}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="flex items-start space-x-3 pr-6">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.category, notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(notification.created_at)}
                  </span>
                  {(notification.category === 'loan' || notification.category === 'kyc') && (
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                      Important
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress bar for auto-hide */}
            {notification.category !== 'loan' && notification.category !== 'kyc' && (
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-blue-500/30 rounded-b-lg"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 6, ease: 'linear' }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPopup;
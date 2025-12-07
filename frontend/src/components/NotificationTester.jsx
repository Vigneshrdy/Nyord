import React, { useState, useEffect } from 'react';
import { Bell, Smartphone, TestTube, Check, X, AlertCircle } from 'lucide-react';
import notificationService from '../services/notificationService';
import { pushNotificationManager } from '../services/pushNotificationService';
import { useTheme } from '../contexts/ThemeContext';

const NotificationTester = () => {
  const { isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState({
    browserPermission: 'default',
    pushSubscription: false,
    serviceWorker: false
  });
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const browserPermission = notificationService.getPermissionStatus();
    const pushSubscription = pushNotificationManager.isSubscribed();
    const serviceWorker = 'serviceWorker' in navigator;
    
    setStatus({
      browserPermission,
      pushSubscription,
      serviceWorker
    });
  };

  const testBrowserNotification = () => {
    notificationService.showTransactionNotification(
      'Test transaction notification',
      {
        amount: 1000,
        type: 'credit',
        from: 'Test Account',
        to: 'Your Account'
      }
    );
    setTestResult('Browser notification sent! Check top-right corner.');
  };

  const testLoanNotification = () => {
    notificationService.showLoanNotification('loan_approved', {
      amount: 50000,
      loanType: 'Personal Loan'
    });
    setTestResult('Loan approval notification sent!');
  };

  const testKYCNotification = () => {
    notificationService.showKYCNotification('kyc_approved', {
      documentType: 'Identity Verification'
    });
    setTestResult('KYC notification sent!');
  };

  const testPushNotification = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/notifications/push/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setTestResult('Push notification test sent! Check your device.');
      } else {
        setTestResult('Failed to send push notification test.');
      }
    } catch (error) {
      setTestResult('Error sending push notification test.');
    }
  };

  const enableNotifications = async () => {
    const permission = await notificationService.requestPermission();
    if (permission === 'granted') {
      await pushNotificationManager.subscribe();
      checkStatus();
      setTestResult('Notifications enabled successfully!');
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'granted' || status === true) {
      return <Check className="w-4 h-4 text-green-500" />;
    } else if (status === 'denied') {
      return <X className="w-4 h-4 text-red-500" />;
    } else {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-40 transition-colors"
        title="Test Notifications"
      >
        <TestTube className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-40 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Notification Tester
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Status Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">System Status</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Browser Permissions</span>
            <div className="flex items-center gap-1">
              {getStatusIcon(status.browserPermission)}
              <span className="text-xs text-gray-500">{status.browserPermission}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Push Subscription</span>
            <div className="flex items-center gap-1">
              {getStatusIcon(status.pushSubscription)}
              <span className="text-xs text-gray-500">{status.pushSubscription ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Service Worker</span>
            <div className="flex items-center gap-1">
              {getStatusIcon(status.serviceWorker)}
              <span className="text-xs text-gray-500">{status.serviceWorker ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="p-4 space-y-3">
        {status.browserPermission !== 'granted' && (
          <button
            onClick={enableNotifications}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Bell className="w-4 h-4" />
            Enable Notifications
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={testBrowserNotification}
            disabled={status.browserPermission !== 'granted'}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-3 rounded text-xs font-medium transition-colors"
          >
            Transaction
          </button>
          <button
            onClick={testLoanNotification}
            disabled={status.browserPermission !== 'granted'}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2 px-3 rounded text-xs font-medium transition-colors"
          >
            Loan
          </button>
          <button
            onClick={testKYCNotification}
            disabled={status.browserPermission !== 'granted'}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-2 px-3 rounded text-xs font-medium transition-colors"
          >
            KYC
          </button>
          <button
            onClick={testPushNotification}
            disabled={!status.pushSubscription}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
          >
            <Smartphone className="w-3 h-3" />
            Push
          </button>
        </div>
      </div>

      {/* Result */}
      {testResult && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">{testResult}</p>
        </div>
      )}
    </div>
  );
};

export default NotificationTester;
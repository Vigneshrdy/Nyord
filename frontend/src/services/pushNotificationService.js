// VAPID Configuration for Push Notifications
export const VAPID_CONFIG = {
  // These are example keys - replace with your actual VAPID keys
  // Generate keys using: npx web-push generate-vapid-keys
  publicKey: 'BFSJlrUAxWD37t6xvjON4wdbFRlBXvX1sNHx52R5FXt8yEWA-hUtrM2_hhkL3T1QyxfqDW7bK4fTC-Awj-G1caE',
  privateKey: 'oQciWhERPPgJHg1EefsRuQ4Fab9FrNPIr_G7-ua96Y0',
  
  // Server endpoint where push notifications are sent from
  endpoint: 'http://localhost:8000/api/notifications/push'
};

// Service Worker registration and subscription management
export class PushNotificationManager {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.registration = null;
    this.subscription = null;
  }

  async initialize() {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);
      
      // Check for existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async requestPermission() {
    if (!this.isSupported) return false;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async subscribe() {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      // Convert VAPID public key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(VAPID_CONFIG.publicKey);
      
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      console.log('Push subscription successful:', this.subscription);
      
      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);
      
      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  async unsubscribe() {
    if (this.subscription) {
      await this.subscription.unsubscribe();
      this.subscription = null;
      
      // Notify server about unsubscription
      await this.removeSubscriptionFromServer();
    }
  }

  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch(`${VAPID_CONFIG.endpoint}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  async removeSubscriptionFromServer() {
    try {
      const response = await fetch(`${VAPID_CONFIG.endpoint}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  getSubscription() {
    return this.subscription;
  }

  isSubscribed() {
    return this.subscription !== null;
  }
}

// Export singleton instance
export const pushNotificationManager = new PushNotificationManager();
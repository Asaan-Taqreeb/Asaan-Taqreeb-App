import { Platform } from 'react-native';

const VAPID_PUBLIC_KEY = 'BG8KjEMYvfQBC6u-85YWGfV7ntxPkeMFV5lgfuXxIUa7dMofvkAuM1sfiA_TTuWJw3rVvrNM8rFTBVjd7Zx9XaA';

/**
 * Register the Service Worker in PWA mode (Web Only)
 */
export async function registerPWAServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Service Worker registered scope:', registration.scope);
    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Request notification permissions and register Web Push Subscription with VAPID
 */
export async function subscribeToWebPush(
  registration: ServiceWorkerRegistration,
  updatePushTokens: (expoToken?: string, fcmToken?: string, webPushSubscription?: any) => Promise<boolean>
): Promise<any | null> {
  if (!('pushManager' in registration)) {
    console.warn('Push manager is not supported on this browser');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission was not granted by user');
      return null;
    }

    // Subscribe user via pushManager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('✅ Web Push Subscription obtained:', JSON.stringify(subscription));

    // Send Web Push subscription to backend
    const success = await updatePushTokens(undefined, undefined, subscription);
    if (success) {
      console.log('✅ Web Push subscription synced with backend database');
    }

    return subscription;
  } catch (error) {
    console.error('❌ Failed to subscribe to Web Push:', error);
    return null;
  }
}

/**
 * Helper to convert url-safe base64 VAPID key to standard Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

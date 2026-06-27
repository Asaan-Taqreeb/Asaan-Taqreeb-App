import { apiFetchJson } from './apiClient';
import { NOTIFICATION_ENDPOINTS, API_BASE_URL, API_PREFIX } from '@/app/_constants/apiEndpoints';

export const updatePushTokens = async (expoToken?: string, fcmToken?: string, webPushSubscription?: any) => {
  try {
    const payload: any = {};
    if (expoToken) payload.expoPushToken = expoToken;
    if (fcmToken) payload.fcmToken = fcmToken;
    if (webPushSubscription) payload.webPushSubscription = webPushSubscription;

    if (Object.keys(payload).length === 0) {
      console.warn('No tokens to update');
      return false;
    }

    const response = await apiFetchJson<any>(
      NOTIFICATION_ENDPOINTS.updateToken,
      {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      },
      'Failed to update push tokens'
    );

    console.log('✅ Push tokens updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating push tokens:', error);
    return false;
  }
};

/**
 * Clears all push tokens from the backend for the current user.
 * Call this BEFORE logging out so the server stops sending notifications
 * to this device once the user is signed out.
 */
export const removePushTokens = async () => {
  try {
    await apiFetchJson<any>(
      NOTIFICATION_ENDPOINTS.updateToken,
      {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          expoPushToken: null,
          fcmToken: null,
          webPushSubscription: null,
        }),
      },
      'Failed to clear push tokens'
    );
    console.log('✅ Push tokens cleared on logout');
    return true;
  } catch (error) {
    // Non-fatal — backend logout will also clear tokens
    console.warn('Could not clear push tokens before logout:', error);
    return false;
  }
};

export const sendTestNotification = async () => {
  try {
    const { registerForPushNotificationsAsync } = require('./pushNotificationService');
    const { expoToken, fcmToken } = await registerForPushNotificationsAsync() || {};
    const token = expoToken || fcmToken;

    if (!token) {
      console.warn('Cannot send test notification: No push token obtained');
      return false;
    }

    const response = await apiFetchJson<any>(
      `${API_BASE_URL}${API_PREFIX}/notifications/test/test-push`,
      {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          token,
          title: 'Test Notification',
          body: 'This is a test push notification',
        }),
      },
      'Failed to send test notification'
    );

    console.log('Test notification sent:', response);
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};

export default function PushTokenManagerRouteStub() {
  return null;
}

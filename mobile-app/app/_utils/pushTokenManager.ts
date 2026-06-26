import { apiFetchJson } from './apiClient';
import { NOTIFICATION_ENDPOINTS, API_BASE_URL, API_PREFIX } from '@/app/_constants/apiEndpoints';

export const updatePushTokens = async (expoToken?: string, fcmToken?: string) => {
  try {
    const payload: any = {};
    if (expoToken) payload.expoPushToken = expoToken;
    if (fcmToken) payload.fcmToken = fcmToken;

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

export const sendTestNotification = async () => {
  try {
    const { registerForPushNotificationsAsync } = require('./fcmService');
    const { expoToken, fcmToken } = await registerForPushNotificationsAsync();
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

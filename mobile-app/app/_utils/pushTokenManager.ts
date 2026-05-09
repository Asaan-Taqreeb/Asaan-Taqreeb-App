import { apiFetchJson } from './apiClient';
import { NOTIFICATION_ENDPOINTS } from '@/app/_constants/apiEndpoints';

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
    const response = await apiFetchJson<any>(
      '/api/v1/notifications/test/send',
      {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
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

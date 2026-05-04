import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get the token
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
            console.log('Project ID not found in expo config');
        }
        token = (await Notifications.getExpoPushTokenAsync({
            projectId
        })).data;
        console.log('Expo Push Token:', token);
    } catch (e) {
        console.log('Error getting push token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Handle notification clicks
 */
export function handleNotificationResponse(response: Notifications.NotificationResponse, router: any) {
  const data = response.notification.request.content.data;
  const type = data.type;

  console.log('Notification Response received:', data);

  if (data.chatId) {
    // Navigate to chat
    if (data.vendorId) {
        // Client side
        router.push({
            pathname: '/screens/client/Component/VendorChatScreen',
            params: { chatId: data.chatId, vendorId: data.vendorId }
        });
    } else if (data.clientId) {
        // Vendor side
        router.push({
            pathname: '/screens/vendor/Component/ClientChatScreen',
            params: { chatId: data.chatId, clientId: data.clientId }
        });
    }
  } else if (data.bookingId) {
    // Navigate to booking detail
    // We need to know if we are client or vendor
    // This is a bit tricky, but we can try to guess or use the type
    if (data.type === 'BOOKING_UPDATE') {
        // If it's a vendor dashboard, go to order detail
        // For now, let's just go to the relevant list
        router.push('/screens/client/Component/BookingHistoryScreen');
    }
  }
}

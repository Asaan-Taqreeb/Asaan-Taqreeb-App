import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

// Define the background task for handling notifications when the app is closed
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error, executionContext }) => {
  if (error) {
    console.error('Background notification task error:', error);
    return;
  }
  console.log('Background notification task triggered:', data);
});

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

  // Register the background task
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    if (!isRegistered) {
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      console.log('Background notification task registered');
    }
  } catch (err) {
    console.error('Failed to register background task:', err);
  }

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
    
    console.log('Current notification permission status:', existingStatus);
    
    if (existingStatus !== 'granted') {
      console.log('Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('New notification permission status:', finalStatus);
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token: Permission not granted');
      // If we are on Android 13+, we might want to alert the user
      if (Platform.OS === 'android' && Platform.Version >= 33) {
          console.log('Android 13+ detected, permission is mandatory for notifications');
      }
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
export function handleNotificationResponse(response: Notifications.NotificationResponse, router: any, userRole?: string) {
  const data = response.notification.request.content.data;
  
  console.log('Notification Response received:', data, 'User Role:', userRole);

  if (data.chatId) {
    // Navigate to chat
    if (data.vendorId && userRole !== 'vendor') {
        // Client side
        router.push({
            pathname: '/screens/client/Component/VendorChatScreen',
            params: { chatId: data.chatId, vendorId: data.vendorId }
        });
    } else if (data.clientId || userRole === 'vendor') {
        // Vendor side
        router.push({
            pathname: '/screens/vendor/Component/ClientChatScreen',
            params: { chatId: data.chatId, clientId: data.clientId }
        });
    }
  } else if (data.bookingId) {
    // Navigate to booking detail
    if (userRole === 'vendor') {
        // For vendors, go to Orders screen (since we need full object for Detail)
        router.push('/screens/vendor/_tabs/OrdersScreen');
    } else {
        // For clients
        router.push('/screens/client/Component/BookingHistoryScreen');
    }
  }
}

/**
 * Dismiss all notifications from the system tray
 */
export async function dismissAllTrayNotifications() {
    try {
        await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
        console.warn('Failed to dismiss all notifications:', error);
    }
}

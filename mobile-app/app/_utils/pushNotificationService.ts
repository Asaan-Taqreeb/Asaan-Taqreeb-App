import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

const isExpoGo = Constants.appOwnership === 'expo' || (Constants as any).executionEnvironment === 'storeClient';

// Conditionally import Notifications only when needed (not in Expo Go on Android)
let Notifications: any = null;
let TaskManager: any = null;
let notificationsAvailable = false;

if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    TaskManager = require('expo-task-manager');
    notificationsAvailable = true;

    // Guard task definition for native only
    try {
      TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }: any) => {
        if (error) {
          console.error('Background notification task error:', error);
          return;
        }
        console.log('Background notification task triggered:', data);
      });
    } catch (e) {
      console.warn('Failed to define TaskManager background task:', e);
    }

    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        } as any),
      });
    }
  } catch (e) {
    console.warn('⚠️ Notifications not available in this environment (Expo Go on Android SDK 53+):', (e as any).message);
    notificationsAvailable = false;
  }
}

/**
 * Register for push notifications and get the token (Native Only)
 */
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web' || isExpoGo || !notificationsAvailable) {
    console.log('ℹ️ Remote push notifications are disabled in Expo Go. Use a standalone APK build for full push functionality.');
    return { expoToken: null, fcmToken: null };
  }

  if (!Notifications || !TaskManager) {
    console.warn('⚠️ Notifications or TaskManager not available');
    return { expoToken: null, fcmToken: null };
  }

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
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    } catch (err) {
      console.error('Failed to set notification channel:', err);
    }
  }

  if (Device.isDevice) {
    try {
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
        if (Platform.OS === 'android' && Platform.Version >= 33) {
            console.log('Android 13+ detected, permission is mandatory for notifications');
        }
        return { expoToken: null, fcmToken: null };
      }
      
      try {
          const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
          if (!projectId) {
              console.log('Project ID not found in expo config');
          return { expoToken: null, fcmToken: null };
          }
          token = (await Notifications.getExpoPushTokenAsync({
              projectId
          })).data;
          console.log('Expo Push Token:', token);
      } catch (e) {
          console.log('Error getting push token:', e);
      }
    } catch (err) {
      console.error('Error during permission check:', err);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return { expoToken: token ?? null, fcmToken: null };
}

/**
 * Handle notification clicks
 */
export function handleNotificationResponse(response: any, router: any, userRole?: string) {
  const data = response.notification?.request?.content?.data || response.data || {};
  
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
        router.push('/screens/vendor/OrdersScreen');
    } else {
        router.push('/screens/client/BookingScreen');
    }
  }
}

/**
 * Dismiss all notifications from the system tray
 */
export async function dismissAllTrayNotifications() {
    if (Platform.OS === 'web' || !notificationsAvailable || !Notifications) return;
    try {
        await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
        console.warn('Failed to dismiss all notifications:', error);
    }
}

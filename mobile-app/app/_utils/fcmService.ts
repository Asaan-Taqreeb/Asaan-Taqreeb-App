import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as TaskManager from 'expo-task-manager';
import messaging from '@react-native-firebase/messaging';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

// Request user permissions for notifications
export async function requestNotificationPermissions() {
  try {
    if (Platform.OS === 'android') {
      const granted = await Notifications.requestPermissionsAsync();
      console.log('Android notification permissions:', granted);
      return granted.granted;
    }
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

// Get FCM Token (Android native Firebase Cloud Messaging)
export async function getFCMToken() {
  try {
    if (Platform.OS !== 'android') {
      console.log('FCM is only available on Android');
      return null;
    }

    const token = await messaging().getToken();
    if (token) {
      console.log('✅ FCM Token obtained:', token);
      return token;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
  }
  return null;
}

// Listen to FCM token refresh (called when token changes)
export function onFCMTokenRefresh(callback) {
  if (Platform.OS !== 'android') {
    return () => {};
  }

  try {
    const unsubscribe = messaging().onTokenRefresh(token => {
      console.log('🔄 FCM Token refreshed:', token);
      callback(token);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up FCM token refresh listener:', error);
    return () => {};
  }
}

// Handle foreground FCM messages
export function setupFCMForegroundHandler() {
  if (Platform.OS !== 'android') {
    return () => {};
  }

  try {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('🔔 FCM Message received (foreground):', remoteMessage);

      // Show local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title || 'New Message',
          body: remoteMessage.notification?.body || '',
          data: remoteMessage.data || {},
        },
        trigger: { seconds: 1 },
      });
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up FCM foreground handler:', error);
    return () => {};
  }
}

// Handle background FCM messages
export function setupFCMBackgroundHandler() {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('🔔 FCM Message received (background):', remoteMessage);
      // Message handling is done by Firebase automatically
      // This callback is for custom processing
    });

    console.log('✅ FCM background handler setup complete');
  } catch (error) {
    console.error('Error setting up FCM background handler:', error);
  }
}

// Handle notification press (when user taps notification)
export function setupFCMNotificationHandler(onNotificationPress) {
  if (Platform.OS !== 'android') {
    return () => {};
  }

  try {
    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('📱 Notification opened from background:', remoteMessage);
      onNotificationPress?.(remoteMessage);
    });

    // Check if app was opened from a notification when it was completely closed
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('📱 Notification opened from quit state:', remoteMessage);
          onNotificationPress?.(remoteMessage);
        }
      });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up FCM notification handler:', error);
    return () => {};
  }
}

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
 * Register for push notifications and get both Expo and FCM tokens
 */
export async function registerForPushNotificationsAsync() {
  let expoToken = null;
  let fcmToken = null;

  try {
    // Register the background task
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    if (!isRegistered) {
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      console.log('✅ Background notification task registered');
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
    // Get Expo Push Token
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
      } else {
        try {
          const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
          if (!projectId) {
            console.log('⚠️  Project ID not found in expo config');
          } else {
            expoToken = (
              await Notifications.getExpoPushTokenAsync({
                projectId,
              })
            ).data;
            console.log('✅ Expo Push Token:', expoToken);
          }
        } catch (e) {
          console.log('Error getting expo push token:', e);
        }
      }
    } catch (error) {
      console.error('Error setting up Expo notifications:', error);
    }

    // Get FCM Token (Android only)
    if (Platform.OS === 'android') {
      try {
        // Request permission first
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          fcmToken = await getFCMToken();
          console.log('✅ FCM setup complete');
        } else {
          console.warn('FCM permission not granted');
        }
      } catch (error) {
        console.error('Error setting up FCM:', error);
      }
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return {
    expoToken,
    fcmToken,
  };
}

/**
 * Handle notification clicks and routing
 */
export function handleNotificationResponse(response, router, userRole) {
  const data = response.notification.request.content.data;

  console.log('Notification Response received:', data, 'User Role:', userRole);

  // Route based on notification type
  if (data?.bookingId) {
    if (userRole === 'vendor') {
      router.push({
        pathname: '/vendor/booking/[id]',
        params: { id: data.bookingId },
      });
    } else {
      router.push({
        pathname: '/client/booking/[id]',
        params: { id: data.bookingId },
      });
    }
  } else if (data?.chatId) {
    router.push({
      pathname: '/chat/[id]',
      params: { id: data.chatId },
    });
  }
}

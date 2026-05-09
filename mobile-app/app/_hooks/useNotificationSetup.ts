import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
  registerForPushNotificationsAsync,
  setupFCMForegroundHandler,
  setupFCMBackgroundHandler,
  setupFCMNotificationHandler,
  onFCMTokenRefresh,
  handleNotificationResponse,
} from '@/app/_utils/fcmService';
import { updatePushTokens } from '@/app/_utils/pushTokenManager';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useUser } from '@/app/_context/UserContext';

/**
 * Hook to set up all push notification handlers
 * Call this once when the app starts or user logs in
 */
export function useNotificationSetup() {
  const router = useRouter();
  const { user, loading } = useUser();
  const unsubscribesRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (loading) return;

    const initializeNotifications = async () => {
      try {
        console.log('🔧 Initializing push notifications...');

        // Register and get tokens
        const { expoToken, fcmToken } = await registerForPushNotificationsAsync();

        // Send tokens to backend only when authenticated
        if (user?.id && (expoToken || fcmToken)) {
          await updatePushTokens(expoToken, fcmToken);
        } else if (!user?.id) {
          console.log('Skipping token update: user not authenticated yet');
        }

        // Set up handlers
        if (Platform.OS === 'android') {
          // Setup FCM handlers for Android
          setupFCMBackgroundHandler();

          const unsubscribeForeground = setupFCMForegroundHandler();
          const unsubscribeTokenRefresh = onFCMTokenRefresh(async newToken => {
            console.log('FCM token refreshed, updating backend...');
            if (user?.id) {
              await updatePushTokens(undefined, newToken);
            }
          });

          const unsubscribeNotificationPress = setupFCMNotificationHandler(
            remoteMessage => {
              handleNotificationResponse(
                {
                  notification: {
                    request: {
                      content: {
                        title: remoteMessage.notification?.title || '',
                        body: remoteMessage.notification?.body || '',
                        data: remoteMessage.data || {},
                      },
                    },
                  },
                } as any,
                router,
                user?.role
              );
            }
          );

          unsubscribesRef.current.push(
            unsubscribeForeground,
            unsubscribeTokenRefresh,
            unsubscribeNotificationPress
          );
        }

        // Set up handler for Expo notifications (tap)
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
          handleNotificationResponse(response, router, user?.role);
        });

        unsubscribesRef.current.push(() => subscription.remove());

        console.log('✅ Push notifications initialized successfully');
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();

    // Cleanup on unmount
    return () => {
      unsubscribesRef.current.forEach(unsubscribe => {
        try {
          unsubscribe?.();
        } catch (error) {
          console.error('Error cleaning up notification handler:', error);
        }
      });
    };
  }, [loading, user?.id, user?.role, router]);
}

/**
 * Hook to update FCM token when it changes
 * Use this if you need to update the token in specific scenarios
 */
export function useFCMTokenRefresh() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const unsubscribe = onFCMTokenRefresh(async newToken => {
      console.log('Updating FCM token:', newToken);
      await updatePushTokens(undefined, newToken);
    });

    return unsubscribe;
  }, []);
}

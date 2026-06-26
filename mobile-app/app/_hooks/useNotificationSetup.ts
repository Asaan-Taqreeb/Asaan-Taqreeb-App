import { useEffect, useRef } from 'react';
import { InteractionManager, Platform } from 'react-native';
import Constants from 'expo-constants';
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
  const initializedUserIdRef = useRef<string | null>(null);
  const isExpoGo =
    Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';

  useEffect(() => {
    if (loading || !user?.id || user.isGuest || initializedUserIdRef.current === user.id) return;

    initializedUserIdRef.current = user.id;
    let interactionHandle: { cancel: () => void } | null = null;
    let cancelled = false;

    const initializeNotifications = async () => {
      if (cancelled) return;

      try {
        console.log('🔧 Initializing push notifications...');

        // Register and get tokens
        const { expoToken, fcmToken } = await registerForPushNotificationsAsync();

        // Send tokens to backend only when authenticated
        if (user?.id && (expoToken || fcmToken)) {
          await updatePushTokens(expoToken || undefined, fcmToken || undefined);
        } else if (!user?.id) {
          console.log('Skipping token update: user not authenticated yet');
        }

        // Set up handlers (only if not Expo Go, to avoid native module calls)
        if (Platform.OS === 'android' && !isExpoGo) {
          // Setup FCM handlers for Android
          setupFCMBackgroundHandler();

          const unsubscribeForeground = setupFCMForegroundHandler();
          const unsubscribeTokenRefresh = onFCMTokenRefresh(async (newToken: string) => {
            console.log('FCM token refreshed, updating backend...');
            if (user?.id) {
              await updatePushTokens(undefined, newToken);
            }
          });

          const unsubscribeNotificationPress = setupFCMNotificationHandler(
            (remoteMessage: any) => {
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

    interactionHandle = InteractionManager.runAfterInteractions(() => {
      initializeNotifications();
    });

    // Cleanup on unmount
    return () => {
      cancelled = true;
      interactionHandle?.cancel();
      initializedUserIdRef.current = null;
      unsubscribesRef.current.forEach(unsubscribe => {
        try {
          unsubscribe?.();
        } catch (error) {
          console.error('Error cleaning up notification handler:', error);
        }
      });
      unsubscribesRef.current = [];
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

    const unsubscribe = onFCMTokenRefresh(async (newToken: string) => {
      console.log('Updating FCM token:', newToken);
      await updatePushTokens(undefined, newToken);
    });

    return unsubscribe;
  }, []);
}

import { useEffect, useRef } from 'react';
import { InteractionManager, Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  registerForPushNotificationsAsync,
  handleNotificationResponse,
} from '@/app/_utils/pushNotificationService';
import {
  registerPWAServiceWorker,
  subscribeToWebPush,
} from '@/app/_utils/pwaNotificationRegister';
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

  useEffect(() => {
    if (loading || !user?.id || user.isGuest || initializedUserIdRef.current === user.id) return;

    initializedUserIdRef.current = user.id;
    let interactionHandle: { cancel: () => void } | null = null;
    let cancelled = false;

    // Web Platform Setup (Progressive Web App)
    if (Platform.OS === 'web') {
      const initializeWebNotifications = async () => {
        if (cancelled) return;
        try {
          console.log('🔧 Initializing Web/PWA push notifications...');
          const swReg = await registerPWAServiceWorker();
          if (swReg) {
            await subscribeToWebPush(swReg, updatePushTokens);
          }
        } catch (error) {
          console.error('Error initializing web notifications:', error);
        }
      };

      interactionHandle = InteractionManager.runAfterInteractions(() => {
        initializeWebNotifications();
      });

      // Listen for notification click routing messages posted from the Service Worker
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'NOTIFICATION_CLICK') {
            console.log('Notification click received from SW:', event.data.data);
            handleNotificationResponse({ data: event.data.data } as any, router, user?.role);
          }
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);
        return () => {
          cancelled = true;
          interactionHandle?.cancel();
          initializedUserIdRef.current = null;
          navigator.serviceWorker.removeEventListener('message', handleMessage);
        };
      }

      return () => {
        cancelled = true;
        interactionHandle?.cancel();
        initializedUserIdRef.current = null;
      };
    }

    // Native Platforms Setup (iOS / Android)
    const initializeNativeNotifications = async () => {
      if (cancelled) return;

      try {
        console.log('🔧 Initializing Native push notifications...');

        // Register and get token
        const expoToken = await registerForPushNotificationsAsync();

        // Send token to backend only when authenticated
        if (expoToken) {
          await updatePushTokens(expoToken, undefined);
        }

        // Set up handler for foreground notifications
        const foregroundSub = Notifications.addNotificationReceivedListener(notification => {
          console.log('🔔 Notification received in foreground:', notification);
        });

        // Set up handler for Expo notifications tap / click response
        const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
          handleNotificationResponse(response, router, user?.role);
        });

        unsubscribesRef.current.push(
          () => foregroundSub.remove(),
          () => responseSub.remove()
        );

        console.log('✅ Native Push notifications initialized successfully');
      } catch (error) {
        console.error('Error initializing native notifications:', error);
      }
    };

    interactionHandle = InteractionManager.runAfterInteractions(() => {
      initializeNativeNotifications();
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
          console.error('Error cleaning up native notification listener:', error);
        }
      });
      unsubscribesRef.current = [];
    };
  }, [loading, user?.id, user?.role, router]);
}

/**
 * Hook to update token when it changes (stubbed for backward compatibility)
 */
export function useFCMTokenRefresh() {
  // Native FCM direct token refreshing is not used since we standardized on Expo-notifications.
  // This is kept as a stub to avoid import breaking changes elsewhere.
  return () => {};
}

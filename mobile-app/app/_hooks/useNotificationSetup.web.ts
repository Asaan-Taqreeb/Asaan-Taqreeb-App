import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useUser } from '@/app/_context/UserContext';
import {
  registerPWAServiceWorker,
  subscribeToWebPush,
} from '@/app/_utils/pwaNotificationRegister';
import { updatePushTokens } from '@/app/_utils/pushTokenManager';
import { handleNotificationResponse } from '@/app/_utils/pushNotificationService';

/**
 * Web setup for push notifications and notification-click routing.
 */
export function useNotificationSetup() {
  const router = useRouter();
  const { user, loading } = useUser();
  const initializedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !user?.id || user.isGuest || initializedUserIdRef.current === user.id) return;

    initializedUserIdRef.current = user.id;
    let cancelled = false;
    const cleanup: Array<() => void> = [];

    const initializeWebNotifications = async () => {
      try {
        const registration = await registerPWAServiceWorker();
        if (!registration || cancelled) return;

        await subscribeToWebPush(registration, updatePushTokens);
        if (cancelled) return;

        const handleServiceWorkerMessage = (event: MessageEvent) => {
          const data = event.data;
          if (!data || data.type !== 'NOTIFICATION_CLICK') return;

          handleNotificationResponse({ data: data.data }, router, user?.role);
        };

        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        cleanup.push(() => navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage));
      } catch (error) {
        console.error('Error initializing web notifications:', error);
      }
    };

    initializeWebNotifications();

    return () => {
      cancelled = true;
      initializedUserIdRef.current = null;
      cleanup.forEach((unsubscribe) => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error cleaning up web notification listener:', error);
        }
      });
    };
  }, [loading, router, user?.id, user?.isGuest, user?.role]);
}

export function useFCMTokenRefresh() {
  return () => {};
}

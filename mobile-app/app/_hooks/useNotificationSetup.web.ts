/**
 * Web stub for useNotificationSetup to prevent importing native expo-notifications on web.
 */
export function useNotificationSetup() {
  // Push notifications are disabled on web/PWA currently
  return;
}

export function useFCMTokenRefresh() {
  return () => {};
}

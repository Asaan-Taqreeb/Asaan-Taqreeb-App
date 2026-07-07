/**
 * Web stub for pushNotificationService to prevent importing native expo-notifications on web.
 */

export async function registerForPushNotificationsAsync() {
  return { expoToken: null, fcmToken: null };
}

export function handleNotificationResponse(response: any, router: any, userRole?: string) {
  // Noop on web
}

export async function dismissAllTrayNotifications() {
  // Noop on web
}

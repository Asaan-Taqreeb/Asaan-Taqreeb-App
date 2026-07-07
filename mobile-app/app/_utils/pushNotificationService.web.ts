/**
 * Web stub for pushNotificationService to prevent importing native expo-notifications on web.
 */

export async function registerForPushNotificationsAsync() {
  return { expoToken: null, fcmToken: null };
}

export function handleNotificationResponse(response: any, router: any, userRole?: string) {
  const data = response?.notification?.request?.content?.data || response?.data || {};

  if (data.chatId) {
    if (data.vendorId && userRole !== 'vendor') {
      router.push({
        pathname: '/screens/client/Component/VendorChatScreen',
        params: { chatId: data.chatId, vendorId: data.vendorId },
      });
      return;
    }

    if (data.clientId || userRole === 'vendor') {
      router.push({
        pathname: '/screens/vendor/Component/ClientChatScreen',
        params: { chatId: data.chatId, clientId: data.clientId },
      });
      return;
    }
  }

  if (data.bookingId) {
    if (userRole === 'vendor') {
      router.push('/screens/vendor/(tabs)/VendorDashboardHome');
    } else {
      router.push('/screens/client/(tabs)/BookingScreen');
    }
  }
}

export async function dismissAllTrayNotifications() {
  // Noop on web
}

import "../global.css";
import React, { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { UserProvider, useUser } from '@/app/_context/UserContext';
import { SocketProvider } from '@/app/_context/SocketContext';
import { registerForPushNotificationsAsync, handleNotificationResponse } from '@/app/_utils/pushNotificationService';
import { updateMe } from '@/app/_utils/authApi';

function NotificationHandler() {
  const { user } = useUser();
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (!user) return;

    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        // Update user's push token on the backend
        updateMe({ expoPushToken: token }).catch(err => {
          console.log('Failed to update push token on backend:', err);
        });
      }
    });

    // Listen for notifications received while app is running
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received while app running:', notification);
    });

    // Listen for notification clicks
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response, router);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user, router]);

  return null;
}

export default function RootLayout() { 
  return (
    <UserProvider>
      <SocketProvider>
        <NotificationHandler />
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </SocketProvider>
    </UserProvider>
  );
}
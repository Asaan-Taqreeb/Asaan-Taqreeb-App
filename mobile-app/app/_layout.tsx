import "../global.css";
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from '@/app/_context/UserContext';
import { SocketProvider } from '@/app/_context/SocketContext';
import { useNotificationSetup } from '@/app/_hooks/useNotificationSetup';

function NotificationInitializer() {
  useNotificationSetup();
  return null;
}

export default function RootLayout() { 
  return (
    <UserProvider>
      <SocketProvider>
        <NotificationInitializer />
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </SocketProvider>
    </UserProvider>
  );
}
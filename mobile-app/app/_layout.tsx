import "../global.css";
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from '@/app/_context/UserContext';
import { LanguageProvider } from '@/app/_context/LanguageContext';
import { SocketProvider } from '@/app/_context/SocketContext';
import { useNotificationSetup } from '@/app/_hooks/useNotificationSetup';

function NotificationInitializer() {
  useNotificationSetup();
  return null;
}

export default function RootLayout() { 
  return (
    <UserProvider>
      <LanguageProvider>
        <SocketProvider>
          <NotificationInitializer />
          <StatusBar style="dark" backgroundColor="#F8FAFC" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
          </Stack>
        </SocketProvider>
      </LanguageProvider>
    </UserProvider>
  );
}
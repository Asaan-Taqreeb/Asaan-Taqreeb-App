import "../global.css";
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { UserProvider } from '@/app/_context/UserContext';
import { LanguageProvider } from '@/app/_context/LanguageContext';
import { SocketProvider } from '@/app/_context/SocketContext';
import { ThemeProvider } from '@/app/_context/ThemeContext';
import { useNotificationSetup } from '@/app/_hooks/useNotificationSetup';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'Android Push notifications (remote notifications) functionality'
]);

function NotificationInitializer() {
  useNotificationSetup();
  return null;
}

export default function RootLayout() { 
  return (
    <UserProvider>
      <ThemeProvider>
        <LanguageProvider>
          <SocketProvider>
            <NotificationInitializer />
            <StatusBar style="dark" backgroundColor="#F8FAFC" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
            </Stack>
          </SocketProvider>
        </LanguageProvider>
      </ThemeProvider>
    </UserProvider>
  );
}
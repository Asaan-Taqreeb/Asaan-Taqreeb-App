import "../global.css";
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, View, StyleSheet, Platform } from 'react-native';
import { UserProvider } from '@/app/_context/UserContext';
import { LanguageProvider } from '@/app/_context/LanguageContext';
import { SocketProvider } from '@/app/_context/SocketContext';
import { ThemeProvider, useTheme } from '@/app/_context/ThemeContext';
import { LocationProvider } from '@/app/_context/LocationContext';
import { useNotificationSetup } from '@/app/_hooks/useNotificationSetup';
import { useAppUpdateCheck } from '@/app/_hooks/useAppUpdateCheck';
import AppUpdateModal from '@/app/_components/AppUpdateModal';
import { useEffect, useState } from 'react';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'Android Push notifications (remote notifications) functionality',
  'Expo AV has been deprecated and will be removed'
]);

function NotificationInitializer() {
  useNotificationSetup();
  return null;
}

function UpdateInitializer() {
  const { checking, updateAvailable, currentVersion, latestVersion, apkUrl, forceUpdate, releaseNotes } = useAppUpdateCheck();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (updateAvailable) {
      setDismissed(false);
    }
  }, [updateAvailable, latestVersion]);

  return (
    <AppUpdateModal
      visible={!checking && updateAvailable && !dismissed}
      currentVersion={currentVersion}
      latestVersion={latestVersion}
      releaseNotes={releaseNotes}
      apkUrl={apkUrl}
      forceUpdate={forceUpdate}
      onClose={() => setDismissed(true)}
    />
  );
}

import { useWindowDimensions } from 'react-native';

function AppContent({ stackContent }: { stackContent: React.ReactNode }) {
  const { isDark, colors } = useTheme();
  const { width } = useWindowDimensions();
  const webZoom = Platform.OS === 'web'
    ? width < 360
      ? 0.88
      : width < 768
        ? 0.92
        : width < 1200
          ? 0.96
          : 1
    : 1;

  return (
    <>
      <StatusBar 
        style={isDark ? 'light' : 'dark'} 
        backgroundColor={colors.background} 
      />
      {Platform.OS === 'web' ? (
        <View style={[styles.webContainer, { backgroundColor: isDark ? '#090C04' : '#F1F5F9' }]}>
          <View style={[styles.webContent, { backgroundColor: colors.background, zoom: webZoom } as any]}>
            {stackContent}
          </View>
        </View>
      ) : (
        stackContent
      )}
    </>
  );
}

export default function RootLayout() { 
  const stackContent = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );

  return (
    <UserProvider>
      <LocationProvider>
        <ThemeProvider>
          <LanguageProvider>
            <SocketProvider>
              <NotificationInitializer />
              <UpdateInitializer />
              <AppContent stackContent={stackContent} />
            </SocketProvider>
          </LanguageProvider>
        </ThemeProvider>
      </LocationProvider>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  webContent: {
    width: '100%',
    maxWidth: 1200,
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
});
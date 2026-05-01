import "../global.css";
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from '@/app/_context/UserContext';
import { SocketProvider } from '@/app/_context/SocketContext';

export default function RootLayout() { 
  return (
    <UserProvider>
      <SocketProvider>
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </SocketProvider>
    </UserProvider>
  );
}
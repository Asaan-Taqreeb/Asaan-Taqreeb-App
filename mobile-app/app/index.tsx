import WelcomeScreen from "./screens/WelcomeScreen";
import { useUser } from '@/app/_context/UserContext'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native'
import { hasSeenOnboarding } from '@/app/_utils/onboardingStorage'
import { Colors } from "@/app/_constants/theme";
import AppLogo from "./screens/client/Component/AppLogo";

export default function Index() {
  const { user, loading } = useUser()
  const router = useRouter()
  const params = useLocalSearchParams<{ chatId?: string; vendorId?: string; clientId?: string; bookingId?: string }>()

  useEffect(() => {
    let isMounted = true

    const chatId = typeof params.chatId === 'string' ? params.chatId : undefined
    const vendorId = typeof params.vendorId === 'string' ? params.vendorId : undefined
    const clientId = typeof params.clientId === 'string' ? params.clientId : undefined
    const bookingId = typeof params.bookingId === 'string' ? params.bookingId : undefined

    const handleDeepLink = async () => {
      if (!user?.role) return false
      // Guests should not be deep-linked into authenticated screens
      if (user.isGuest) return false

      if (chatId) {
        if (user.role === 'vendor') {
          router.replace({
            pathname: '/screens/vendor/Component/ClientChatScreen',
            params: {
              chatId,
              clientId: clientId ?? '',
            },
          })
        } else {
          router.replace({
            pathname: '/screens/client/Component/VendorChatScreen',
            params: {
              chatId,
              vendorId: vendorId ?? '',
            },
          })
        }

        return true
      }

      if (bookingId) {
        router.replace(user.role === 'vendor' ? '/screens/vendor/(tabs)/OrdersScreen' : '/screens/client/(tabs)/BookingScreen')
        return true
      }

      return false
    }

    const routeAuthenticatedUser = async () => {
      const handledDeepLink = await handleDeepLink()
      if (handledDeepLink) return

      if (!user?.role) return

      if (user.isGuest) {
        router.replace('/screens/client/ClientHomeScreen')
        return
      }

      if (user.role === 'vendor') {
        router.replace('/screens/vendor/VendorHomeScreen')
        return
      }

      const identifier = String(user?.id || user?.email || '')
      const seenOnboarding = await hasSeenOnboarding(identifier)
      if (!isMounted) return

      router.replace(seenOnboarding ? '/screens/client/ClientHomeScreen' : '/screens/client/Component/OnBoardingScreen')
    }

    if (!loading && user) {
      routeAuthenticatedUser()
    }

    return () => {
      isMounted = false
    }
  }, [loading, router, user, params.chatId, params.vendorId, params.clientId, params.bookingId])

  if (loading || user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <AppLogo size="large" />
        <ActivityIndicator 
          size="small" 
          color={Colors.primary} 
          style={{ marginTop: 40 }} 
        />
      </View>
    )
  }

  return <WelcomeScreen />
};

const style = StyleSheet.create({
  logoBox: {
    backgroundColor: Colors.vendor, // Midnight Navy
    borderRadius: 24,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  }
})

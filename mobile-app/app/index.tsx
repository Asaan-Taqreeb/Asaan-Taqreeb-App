import WelcomeScreen from "./screens/WelcomeScreen";
import { useUser } from '@/app/_context/UserContext'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { hasSeenOnboarding } from '@/app/_utils/onboardingStorage'


export default function Index() {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const routeAuthenticatedUser = async () => {
      if (!user?.role) return

      if (user.role === 'vendor') {
        router.replace('/screens/vendor/VendorHomeScreen')
        return
      }

      const identifier = String(user?.id || user?.email || '')
      const seenOnboarding = await hasSeenOnboarding(identifier)
      if (!isMounted) return

      router.replace(seenOnboarding ? '/screens/client/_tabs/ClientHomeScreen' : '/screens/client/Component/OnBoardingScreen')
    }

    if (!loading && user) {
      routeAuthenticatedUser()
    }

    return () => {
      isMounted = false
    }
  }, [loading, router, user])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size='large' color='#4F46E5' />
      </View>
    )
  }

  if (user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size='large' color='#4F46E5' />
      </View>
    )
  }

  return <WelcomeScreen />
};

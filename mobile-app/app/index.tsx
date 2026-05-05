import WelcomeScreen from "./screens/WelcomeScreen";
import { useUser } from '@/app/_context/UserContext'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native'
import { hasSeenOnboarding } from '@/app/_utils/onboardingStorage'
import { Colors, Shadows } from "@/app/_constants/theme";
import { PartyPopper } from "lucide-react-native"
import AppLogo from "./screens/client/Component/AppLogo";

export default function Index() {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const routeAuthenticatedUser = async () => {
      if (!user?.role) return

      // Handle email verification
      if (!user.isEmailVerified) {
        const verificationRoute = user.role === 'vendor' 
          ? '/screens/vendor/VerificationScreen' 
          : '/screens/client/Component/VerificationScreen'
          
        router.replace({
          pathname: verificationRoute,
          params: { email: user.email, role: user.role }
        } as any)
        return
      }

      // Handle identity verification (KYC)
      if (user.verificationStatus === 'unverified' || user.verificationStatus === 'rejected') {
        router.replace('/screens/auth/KycScreen')
        return
      }

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

  if (loading || user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <AppLogo size="medium" />
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

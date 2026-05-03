import { router } from 'expo-router'
import { StyleSheet, Text, View, Image, Pressable, Dimensions, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRef, useEffect } from 'react'
import { useUser } from '@/app/_context/UserContext'
import { hasSeenOnboarding, markOnboardingSeen } from '@/app/_utils/onboardingStorage'
import { Colors, Shadows } from '@/app/_constants/theme'

const DATA = [
  {
    title: "Plan Events in Minutes",
    headline: "From weddings to birthdays, find the best venues, caterers, and photographers in one place.",
    imgSource: require("../../../../assets/myImages/Wedding.png"),
    accent: Colors.primary
  },
  {
    title: "Stick to Your Budget",
    headline: "Chat with our AI Assistant to find deals that match your price range instantly.",
    imgSource: require("../../../../assets/myImages/SavingMoney.png"),
    accent: Colors.success
  },
  {
    title: "Book with Confidence",
    headline: "100% verified vendors. We check IDs and track records so you don&apos;t have to.",
    imgSource: require("../../../../assets/myImages/Trust.png"),
    accent: Colors.info
  },
]

export default function OnBoadingScreen() {
  const insets = useSafeAreaInsets()
  const windowDimensions = Dimensions.get('window')
  const scrollViewRef = useRef<ScrollView>(null)
  const currentIndexRef = useRef(0)
  const { user } = useUser()

  const userIdentifier = String(user?.id || user?.email || '')

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (currentIndexRef.current + 1) % DATA.length
      currentIndexRef.current = next
      scrollViewRef.current?.scrollTo({
        x: next * windowDimensions.width,
        animated: true
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [windowDimensions.width])

  useEffect(() => {
    let isMounted = true

    const skipIfAlreadySeen = async () => {
      if (!userIdentifier) return
      const seenOnboarding = await hasSeenOnboarding(userIdentifier)
      if (!isMounted) return

      if (seenOnboarding) {
        router.replace('/screens/client/_tabs/ClientHomeScreen')
      }
    }

    skipIfAlreadySeen()

    return () => {
      isMounted = false
    }
  }, [userIdentifier])

  const handleContinue = async () => {
    if (userIdentifier) {
      await markOnboardingSeen(userIdentifier)
    }
    router.replace('/screens/client/_tabs/ClientHomeScreen')
  }

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={(event) => {
          const contentOffset = event.nativeEvent.contentOffset.x
          const index = Math.round(contentOffset / windowDimensions.width)
          currentIndexRef.current = index
        }}
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
      >
        {DATA.map((item, idx) => (
          <View key={idx} style={{width: windowDimensions.width, paddingHorizontal: 40}} className='justify-center'>
            <View 
              className='rounded-3xl overflow-hidden mb-10' 
              style={[{width: "100%", height: "45%"}, Shadows.medium]}
            >
              <Image source={item.imgSource} 
                style={{width: "100%", height: "100%"}} 
                resizeMode='cover' />
            </View>
            <View>
              <Text className='text-3xl font-extrabold text-center mb-4' style={{color: Colors.textPrimary}}>{item.title}</Text>
              <Text className='text-base text-center leading-relaxed font-medium' style={{color: Colors.textSecondary}}>{item.headline}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className='px-10 pb-12'>
        <Pressable 
          className='py-4 rounded-2xl active:opacity-90 flex-row items-center justify-center' 
          style={[{backgroundColor: Colors.primary}, Shadows.small]}
          onPress={handleContinue}
        >
          <Text className='text-lg font-bold text-white'>Get Started</Text>
        </Pressable>
        <Text className='text-center mt-6 text-[10px] font-bold text-gray-400 tracking-widest'>
          ASAN TAQREEB PLATFORM
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white
  }
})
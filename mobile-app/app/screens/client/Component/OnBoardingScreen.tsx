import { router } from 'expo-router'
import { StyleSheet, Text, View, Image, Pressable, Dimensions, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRef, useEffect } from 'react'
import { XCircle } from 'lucide-react-native'

const DATA = [
  {
    title: "Plan Events in Minutes",
    headline: "From weddings to birthdays, find the best venues, caterers, and photographers in one place.",
    imgSource: require("../../../../assets/myImages/Wedding.png"),
    outline: "#F97316"
  },
  {
    title: "Stick to Your Budget",
    headline: "Chat with our AI Assistant to find deals that match your price range instantly.",
    imgSource: require("../../../../assets/myImages/SavingMoney.png"),
    outline: "#22C55E"
  },
  {
    title: "Book with Confidence",
    headline: "100% verified vendors. We check IDs and track records so you don't have to.",
    imgSource: require("../../../../assets/myImages/Trust.png"),
    outline: "#4F46E5"
  },
]

export default function OnBoadingScreen() {
const insets = useSafeAreaInsets()
const windowDimensions = Dimensions.get('window')
const scrollViewRef = useRef<ScrollView>(null)
const currentIndexRef = useRef(0)

useEffect(() => {
  const interval = setInterval(() => {
    const next = (currentIndexRef.current + 1) % DATA.length
    currentIndexRef.current = next
    scrollViewRef.current?.scrollTo({
      x: next * windowDimensions.width,
      animated: true
    })
  }, 2500)

  return () => clearInterval(interval)
}, [windowDimensions.width])

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
            <View key={idx} style={{width: windowDimensions.width}} className='flex-col justify-center items-center'>
              <Image source={item.imgSource} 
                className='rounded-xl'
                style={{width: "100%", height:"50%"}} 
                resizeMode='cover' />
              <View className='w-4/5 self-center mt-3'>
                <Text className='text-3xl font-bold text-center mb-5' style={[styles.textDecoartion, {borderBottomColor: `${item.outline}` }]} >{item.title}</Text>
                <Text className='text-xl text-justify'>{item.headline}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      <Pressable className='active:opacity-70 mb-36' 
        onPress={() => router.push("/screens/client/_tabs/ClientHomeScreen")}
      >
        <Text className='text-xl self-center bg-[#22C55E] w-1/2 py-4 rounded-xl text-center font-bold text-[#F8FAFC]'>Countinue</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F8FAFC"
  },
  textDecoartion: {
    borderBottomWidth: 2,
    paddingBottom: 2
  }
})
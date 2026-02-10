import { router } from 'expo-router'
import { CircleAlert, MapPin, Star, Users } from 'lucide-react-native'
import { ScrollView } from 'react-native'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function DetailScreenPage() {
    const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
        <View>
            <Image 
                source={{uri: "https://lh3.googleusercontent.com/blogger_img_proxy/AEn0k_vXYwCKqiJgnUhyg3HYqUJbp37TJvL-vD3Z9KK33cqMYRcvcAIakZmpNVfYlZZOr_vhIlZnrUrMJC3ynC1m3AV3mJ7ItlOPvFzSOfqPAtJZ56YegA=w1200-h630-p-k-no-nu"}} 
                style={{width: "100%", height: "30%"}}
                resizeMode='cover'
            />
            <ScrollView className='mt-2'>
                <View className='flex-row justify-between items-center p-5'>
                    <View>
                        <Text className='text-2xl font-bold mb-2'>Grand Taj Banquet</Text>
                        <Text className='text-base'><MapPin />  Gulshan e Iqbal</Text>
                    </View>
                    <View>
                        <Text className='text-xl font-medium text-indigo-600 text-center'>PKR 250,000</Text>
                        <Text className='text-base text-center'>Starting Price</Text>
                    </View>
                </View>
                <View className='flex-row justify-normal items-center gap-2 mt-2 mx-5'>
                    <View className='bg-amber-50 px-2 py-2 rounded-lg'>
                        <Text className='text-base text-amber-600 font-medium'><Star color={"#d97706"} fill={"#d97706"} />  4.8</Text>
                    </View>
                    <View className='bg-blue-50 px-2 py-2 rounded-lg'>
                        <Text className='text-base text-blue-600 font-medium'><CircleAlert color={"#2563eb"} />  50% Refundable</Text>
                    </View>
                </View>
                <View className='mt-2 mx-5'>
                    <Text className='text-xl font-semibold'>About</Text>
                    <Text className='text-base mt-2'>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Corporis culpa consequatur maiores asperiores soluta numquam!</Text>
                    <View className='flex-row items-center mt-2 gap-4'>
                        <View className='bg-[#FFFFFF] w-2/5 py-4 rounded-xl' style={styles.boxShadow}>
                            <Text className='text-xl font-semibold text-center'>Min Capacity</Text>
                            <Text className='text-center text-lg font-medium'>200{" "}
                                <Text className='text-base font-normal'>Guests</Text>
                            </Text>
                        </View>
                        <View className='bg-[#FFFFFF] w-2/5 py-4 rounded-xl' style={styles.boxShadow}>
                            <Text className='text-xl font-medium text-center'>Max Capacity</Text>
                            <Text className='text-center text-lg font-medium'>500{" "}
                                <Text className='text-base font-normal'>Guests</Text>
                            </Text>
                        </View>
                    </View>
                </View>
                <View className='mt-5 mx-5'>
                    <Text className='text-xl font-medium mb-2'>Services</Text>
                    <View className='flex-row justify-start items-center gap-3'>
                        <View className='bg-gray-100 w-32 py-3 rounded-lg'>
                            <Text className='text-center text-base'>Backup Generator</Text>
                        </View>
                    </View>
                </View>
                <Pressable 
                    className='active:opacity-55 mt-5 self-center bg-indigo-600 rounded-xl w-11/12 py-5'
                    style={styles.boxShadow}
                >
                    <Text className='text-xl text-[#FAFAFA] text-center font-bold'>Request Booking</Text>
                </Pressable>
            </ScrollView>
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: "#FAFAFA"
    },
    boxShadow: {
        shadowColor: "#0A0A0A",
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 6
    }
})
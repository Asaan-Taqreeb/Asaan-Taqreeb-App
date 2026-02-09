import { router } from 'expo-router'
import { Car, CircleX, House, IdCard, MapPin, Star, Users } from 'lucide-react-native'
import { ScrollView } from 'react-native'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function DetailScreenPage() {
    const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
        <View className='flex-1'>
            <Pressable className='px-4 pt-5 active:opacity-60' onPress={() => router.push("/screens/client/_tabs/ClientHomeScreen")} >
                <CircleX  size={25} />
            </Pressable>
            <Image 
                source={{uri: "https://lh3.googleusercontent.com/blogger_img_proxy/AEn0k_vXYwCKqiJgnUhyg3HYqUJbp37TJvL-vD3Z9KK33cqMYRcvcAIakZmpNVfYlZZOr_vhIlZnrUrMJC3ynC1m3AV3mJ7ItlOPvFzSOfqPAtJZ56YegA=w1200-h630-p-k-no-nu"}} 
                style={{width: "100%", height: "40%"}}
                resizeMode='cover'
            />
            <ScrollView style={{flex: 1}} scrollEnabled={true}>
                
                <View className='flex-row justify-between items-center mt-10'>
                    <View>
                        <Text className='text-3xl font-bold'>Grand Taj Banquet</Text>
                        <Text className='text-base'><MapPin />  Gulshan-e-Iqbal</Text>
                    </View>
                    <View className=''>
                        <Text className='text-xl font-medium'>PKR 250,000</Text>
                        <Text className='text-base text-center'>Starting Price</Text>
                    </View>
                </View>
                <View className='flex-row justify-center gap-5 items-center mt-5'>
                    <View className='flex-row justify-center gap-2 items-center bg-[#ffe4d0] w-5/12 py-4 rounded-2xl'>
                        <Star size={25} fill={"#F97316"} color={"#F97316"} />
                        <Text className='text-2xl font-bold'>4.8</Text>
                    </View>
                    <View className='flex-row justify-center gap-2 items-center bg-[#B9F3CE] w-5/12 py-4 rounded-2xl'>
                        <IdCard color={"#22C55E"} size={25} />
                        <Text className='text-xl font-bold'>Verfied</Text>
                    </View>
                </View>
                <View className='bg-[#F3E5F5] w-11/12 mt-5 self-center rounded-2xl'>
                    <View className='mx-5 mt-2'>
                        <Text className='text-xl font-medium text-[#4F46E5]'><House color={"#4F46E5"} />  Hall Features</Text>
                    </View>
                    <View className='flex-row justify-around items-center my-2'>
                        <Text className='text-base'><Users size={15} fill={"#0A0A0A"} />  500 - 800 Guests</Text>
                        <Text className='text-base'><Car size={15} />  Valet Available</Text>
                    </View>
                </View>
                <View className='mx-5'>
                    <Text className='text-xl font-semibold mt-5'>Services</Text>
                    <View className='flex-row justify-normal gap-3 items-center flex-wrap mt-2'>
                        <View className='bg-gray-200 items-center rounded-lg mt-2'>
                            <Text className='text-base m-2 font-medium'>Brdial Room</Text>
                        </View>
                                            <View className='bg-gray-200 items-center rounded-lg mt-2'>
                            <Text className='text-base m-2 font-medium'>Backup Generator</Text>
                        </View>
                                            <View className='bg-gray-200 items-center rounded-lg mt-2'>
                            <Text className='text-base m-2 font-medium'>Sound System</Text>
                        </View>
                                            <View className='bg-gray-200 items-center rounded-lg mt-2'>
                            <Text className='text-base m-2 font-medium'>Stage Decor</Text>
                        </View>
                    </View>
                </View>
                <View className='mx-5 mt-5'>
                    <Text className='text-xl font-medium'>About</Text>
                    <Text className='text-lg'>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Voluptas, in perferendis! Est eos architecto labore, ut dolores at. Totam itaque eius, cumque, ipsum vero eligendi natus commodi repellat facere labore voluptates soluta error, modi cupiditate!</Text>
                </View>
            </ScrollView>
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: "#F5F5F5"
    }
})
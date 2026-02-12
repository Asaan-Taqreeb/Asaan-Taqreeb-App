import { router } from 'expo-router'
import { ArrowLeft, CheckCircle, CircleQuestionMark, CreditCard, LogOut, MapPin } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Avatar } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ProfileView() {
  const insets = useSafeAreaInsets()

    return (
        <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
            <View>
                <View className='m-5 flex-row justify-normal items-center gap-5 border-b border-gray-300 py-2'>
                    <Pressable className='bg-gray-100 rounded-full px-2 py-2' onPress={() => router.push("/screens/client/_tabs/ClientHomeScreen")}>
                        <ArrowLeft color={"#4546E5"} />
                    </Pressable>
                    <Text className='text-2xl font-bold'>Profile Overview</Text>
                </View>
                <View style={styles.boxShadow} className='px-5 rounded-[25] w-11/12 h-32 bg-[#FFFFFF] justify-center self-center'>
                    <View className='flex-row justify-around items-center'>
                        <Avatar.Text
                            size={80}
                            label='MZ'
                            color='#4F46E5'
                            style={{backgroundColor: '#F3F4F6', borderRadius: 100}}
                            labelStyle={{fontWeight: 'bold'}}
                        />
                        <View>
                            <Text className='text-lg font-medium '>Mirza Zain</Text>
                            <Text className='text-base font-medium text-gray-600'>mirzazain269@gmail.com</Text>
                            <Text className='text-base text-green-600 font-bold mt-2'><CheckCircle color={"#16a34a"} />  Verified ID</Text>
                        </View>
                    </View>
                </View>
                <View className='my-10 gap-5'>
                    {/* Payment Method */}
                    <Pressable 
                        className='px-8 flex-row justify-normal items-center bg-[#FFFFFF] w-11/12 self-center h-20 rounded-xl gap-5' 
                        style={styles.boxShadow}
                    >
                        <View className='bg-green-50 px-2 py-2 rounded-xl'>
                            <CreditCard size={18} color={"#16a43a"} />
                        </View>
                        <Text className='text-xl font-medium text-gray-600'>Payment Methods</Text>
                    </Pressable>
                    {/* Help Center */}
                    <Pressable 
                        className='px-8 flex-row justify-normal items-center bg-[#FFFFFF] w-11/12 self-center h-20 rounded-xl gap-5' 
                        style={styles.boxShadow}
                    >
                        <View className='bg-amber-50 px-2 py-2 rounded-xl'>
                            <CircleQuestionMark size={18} color={"#d97706"} />
                        </View>
                        <Text className='text-xl font-medium text-gray-600'>Help Center</Text>
                    </Pressable>
                    {/* Log Out */}
                    <Pressable 
                        className='px-8 flex-row justify-normal items-center bg-[#FFFFFF] w-11/12 self-center h-20 rounded-xl gap-5' 
                        style={styles.boxShadow}
                        onPress={() => router.push("/screens/WelcomeScreen")}
                    >
                        <View className='bg-rose-50 px-2 py-2 rounded-xl'>
                            <LogOut size={18} color={"#e11d48"} />
                        </View>
                        <Text className='text-xl font-medium text-rose-600'>Log Out</Text>
                    </Pressable>
                </View>
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
        elevation: 4
    }
})
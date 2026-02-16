import { router } from 'expo-router'
import { ArrowLeft, CheckCircle, CircleQuestionMark, CreditCard, LogOut, Calendar } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native'
import { Avatar } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Shadows, Spacing } from '@/app/_constants/theme'

export default function ProfileView() {
  const insets = useSafeAreaInsets()

    return (
        <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className='flex-row items-center gap-4 px-5 py-5' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
                    <Pressable className='rounded-full p-2 active:opacity-70' style={{backgroundColor: Colors.lightGray}} onPress={() => router.push("/screens/client/_tabs/ClientHomeScreen")}>
                        <ArrowLeft color={Colors.primary} size={24} />
                    </Pressable>
                    <Text className='text-xl font-extrabold' style={{color: Colors.textPrimary}}>Profile Overview</Text>
                </View>
                <View style={[styles.profileCard, Shadows.medium]} className='px-5 py-6 rounded-3xl w-11/12 self-center my-6'>
                    <View className='flex-row justify-around items-center'>
                        <Avatar.Text
                            size={80}
                            label='MZ'
                            color={Colors.primary}
                            style={{backgroundColor: Colors.lightGray, borderRadius: 100}}
                            labelStyle={{fontWeight: 'bold'}}
                        />
                        <View className='flex-1 ml-4'>
                            <Text className='text-lg font-bold' style={{color: Colors.textPrimary}}>Mirza Zain</Text>
                            <Text className='text-sm font-medium mt-1' style={{color: Colors.textSecondary}} numberOfLines={1}>mirzazain269@gmail.com</Text>
                            <View className='flex-row items-center mt-3'>
                                <CheckCircle size={16} color={Colors.success} />
                                <Text className='text-sm font-bold ml-1' style={{color: Colors.success}}>Verified ID</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View className='gap-4 px-5 pb-6'>
                    {/* About Me */}
                    <Pressable 
                        className='px-6 flex-row items-center rounded-2xl gap-4 active:opacity-80' 
                        style={[styles.menuItem, Shadows.medium]}
                        onPress={() => router.push('/screens/client/Component/ClientAboutMeScreen')}
                    >
                        <View className='p-3 rounded-xl' style={{backgroundColor: '#dbeafe'}}>
                            <CheckCircle size={22} color={Colors.primary} />
                        </View>
                        <Text className='text-base font-semibold flex-1' style={{color: Colors.textPrimary}}>About Me</Text>
                    </Pressable>
                    {/* Booking History */}
                    <Pressable 
                        className='px-6 flex-row items-center rounded-2xl gap-4 active:opacity-80' 
                        style={[styles.menuItem, Shadows.medium]}
                        onPress={() => router.push('/screens/client/Component/BookingHistoryScreen')}
                    >
                        <View className='p-3 rounded-xl' style={{backgroundColor: '#fef3c7'}}>
                            <Calendar size={22} color={Colors.warning} />
                        </View>
                        <Text className='text-base font-semibold flex-1' style={{color: Colors.textPrimary}}>My Bookings</Text>
                    </Pressable>
                    {/* Payment Method */}
                    <Pressable 
                        className='px-6 flex-row items-center rounded-2xl gap-4 active:opacity-80' 
                        style={[styles.menuItem, Shadows.medium]}
                    >
                        <View className='p-3 rounded-xl' style={{backgroundColor: '#dcfce7'}}>
                            <CreditCard size={22} color={Colors.success} />
                        </View>
                        <Text className='text-base font-semibold flex-1' style={{color: Colors.textPrimary}}>Payment Methods</Text>
                    </Pressable>
                    {/* Help Center */}
                    <Pressable 
                        className='px-6 flex-row items-center rounded-2xl gap-4 active:opacity-80' 
                        style={[styles.menuItem, Shadows.medium]}
                    >
                        <View className='p-3 rounded-xl' style={{backgroundColor: '#fef3c7'}}>
                            <CircleQuestionMark size={22} color={Colors.warning} />
                        </View>
                        <Text className='text-base font-semibold flex-1' style={{color: Colors.textPrimary}}>Help Center</Text>
                    </Pressable>
                    {/* Log Out */}
                    <Pressable 
                        className='px-6 flex-row items-center rounded-2xl gap-4 active:opacity-80' 
                        style={[styles.menuItem, Shadows.medium]}
                        onPress={() => router.push("/screens/WelcomeScreen")}
                    >
                        <View className='p-3 rounded-xl' style={{backgroundColor: '#ffe4e6'}}>
                            <LogOut size={22} color={Colors.error} />
                        </View>
                        <Text className='text-base font-semibold flex-1' style={{color: Colors.error}}>Log Out</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
  )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: Colors.background
    },
    profileCard: {
        backgroundColor: Colors.white,
    },
    menuItem: {
        backgroundColor: Colors.white,
        paddingVertical: Spacing.xl,
        minHeight: 80,
    }
})
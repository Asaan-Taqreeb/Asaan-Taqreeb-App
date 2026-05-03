import { router } from 'expo-router'
import { ArrowLeft, CheckCircle, CircleQuestionMark, CreditCard, LogOut, Calendar } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Shadows, Spacing } from '@/app/_constants/theme'
import { useUser } from '@/app/_context/UserContext'
import Avatar from '@/app/_components/Avatar'
import { logoutUser, deleteUserAccount } from '@/app/_utils/authApi'
import { Alert } from 'react-native'

export default function ProfileView() {
  const insets = useSafeAreaInsets()
  const { user, setUser } = useUser()

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (error) {
      // Logout error handled quietly
    } finally {
      setUser(null)
      router.replace('/screens/WelcomeScreen')
    }
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserAccount()
              setUser(null)
              router.replace('/screens/WelcomeScreen')
            } catch (err) {
              Alert.alert('Error', 'Failed to delete account')
            }
          }
        }
      ]
    )
  }

    return (
        <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className='flex-row items-center gap-4 px-5 py-5' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
                    <Pressable className='rounded-full p-2 active:opacity-70' style={{backgroundColor: Colors.lightGray}} onPress={() => router.push("/screens/client/_tabs/ClientHomeScreen")}>
                        <ArrowLeft color={Colors.primary} size={24} />
                    </Pressable>
                    <Text className='text-lg font-bold' style={{color: Colors.textPrimary}}>Profile Overview</Text>
                </View>

                <View style={[styles.profileCard, Shadows.small]} className='px-6 py-8 rounded-3xl w-11/12 self-center my-6'>
                    <View className='flex-row items-center'>
                        <Avatar
                            name={user?.name || 'U'}
                            size='lg'
                            color={Colors.primary}
                        />
                        <View className='flex-1 ml-4'>
                            <Text className='text-xl font-bold' style={{color: Colors.textPrimary}}>{user?.name || 'User'}</Text>
                            <Text className='text-sm font-medium mt-1' style={{color: Colors.textSecondary}} numberOfLines={1}>{user?.email || 'user@email.com'}</Text>
                            <TouchableOpacity 
                                className="mt-3 bg-gray-50 border border-gray-100 rounded-lg py-1.5 px-3 self-start"
                                onPress={() => router.push('/screens/client/Component/ClientAboutMeScreen')}
                            >
                                <Text className="text-[10px] font-bold text-gray-500 uppercase">Edit Profile</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View className='gap-3 px-5 pb-8'>
                    <Text className='text-xs font-bold mb-1 px-1' style={{color: Colors.textTertiary}}>ACCOUNT SETTINGS</Text>
                    
                    <Pressable 
                        className='px-5 flex-row items-center rounded-2xl gap-4 active:opacity-80 py-4' 
                        style={styles.menuItem}
                        onPress={() => router.push('/screens/client/Component/ClientAboutMeScreen')}
                    >
                        <View className='p-2.5 rounded-xl' style={{backgroundColor: Colors.infoLight}}>
                            <CheckCircle size={20} color={Colors.info} />
                        </View>
                        <Text className='text-base font-semibold flex-1' style={{color: Colors.textPrimary}}>About Me</Text>
                    </Pressable>

                    <Pressable 
                        className='px-5 flex-row items-center rounded-2xl gap-4 active:opacity-80 py-4' 
                        style={styles.menuItem}
                        onPress={() => router.push('/screens/client/Component/BookingHistoryScreen')}
                    >
                        <View className='p-2.5 rounded-xl' style={{backgroundColor: Colors.warningLight}}>
                            <Calendar size={20} color={Colors.warning} />
                        </View>
                        <Text className='text-base font-semibold flex-1' style={{color: Colors.textPrimary}}>My Bookings</Text>
                    </Pressable>

                    <Pressable 
                        className='px-5 flex-row items-center rounded-2xl gap-4 active:opacity-80 py-4' 
                        style={styles.menuItem}
                    >
                        <View className='p-2.5 rounded-xl' style={{backgroundColor: Colors.successLight}}>
                            <CreditCard size={20} color={Colors.success} />
                        </View>
                        <Text className='text-base font-semibold flex-1' style={{color: Colors.textPrimary}}>Payment Methods</Text>
                    </Pressable>

                    <Text className='text-xs font-bold mt-4 mb-1 px-1' style={{color: Colors.textTertiary}}>SUPPORT & LEGAL</Text>

                    <Pressable 
                        className='px-5 flex-row items-center rounded-2xl gap-4 active:opacity-80 py-4' 
                        style={styles.menuItem}
                        onPress={() => Alert.alert('Help Center', 'Our support team is available 24/7 at support@asaantaqreeb.com or call +92 300 1234567')}
                    >
                        <View className='p-2.5 rounded-xl' style={{backgroundColor: Colors.lightGray}}>
                            <CircleQuestionMark size={20} color={Colors.textSecondary} />
                        </View>
                        <Text className='text-base font-semibold flex-1' style={{color: Colors.textPrimary}}>Help Center</Text>
                    </Pressable>

                    <Pressable 
                        className='px-5 flex-row items-center rounded-2xl gap-4 active:opacity-80 py-4 mt-6' 
                        style={[styles.menuItem, {backgroundColor: '#FEF2F2', borderColor: '#FEE2E2'}]}
                        onPress={handleLogout}
                    >
                        <View className='p-2.5 rounded-xl' style={{backgroundColor: Colors.white}}>
                            <LogOut size={20} color={Colors.error} />
                        </View>
                        <Text className='text-base font-bold flex-1' style={{color: Colors.error}}>Log Out</Text>
                    </Pressable>

                    <TouchableOpacity 
                        className='mt-8 mb-10 items-center justify-center'
                        onPress={handleDeleteAccount}
                    >
                        <Text className='text-xs font-bold uppercase tracking-widest' style={{color: Colors.textTertiary, opacity: 0.6}}>Delete Account Permanently</Text>
                    </TouchableOpacity>
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
        borderWidth: 1,
        borderColor: Colors.border,
    },
    menuItem: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
    }
})
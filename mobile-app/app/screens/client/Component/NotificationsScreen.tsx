import { router } from 'expo-router'
import { ArrowLeft, Bell, CheckCircle } from 'lucide-react-native'
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '@/app/_constants/theme'
import { useNotifications } from '@/app/_context/NotificationContext'
import { markNotificationAsRead, clearAllNotifications } from '@/app/_utils/notificationService'

export default function NotificationsScreen() {
    const insets = useSafeAreaInsets()
    const { notifications, isLoading, refresh } = useNotifications()

    const handleMarkAsRead = async (id: string) => {
        await markNotificationAsRead(id)
        refresh()
    }

    const handleClearAll = async () => {
        await clearAllNotifications()
        refresh()
    }

    return (
        <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
            <View className='flex-row items-center justify-between px-5 py-4' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
                <View className='flex-row items-center gap-4'>
                    <Pressable
                        className='rounded-full p-2 active:opacity-70'
                        style={{backgroundColor: Colors.lightGray}}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft color={Colors.primary} size={24} />
                    </Pressable>
                    <Text className='text-xl font-extrabold' style={{color: Colors.textPrimary}}>Notifications</Text>
                </View>
                {notifications.length > 0 && (
                    <View className="flex-row gap-4">
                        <Pressable onPress={() => {
                            notifications.forEach(n => markNotificationAsRead(n.id))
                            refresh()
                        }}>
                            <Text className='text-sm font-bold' style={{color: Colors.primary}}>Mark All Read</Text>
                        </Pressable>
                        <Pressable onPress={handleClearAll}>
                            <Text className='text-sm font-bold' style={{color: Colors.error}}>Clear All</Text>
                        </Pressable>
                    </View>
                )}
            </View>

            <ScrollView 
                className='flex-1 px-5'
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refresh} colors={[Colors.primary]} />
                }
            >
                {notifications.length === 0 ? (
                    <View className='flex-1 justify-center items-center py-20'>
                        <Bell size={48} color={Colors.textTertiary} opacity={0.5} />
                        <Text className='text-lg font-bold mt-4' style={{color: Colors.textSecondary}}>No Notifications</Text>
                        <Text className='text-sm text-center mt-2' style={{color: Colors.textTertiary}}>You&apos;re all caught up!</Text>
                    </View>
                ) : (
                    <View className='py-4'>
                        {notifications.map((notification) => (
                            <Pressable 
                                key={notification.id}
                                className={`p-4 rounded-xl mb-3 flex-row gap-3 ${!notification.isRead ? 'bg-primary/5' : 'bg-white'}`}
                                style={{borderWidth: 1, borderColor: Colors.border}}
                                onPress={() => handleMarkAsRead(notification.id)}
                            >
                                <View className='mt-1'>
                                    {notification.type === 'message' ? (
                                        <Bell size={20} color={Colors.primary} />
                                    ) : (
                                        <CheckCircle size={20} color={Colors.success} />
                                    )}
                                </View>
                                <View className='flex-1'>
                                    <Text className='text-sm font-bold mb-1' style={{color: Colors.textPrimary}}>
                                        {notification.title}
                                    </Text>
                                    <Text className='text-sm leading-5' style={{color: Colors.textSecondary}}>
                                        {notification.message}
                                    </Text>
                                    <Text className='text-xs mt-2' style={{color: Colors.textTertiary}}>
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </Text>
                                </View>
                                {!notification.isRead && (
                                    <View className='w-2 h-2 rounded-full mt-2' style={{backgroundColor: Colors.primary}} />
                                )}
                            </Pressable>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background
    }
})

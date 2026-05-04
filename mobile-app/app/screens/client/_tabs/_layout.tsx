import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '@/app/_constants/theme'
import { useNotifications } from '@/app/_context/NotificationContext'

export default function TabLayout() {
  const insets = useSafeAreaInsets()
  const { unreadCount } = useNotifications()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarStyle: {
          height: 64 + (insets.bottom > 0 ? insets.bottom : 8),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          borderTopWidth: 0,
          backgroundColor: Colors.white,
          shadowColor: Colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        }
      }}
    >
      <Tabs.Screen
        name="ClientHomeScreen"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
              <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="BookingScreen"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="MessagesScreen"
        options={{
          title: 'Messages',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
              <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={size} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  )
}

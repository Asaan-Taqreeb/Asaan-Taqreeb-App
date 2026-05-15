import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Alert, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '@/app/_constants/theme'
import { useUnreadNotificationCount } from '@/app/_context/NotificationContext'
import { useUser } from '@/app/_context/UserContext'

export default function TabLayout() {
  const insets = useSafeAreaInsets()
  const unreadCount = useUnreadNotificationCount()
  const { user } = useUser()
  const isGuest = Boolean(user?.isGuest)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
          letterSpacing: 0.5,
          marginTop: 3,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarStyle: {
          height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#E4E4E7',
          backgroundColor: '#FFFFFF',
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
        }
      }}
    >
      <Tabs.Screen
        name="ClientHomeScreen"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View>
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
            <View style={{ transform: [{ scale: focused ? 1.1 : 1 }], opacity: isGuest ? 0.6 : 1 }}>
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={size} color={isGuest ? Colors.textTertiary : color} />
            </View>
          ),
        }}
        listeners={{
          tabPress: (event) => {
            if (!isGuest) return
            event.preventDefault()
            Alert.alert('Guest Mode', 'Sign in to access bookings.')
          },
        }}
      />
      <Tabs.Screen
        name="PlannerScreen"
        options={{
          title: 'Planner',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ transform: [{ scale: focused ? 1.1 : 1 }], opacity: isGuest ? 0.6 : 1 }}>
              <Ionicons name={focused ? "list" : "list-outline"} size={size} color={isGuest ? Colors.textTertiary : color} />
            </View>
          ),
        }}
        listeners={{
          tabPress: (event) => {
            if (!isGuest) return
            event.preventDefault()
            Alert.alert('Guest Mode', 'Sign in to access the planner.')
          },
        }}
      />
      <Tabs.Screen
        name="FavoritesScreen"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ transform: [{ scale: focused ? 1.1 : 1 }], opacity: isGuest ? 0.6 : 1 }}>
              <Ionicons name={focused ? "heart" : "heart-outline"} size={size} color={isGuest ? Colors.textTertiary : color} />
            </View>
          ),
        }}
        listeners={{
          tabPress: (event) => {
            if (!isGuest) return
            event.preventDefault()
            Alert.alert('Guest Mode', 'Sign in to access favorites.')
          },
        }}
      />
      <Tabs.Screen
        name="MessagesScreen"
        options={{
          title: 'Messages',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ transform: [{ scale: focused ? 1.1 : 1 }], opacity: isGuest ? 0.6 : 1 }}>
              <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={size} color={isGuest ? Colors.textTertiary : color} />
            </View>
          ),
        }}
        listeners={{
          tabPress: (event) => {
            if (!isGuest) return
            event.preventDefault()
            Alert.alert('Guest Mode', 'Sign in to access messages.')
          },
        }}
      />
    </Tabs>
  )
}

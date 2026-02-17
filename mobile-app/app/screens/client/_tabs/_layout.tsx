import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function TabLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#64748B',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
          borderRadius: 16,
          marginHorizontal: 8,
          opacity: 40
        },
        tabBarStyle: {
          height: 70 + (insets.bottom > 0 ? insets.bottom : 8),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTopWidth: 0,
          backgroundColor: '#F8FAFC',
          shadowColor: '#000',
          shadowOffset: { width: 2, height: -2 },
          shadowOpacity: 0.1,
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
            <View style={{ transform: [{ scale: focused ? 1.2 : 1 }] }}>
              <Ionicons name="home" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="BookingScreen"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ transform: [{ scale: focused ? 1.2 : 1 }] }}>
              <Ionicons name="calendar" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="MessagesScreen"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size, focused }) => (
          <View style={{ transform: [{ scale: focused ? 1.2 : 1 }] }}>
            <Ionicons name="chatbubbles" size={size} color={color} />
          </View>
            ),
          }}
      />
    </Tabs>
  )
}

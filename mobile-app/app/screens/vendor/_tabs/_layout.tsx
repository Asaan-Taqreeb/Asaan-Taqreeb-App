import { Tabs } from 'expo-router';
import { Home, ShoppingBasket, MessageCircle, User } from 'lucide-react-native';
import { Colors } from '@/app/_constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

export default function VendorTabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.vendor,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          height: 64 + (insets.bottom > 0 ? insets.bottom : 8),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          shadowColor: Colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="VendorDashboardHome"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
              <Home color={color} size={size} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="OrdersScreen"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
              <ShoppingBasket color={color} size={size} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="VendorMessagesScreen"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
              <MessageCircle color={color} size={size} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="VendorProfileScreen"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
              <User color={color} size={size} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

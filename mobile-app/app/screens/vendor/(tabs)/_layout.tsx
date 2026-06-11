import { Tabs } from 'expo-router'
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '@/app/_constants/theme'
import { useUnreadNotificationCount } from '@/app/_context/NotificationContext'
import { Home, ShoppingBasket, MessageCircle, User } from 'lucide-react-native'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'

function VendorTabBarComponent({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const unreadCount = useUnreadNotificationCount()

  const CAPSULE_HEIGHT = 72
  const bottomOffset = insets.bottom > 0 ? insets.bottom + 8 : 16

  const getIcon = (routeName: string, focused: boolean) => {
    const color = focused ? '#D4AF37' : '#94A3B8'
    switch (routeName) {
      case 'VendorDashboardHome':
        return <Home color={color} size={22} strokeWidth={2.2} />
      case 'OrdersScreen':
        return <ShoppingBasket color={color} size={22} strokeWidth={2.2} />
      case 'VendorMessagesScreen':
        return <MessageCircle color={color} size={22} strokeWidth={2.2} />
      case 'VendorProfileScreen':
        return <User color={color} size={22} strokeWidth={2.2} />
      default:
        return <Home color={color} size={22} strokeWidth={2.2} />
    }
  }

  const handlePress = (routeName: string, routeKey: string, focused: boolean) => {
    if (focused) return
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    })
    if (!event.defaultPrevented) {
      navigation.navigate(routeName as never)
    }
  }

  return (
    <View
      style={[styles.capsule, { bottom: bottomOffset, height: CAPSULE_HEIGHT }]}
      pointerEvents="box-none"
    >
      {state.routes.map((route) => {
        const index = state.routes.indexOf(route)
        const focused = state.index === index
        const showBadge = route.name === 'VendorMessagesScreen' && unreadCount > 0

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => handlePress(route.name, route.key, focused)}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: focused ? 'rgba(212, 175, 55, 0.18)' : 'transparent' },
              ]}
            >
              {getIcon(route.name, focused)}
              {focused && (
                <View style={[styles.indicator, { backgroundColor: '#D4AF37' }]} />
              )}
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  capsule: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 36,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    bottom: 5,
    width: 16,
    height: 3,
    borderRadius: 1.5,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
})

export default function VendorTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <VendorTabBarComponent {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="VendorDashboardHome" options={{ title: 'Home' }} />
      <Tabs.Screen name="OrdersScreen" options={{ title: 'Orders' }} />
      <Tabs.Screen name="VendorMessagesScreen" options={{ title: 'Messages' }} />
      <Tabs.Screen name="VendorProfileScreen" options={{ title: 'Profile' }} />
    </Tabs>
  )
}

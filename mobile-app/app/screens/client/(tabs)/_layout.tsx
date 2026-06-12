import { Tabs } from 'expo-router'
import { Alert, View, TouchableOpacity, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '@/app/_constants/theme'
import { useUnreadNotificationCount } from '@/app/_context/NotificationContext'
import { useUser } from '@/app/_context/UserContext'
import { Home, NotebookPen, Calendar, MessageSquare, Heart } from 'lucide-react-native'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'

function ClientTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const unreadCount = useUnreadNotificationCount()
  const { user } = useUser()
  const isGuest = Boolean(user?.isGuest)

  const CAPSULE_HEIGHT = 72
  const bottomOffset = insets.bottom > 0 ? insets.bottom + 8 : 16

  // FavoritesScreen is accessed via the header heart button — exclude it from the tab bar
  const HIDDEN_ROUTES = ['FavoritesScreen']
  const visibleRoutes = state.routes.filter((route) => !HIDDEN_ROUTES.includes(route.name))

  const getIcon = (routeName: string, focused: boolean) => {
    switch (routeName) {
      case 'ClientHomeScreen':
        return <Home color={focused ? Colors.accent : '#94A3B8'} size={22} strokeWidth={2.2} />
      case 'BookingScreen':
        return <Calendar color={focused && !isGuest ? Colors.accent : isGuest ? '#CBD5E1' : '#94A3B8'} size={22} strokeWidth={2.2} />
      case 'PlannerScreen':
        return <NotebookPen color={focused && !isGuest ? Colors.accent : isGuest ? '#CBD5E1' : '#94A3B8'} size={22} strokeWidth={2.2} />
      case 'MessagesScreen':
        return <MessageSquare color={focused && !isGuest ? Colors.accent : isGuest ? '#CBD5E1' : '#94A3B8'} size={22} strokeWidth={2.2} />
      default:
        return <Home color={focused ? Colors.accent : '#94A3B8'} size={22} strokeWidth={2.2} />
    }
  }

  const handlePress = (routeName: string, routeKey: string, focused: boolean) => {
    if (focused) return

    if (routeName === 'BookingScreen' && isGuest) {
      Alert.alert('Guest Mode', 'Sign in to access bookings.')
      return
    }
    if (routeName === 'PlannerScreen' && isGuest) {
      Alert.alert('Guest Mode', 'Sign in to access the planner.')
      return
    }
    if (routeName === 'MessagesScreen' && isGuest) {
      Alert.alert('Guest Mode', 'Sign in to access messages.')
      return
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    })
    if (!event.defaultPrevented) {
      navigation.navigate(routeName as never)
    }
  }

  const isGuestRestricted = (routeName: string) =>
    isGuest && routeName !== 'ClientHomeScreen'

  const showIndicator = (routeName: string, focused: boolean) =>
    focused && !isGuestRestricted(routeName)

  const showHighlight = (routeName: string, focused: boolean) =>
    focused && !isGuestRestricted(routeName)

  return (
    <View
      style={[styles.capsule, { bottom: bottomOffset, height: CAPSULE_HEIGHT }]}
      pointerEvents="box-none"
    >
      {visibleRoutes.map((route) => {
        const globalIndex = state.routes.findIndex((r) => r.key === route.key)
        const focused = state.index === globalIndex
        const showBadge = route.name === 'MessagesScreen' && unreadCount > 0

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
                {
                  backgroundColor: showHighlight(route.name, focused)
                    ? 'rgba(212, 175, 55, 0.18)'
                    : 'transparent',
                  opacity: isGuestRestricted(route.name) ? 0.45 : 1,
                },
              ]}
            >
              {getIcon(route.name, focused)}
              {showIndicator(route.name, focused) && (
                <View style={[styles.indicator, { backgroundColor: Colors.accent }]} />
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
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
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
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
    backgroundColor: Colors.accent,
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

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <ClientTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        }
      }}
    >
      <Tabs.Screen name="ClientHomeScreen" options={{ title: 'Home' }} />
      <Tabs.Screen name="BookingScreen" options={{ title: 'Bookings' }} />
      <Tabs.Screen name="PlannerScreen" options={{ title: 'Planner' }} />
      <Tabs.Screen name="FavoritesScreen" options={{ title: 'Favorites', href: null }} />
      <Tabs.Screen name="MessagesScreen" options={{ title: 'Messages' }} />
    </Tabs>
  )
}

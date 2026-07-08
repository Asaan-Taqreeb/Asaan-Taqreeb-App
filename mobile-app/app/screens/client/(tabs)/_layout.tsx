import React, { useState, useEffect } from 'react'
import { Tabs, useRouter } from 'expo-router'
import { Alert, View, TouchableOpacity, StyleSheet, Text, ActivityIndicator, AppState, AppStateStatus, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '@/app/_constants/theme'
import { useUnreadNotificationCount, useUnreadMessageCount } from '@/app/_context/NotificationContext'
import { useUser } from '@/app/_context/UserContext'
import { Home, NotebookPen, Calendar, MessageCircle, Heart } from 'lucide-react-native'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import * as Location from 'expo-location'
import LocationPermissionScreen from '../Component/LocationPermissionScreen'
import { logoutUser } from '@/app/_utils/authApi'

function ClientTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const unreadCount = useUnreadNotificationCount()
  const unreadMessagesCount = useUnreadMessageCount()
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
        return <MessageCircle color={focused && !isGuest ? Colors.accent : isGuest ? '#CBD5E1' : '#94A3B8'} size={22} strokeWidth={2.2} />
      default:
        return <Home color={focused ? Colors.accent : '#94A3B8'} size={22} strokeWidth={2.2} />
    }
  }

  const handlePress = (routeName: string, routeKey: string, focused: boolean) => {
    if (focused) return

    const guestRestrictedTabs: Record<string, string> = {
      BookingScreen: 'bookings',
      PlannerScreen: 'the planner',
      MessagesScreen: 'messages',
    }

    if (isGuest && guestRestrictedTabs[routeName]) {
      const feature = guestRestrictedTabs[routeName]
      if (Platform.OS === 'web') {
        const shouldSignIn = window.confirm(`Guest Mode: Sign in to access ${feature}. Click OK to sign in.`)
        if (shouldSignIn) {
          navigation.navigate('ClientHomeScreen' as never)
          // Small delay to let navigation settle before pushing login screen
          setTimeout(() => {
            const router = require('expo-router').router
            router.push('/screens/client/Component/LoginScreen')
          }, 100)
        }
      } else {
        Alert.alert('Guest Mode', `Sign in to access ${feature}.`)
      }
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
        const showBadge = route.name === 'MessagesScreen' && unreadMessagesCount > 0

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
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
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
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 12,
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
    bottom: 2,
    width: 28,
    height: 4,
    borderRadius: 2,
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
  const { user, setUser } = useUser()
  const router = useRouter()
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [checkingPermission, setCheckingPermission] = useState(true)

  const checkLocationPermission = async () => {
    if (Platform.OS === 'web') {
      setHasPermission(true)
      setCheckingPermission(false)
      return
    }
    try {
      const { status } = await Location.getForegroundPermissionsAsync()
      setHasPermission(status === 'granted')
    } catch (error) {
      console.log('Error checking location permission:', error)
      setHasPermission(false)
    } finally {
      setCheckingPermission(false)
    }
  }

  useEffect(() => {
    checkLocationPermission()

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkLocationPermission()
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const handlePermissionGranted = () => {
    setHasPermission(true)
  }

  const handlePermissionSkipped = () => {
    setHasPermission(true)
  }

  const handleBack = async () => {
    try {
      if (user && !user.isGuest) {
        await logoutUser()
      }
    } catch (error) {
      console.log('Error logging out during location back:', error)
    } finally {
      setUser(null)
      router.replace('/')
    }
  }

  if (checkingPermission) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  if (!hasPermission) {
    return (
      <LocationPermissionScreen 
        onPermissionGranted={handlePermissionGranted}
        onBack={handleBack}
        onSkip={handlePermissionSkipped}
      />
    )
  }

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

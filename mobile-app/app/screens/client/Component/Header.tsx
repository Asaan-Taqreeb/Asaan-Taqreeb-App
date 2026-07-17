import { Pressable, StyleSheet, Text, View, Alert, Platform } from 'react-native'
import { useState } from 'react'
import useLocation from './hooks/useLocation'
import SearchBar from './SearchBar'
import { router } from 'expo-router'
import { Colors } from '@/app/_constants/theme'
import { useUser } from '@/app/_context/UserContext'
import Avatar from '@/app/_components/Avatar'
import { useLanguage } from '@/app/_context/LanguageContext'
import { Heart, MapPin } from 'lucide-react-native'

import NotificationBell from '@/app/_components/NotificationBell'
import AppLogo from './AppLogo'

const Header = () => {
  const {result, error} = useLocation()
  const [query, setQuery] = useState("")
  const { user } = useUser()
  const { t } = useLanguage()
  
  const location = Array.isArray(result) ? result[0] : result
  const neighborhood = location ? (location.subregion || location.district || '') : '';
  const formattedLocation = location
    ? ([neighborhood, location.city]
        .map(s => String(s || '').trim())
        .filter((value, index, self) => value && self.indexOf(value) === index)
        .join(', ') || location.name || 'Karachi, Pakistan')
    : '';

  const handleSearchSubmit = (text: string) => {
    const normalized = text.trim()
    router.push({
      pathname: "/screens/client/Component/VendorListView",
      params: normalized ? { query: normalized } : undefined
    })
  }

  const handleOpenFavorites = () => {
    if (user?.isGuest) {
      if (Platform.OS === 'web') {
        const shouldSignIn = window.confirm('Guest Mode: Sign in to access favorites. Click OK to sign in.')
        if (shouldSignIn) {
          router.push('/screens/client/Component/LoginScreen')
        }
      } else {
        Alert.alert('Guest Mode', 'Sign in to access favorites.')
      }
      return
    }
    router.push("/screens/client/(tabs)/FavoritesScreen")
  }

  return (
    <View style={styles.container}>
      <View className='flex flex-row justify-between items-center px-4 py-3'>
        <View className='flex-row items-center gap-3 flex-1'>
          <AppLogo size="small" showText={false} />
          <View className='flex-1 justify-center'>
            <Text className='text-[10px] font-bold uppercase tracking-[1px]' style={{color: Colors.textTertiary}}>{t('currentLocation')}</Text>
            {location ? (
              <View className='flex flex-row items-center gap-1 mt-0.5'>
                <MapPin size={13} color={Colors.accent} />          
                <Text className='text-sm font-bold' style={{color: Colors.textPrimary}} numberOfLines={1}>{formattedLocation}</Text>
              </View>
            ) : error ? (
              <View className='flex flex-row items-center gap-1.5 mt-0.5'>
                <MapPin size={13} color={Colors.textTertiary} />          
                <Text className='text-xs font-semibold' style={{color: Colors.textSecondary}}>{t('locationUnavailable')}</Text>
              </View>
            ) : (
              <Text className='text-xs font-semibold mt-0.5' style={{color: Colors.textTertiary}}>{t('detectingLocation')}</Text>
            )}      
          </View>
        </View>
        <View className='flex-row justify-center items-center gap-2 mr-1'>
          <Pressable 
            className="p-2 rounded-xl active:bg-gray-100 border border-slate-100" 
            style={{ backgroundColor: Colors.white }}
            onPress={handleOpenFavorites}
          >
            <Heart size={18} color={Colors.textPrimary} />
          </Pressable>
          <NotificationBell userId={user?.id} userRole='client' />
          <Pressable className='active:opacity-70 ml-1.5' onPress={() => router.push("/screens/client/Component/ProfileView")}>
            <Avatar name={user?.name || 'U'} size='sm' />
          </Pressable>
        </View>
      </View>
      <SearchBar value={query} onChange={setQuery} onSubmit={handleSearchSubmit} placeholder={t('searchPlaceholder')} />
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: Colors.white,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  }
})
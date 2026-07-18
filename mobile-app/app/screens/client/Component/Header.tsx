import { Pressable, StyleSheet, Text, View, Alert, Platform } from 'react-native'
import { useState } from 'react'
import SearchBar from './SearchBar'
import { router } from 'expo-router'
import { Colors } from '@/app/_constants/theme'
import { useUser } from '@/app/_context/UserContext'
import Avatar from '@/app/_components/Avatar'
import { useLanguage } from '@/app/_context/LanguageContext'
import { useLocationContext } from '@/app/_context/LocationContext'
import LocationPicker from '@/app/_components/LocationPicker'
import { Heart, MapPin, ChevronDown } from 'lucide-react-native'

import NotificationBell from '@/app/_components/NotificationBell'
import AppLogo from './AppLogo'

const Header = () => {
  const { result, error, latitude, longitude, setManualLocation } = useLocationContext()
  const [query, setQuery] = useState("")
  const { user } = useUser()
  const { t } = useLanguage()
  
  const location = Array.isArray(result) ? result[0] : result

  const buildFormattedLocation = () => {
    if (!location) return '';

    if (typeof location === 'string') return location;

    const nameStr = String(location.name || '').trim();
    const isGenericName = !nameStr || 
      nameStr.toLowerCase().includes('pinned location') || 
      nameStr.toLowerCase().includes('karachi, pakistan (default)') ||
      nameStr.toLowerCase() === 'karachi';

    const streetStr = String(location.street || location.road || '').trim();
    const subregionStr = String(location.subregion || location.suburb || location.neighbourhood || location.quarter || '').trim();
    const districtStr = String(location.district || location.city_district || '').trim();
    const cityStr = String(location.city || location.town || 'Karachi').trim();

    const parts: string[] = [];

    const addPart = (str: string) => {
      if (!str) return;
      const lower = str.toLowerCase();
      if (lower === 'karachi' || lower === 'pakistan') return;
      if (!parts.some(p => p.toLowerCase().includes(lower) || lower.includes(p.toLowerCase()))) {
        parts.push(str);
      }
    };

    if (!isGenericName) addPart(nameStr);
    addPart(streetStr);
    addPart(subregionStr);
    addPart(districtStr);

    if (parts.length > 0) {
      return parts.join(', ');
    }

    return cityStr ? `${cityStr}, Pakistan` : 'Karachi, Pakistan';
  };

  const formattedLocation = buildFormattedLocation();

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
        <View className='flex-row items-center gap-2.5 flex-1 min-w-0 mr-2'>
          <AppLogo size="small" showText={false} />
          
          <LocationPicker
            containerStyle={{ flex: 1, flexShrink: 1 }}
            initialLocation={{ address: formattedLocation, latitude, longitude }}
            onLocationSelect={(loc) => setManualLocation(loc)}
            customTrigger={(openModal) => (
              <Pressable 
                className='flex-1 flex-shrink justify-center active:opacity-70 pr-1' 
                onPress={openModal}
              >
                <Text className='text-[10px] font-bold uppercase tracking-[1px]' style={{color: Colors.textTertiary}}>{t('currentLocation')}</Text>
                {location ? (
                  <View className='flex flex-row items-center gap-1 mt-0.5 flex-shrink'>
                    <MapPin size={13} color={Colors.accent} style={{ flexShrink: 0 }} />          
                    <Text className='text-sm font-bold flex-shrink' style={{color: Colors.textPrimary}} numberOfLines={1} ellipsizeMode="tail">{formattedLocation}</Text>
                    <ChevronDown size={12} color={Colors.textTertiary} style={{ flexShrink: 0 }} />
                  </View>
                ) : error ? (
                  <View className='flex flex-row items-center gap-1.5 mt-0.5 flex-shrink'>
                    <MapPin size={13} color={Colors.textTertiary} style={{ flexShrink: 0 }} />          
                    <Text className='text-xs font-semibold flex-shrink' style={{color: Colors.textSecondary}} numberOfLines={1}>{t('locationUnavailable')}</Text>
                    <ChevronDown size={12} color={Colors.textTertiary} style={{ flexShrink: 0 }} />
                  </View>
                ) : (
                  <View className='flex flex-row items-center gap-1 mt-0.5 flex-shrink'>
                    <Text className='text-xs font-semibold flex-shrink' style={{color: Colors.textTertiary}} numberOfLines={1}>{t('detectingLocation')}</Text>
                    <ChevronDown size={12} color={Colors.textTertiary} style={{ flexShrink: 0 }} />
                  </View>
                )}      
              </Pressable>
            )}
          />
        </View>

        <View className='flex-row justify-center items-center gap-2 flex-shrink-0'>
          <Pressable 
            className="p-2 rounded-xl active:bg-gray-100 border border-slate-100" 
            style={{ backgroundColor: Colors.white }}
            onPress={handleOpenFavorites}
          >
            <Heart size={18} color={Colors.textPrimary} />
          </Pressable>
          <NotificationBell userId={user?.id} userRole='client' />
          <Pressable className='active:opacity-70 ml-1' onPress={() => router.push("/screens/client/Component/ProfileView")}>
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
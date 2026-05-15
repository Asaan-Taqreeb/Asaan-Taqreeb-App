import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useState } from 'react'
import useLocation from './hooks/useLocation'
import Icon from "@expo/vector-icons/FontAwesome6"
import SearchBar from './SearchBar'
import { router } from 'expo-router'
import { useUser } from '@/app/_context/UserContext'
import Avatar from '@/app/_components/Avatar'
import { useLanguage } from '@/app/_context/LanguageContext'
import NotificationBell from '@/app/_components/NotificationBell'

const S = {
  white:  '#FFFFFF',
  black:  '#0A0A0A',
  gray400:'#A1A1AA',
  blue:   '#2563EB',
  border: '#E4E4E7',
}

const Header = () => {
  const { result, error } = useLocation()
  const [query, setQuery]   = useState('')
  const { user }            = useUser()
  const { t }               = useLanguage()

  const location = Array.isArray(result) ? result[0] : result

  const handleSearchSubmit = (text: string) => {
    const normalized = text.trim()
    router.push({
      pathname: '/screens/client/Component/VendorListView',
      params: normalized ? { query: normalized } : undefined,
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* Brand + Location */}
        <View style={styles.brandBlock}>
          <Text style={styles.brand}>ASAAN TAQREEB</Text>
          <View style={styles.locationRow}>
            <Icon name="location-dot" size={10} color={location ? S.blue : S.gray400} />
            <Text style={styles.locationText} numberOfLines={1}>
              {location
                ? `${location.district}, ${location.city}`
                : error
                  ? t('locationUnavailable')
                  : t('detectingLocation')}
            </Text>
          </View>
        </View>

        {/* Right actions */}
        <View style={styles.actions}>
          <NotificationBell userId={user?.id} userRole="client" />
          <Pressable
            onPress={() => router.push('/screens/client/Component/ProfileView')}
            style={styles.avatarBtn}
          >
            <Avatar name={user?.name || 'U'} size="md" />
          </Pressable>
        </View>
      </View>

      <SearchBar
        value={query}
        onChange={setQuery}
        onSubmit={handleSearchSubmit}
        placeholder={t('searchPlaceholder')}
      />
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: S.white,
    borderBottomWidth: 1,
    borderBottomColor: S.border,
    paddingBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 2,
  },
  brandBlock: {
    gap: 3,
    flex: 1,
  },
  brand: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    color: S.black,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '500',
    color: S.gray400,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarBtn: {
    opacity: 1,
  },
})
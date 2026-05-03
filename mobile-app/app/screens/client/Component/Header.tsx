import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useState } from 'react'
import useLocation from './hooks/useLocation'
import Icon from "@expo/vector-icons/FontAwesome6"
import SearchBar from './SearchBar'
import { router } from 'expo-router'
import { Colors } from '@/app/_constants/theme'
import { useUser } from '@/app/_context/UserContext'
import Avatar from '@/app/_components/Avatar'

import NotificationBell from '@/app/_components/NotificationBell'
import AppLogo from './AppLogo'

const Header = () => {
  const {result, error} = useLocation()
  const [query, setQuery] = useState("")
  const { user } = useUser()
  
  const location = Array.isArray(result) ? result[0] : result

  const handleSearchSubmit = (text: string) => {
    const normalized = text.trim()
    router.push({
      pathname: "/screens/client/Component/VendorListView",
      params: normalized ? { query: normalized } : undefined
    })
  }

  return (
    <View style={styles.container}>
      <View className='flex flex-row justify-between items-center px-4 py-4'>
        <View className='flex-row items-center gap-3 flex-1'>
          <AppLogo size="small" showText={false} />
          <View>
            <Text className='text-[10px] font-bold mx-2 uppercase tracking-[1px]' style={{color: Colors.textSecondary}}>Current Location</Text>
            {location ? (
              <View className='flex flex-row items-center gap-1 mx-2'>
                <Icon name={"location-dot"} size={12} color={Colors.primary} />          
                <Text className='text-sm font-bold' style={{color: Colors.textPrimary}} numberOfLines={1}>{location.district}, {location.city}</Text>
              </View>
            ) : error ? (
              <View className='flex flex-row items-center gap-2 mx-2'>
                <Icon name={"location-dot"} size={12} color={Colors.textSecondary} />          
                <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Location unavailable</Text>
              </View>
            ) : (
              <Text className='text-xs mx-2 font-medium' style={{color: Colors.textTertiary}}>Detecting location...</Text>
            )}      
          </View>
        </View>
        <View className='flex-row justify-center items-center gap-2 mr-1'>
          <NotificationBell userId={user?.id} userRole='client' />
          <Pressable className='active:opacity-70 ml-2' onPress={() => router.push("/screens/client/Component/ProfileView")}>
            <Avatar name={user?.name || 'U'} size='md' />
          </Pressable>
        </View>
      </View>
      <SearchBar value={query} onChange={setQuery} onSubmit={handleSearchSubmit} />
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
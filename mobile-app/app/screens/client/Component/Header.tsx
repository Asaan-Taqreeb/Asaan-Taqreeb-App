import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useState } from 'react'
import useLocation from './hooks/useLocation'
import Icon from "react-native-vector-icons/FontAwesome6"
import SearchBar from './SearchBar'
import { router } from 'expo-router'
import { Colors, Spacing } from '@/app/_constants/theme'
import { useUser } from '@/app/_context/UserContext'
import Avatar from '@/app/_components/Avatar'

const Header = () => {
  const {result, error} = useLocation()
  const [query, setQuery] = useState("")
  const { user } = useUser()
  
  console.log('Header - user data:', user)
  console.log('Header - user.name:', user?.name)
  
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
      <View className='flex flex-row justify-between items-center px-3 py-3'>
        <View className='flex-1'>
          <Text className='text-sm font-semibold mx-2 mb-1' style={{color: Colors.textSecondary}}>Current Location</Text>
          {location ? (
            <View className='flex flex-row items-center gap-2 mx-2'>
              <Icon name={"location-dot"} size={18} color={Colors.primary} />          
              <Text className='text-lg font-bold' style={{color: Colors.primary}} numberOfLines={1}>{location.district}, {location.city}</Text>
            </View>
          ) : error ? (
            <View className='flex flex-row items-center gap-2 mx-2'>
              <Icon name={"location-dot"} size={18} color={Colors.textSecondary} />          
              <Text className='text-sm' style={{color: Colors.textSecondary}}>Location unavailable</Text>
            </View>
          ) : (
            <Text className='text-sm mx-2' style={{color: Colors.textSecondary}}>Loading...</Text>
          )}      
        </View>
        <View className='flex-row justify-center items-center gap-4 mr-1'>
          <Pressable className='p-2 active:opacity-70'>
            <Icon name={"bell"} size={20} color={Colors.textPrimary} />
          </Pressable>
          <Pressable className='active:opacity-70' onPress={() => router.push("/screens/client/Component/ProfileView")}>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  }
})
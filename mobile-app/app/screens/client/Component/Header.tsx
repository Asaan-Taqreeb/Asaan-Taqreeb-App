import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useLocation from './hooks/useLocation'
import Icon from "react-native-vector-icons/FontAwesome6"
import { Avatar } from 'react-native-paper'
import SearchBar from './SearchBar'
import { router } from 'expo-router'
import { Colors, Spacing } from '@/app/_constants/theme'

const Header = () => {
  const insets = useSafeAreaInsets()
  const {result, error} = useLocation()
  const [query, setQuery] = useState("")
  
  const location = Array.isArray(result) ? result[0] : result

  const handleSearchSubmit = (text: string) => {
    const normalized = text.trim()
    router.push({
      pathname: "/screens/client/Component/VendorListView",
      params: normalized ? { query: normalized } : undefined
    })
  }

  return (
    <View style={[styles.container, {paddingTop: insets.top + Spacing.sm, paddingBottom: Spacing.md}]}>
      <View className='flex flex-row justify-between items-center px-3 py-2'>
        <View className='flex-1'>
          <Text className='text-sm font-semibold mx-2 mb-1' style={{color: Colors.textSecondary}}>Current Location</Text>
          {error && <Text className='text-xs mx-2' style={{color: Colors.error}}>Error: {error}</Text>}
          {location ? (
            <View className='flex flex-row items-center gap-2 mx-2'>
              <Icon name={"location-dot"} size={18} color={Colors.primary} />          
              <Text className='text-lg font-bold' style={{color: Colors.primary}} numberOfLines={1}>{location.district}, {location.city}</Text>
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
            <Avatar.Text
              size={40}
              label='MZ'
              color={Colors.primary}
              style={{backgroundColor: Colors.lightGray}}
              labelStyle={{fontWeight: 'bold'}}
            />
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
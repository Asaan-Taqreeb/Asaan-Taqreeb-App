import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useLocation from './hooks/useLocation'
import Icon from "react-native-vector-icons/FontAwesome6"
import { Avatar } from 'react-native-paper'
import SearchBar from './SearchBar'
import { router } from 'expo-router'

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
    <View style={[styles.constainer, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <View className='flex flex-row justify-between items-center p-2'>
      <View>
        <Text className='text-base font-bold mx-3 mb-1 text-[#64748B]'>Current Location</Text>
        {error && <Text>Error Message: {error}</Text>}
        {location ? (
          <>
            <View className='flex flex-row items-center gap-2 mx-3'>
              <Icon name={"location-dot"} size={20} color={"#4F46E5"} />          
              <Text className='text-xl font-semibold text-[#4F46E5]' >{location.district}, {location.city}</Text>
            </View>
          </>
        ) : (
          <Text>Loading</Text>
        )
        }      
      </View>
      <View className='flex-row justify-evenly items-center gap-4 mr-2'>
        <View className=''>
          <Icon name={"bell"} size={20} />
        </View>
        <Pressable onPress={() => router.push("/screens/client/_tabs/ClientHomeScreen")}>
          <Avatar.Text
            size={35}
            label='MZ'
            color='#4F46E5'
            style={{backgroundColor: '#FAFAFA'}}
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
  constainer: {
    width: "100%",
    height: "25%",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: "10%",
    borderBottomRightRadius: "10%"
  }
})
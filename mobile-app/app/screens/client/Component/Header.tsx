import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useLocation from './hooks/useLocation'
import Icon from "react-native-vector-icons/FontAwesome6"
import { Avatar } from 'react-native-paper'
import SearchBar from './SearchBar'

const Header = () => {
  const insets = useSafeAreaInsets()
  const {result, error} = useLocation()
  
  const location = Array.isArray(result) ? result[0] : result

  return (
    <View style={[styles.constainer, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <View className='flex flex-row justify-between items-center p-2'>
      <View>
        <Text className='text-lg font-bold mx-3 text-[#6B7280]'>Current Location</Text>
        {error && <Text>Error Message: {error}</Text>}
        {location ? (
          <>
            <View className='flex flex-row items-center gap-2 mx-3'>
              <Icon name={"location-dot"} size={20} color={"#3B3F91"} />          
              <Text className='text-xl font-semibold text-[#3B3F91]' >{location.district}, {location.city}</Text>
            </View>
          </>
        ) : (
          <Text>Loading</Text>
        )
        }      
      </View>
      <View className='flex-row justify-evenly items-center gap-4 mr-2'>
        <View className='bg-gray-200 px-2 py-2 rounded-full'>
          <Icon name={"bell"} size={20} />
        </View>
        {/* <Text className='bg-gray-200 px-2 py-2 rounded-full text-center text-xl font-semibold text-[#3B3F91]'>MZ</Text> */}
        <Avatar.Text
          size={35}
          label='MZ'
          color='#3B3F91'
          style={{backgroundColor: 'lightgray'}}
          labelStyle={{fontWeight: 'bold'}}
        />
      </View>
      </View>
      <SearchBar />
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
  constainer: {
    width: "100%",
    height: "100%"
  }
})
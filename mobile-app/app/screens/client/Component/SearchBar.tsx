import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Searchbar } from "react-native-paper"

export default function SearchBar() {
    const [searchQuery, setSearchQuery] = useState("")
    return (
    <View className='mt-5'>
        <Searchbar 
            placeholder='Search venues, caters...'
            onChangeText={setSearchQuery}
            value={searchQuery}
            className='text-gray-100 mx-2'
        />
    </View>
  )
}

const styles = StyleSheet.create({
    searchBarTheme: {
        color: "lightgray",
        margin: 3
    }
})
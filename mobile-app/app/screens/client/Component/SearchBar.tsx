import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { Search } from 'lucide-react-native'

type SearchBarProps = {
    value: string
    onChange: (text: string) => void
    onSubmit?: (text: string) => void
}

export default function SearchBar({ value, onChange, onSubmit }: SearchBarProps) {
    const handleSubmit = () => {
        if (onSubmit) {
            onSubmit(value)
        }
    }

    return (
    <View style={styles.boxShadow} className='w-11/12 mt-5 flex-row justify-between items-center bg-[#FAFAFA] rounded-xl self-center p-2'>
        <TextInput 
            placeholder='Search for Banquets, Venues, Parlor...' 
            value={value}
            onChangeText={onChange}
            onSubmitEditing={handleSubmit}
            className='text-[#001011]'
        />
        <Pressable className='mr-2' onPress={handleSubmit}>
            <Search size={20} color={'#001011'} />
        </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
     boxShadow: {
      shadowColor: "#0A0A0A",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 4,
      elevation: 6, // For Android
    }
})

import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { Search } from 'lucide-react-native'
import { Colors, Shadows, Spacing } from '@/app/_constants/theme'

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
        <View style={[styles.container, Shadows.medium]} className='w-11/12 self-center'>
            <TextInput 
                placeholder='Search for Banquets, Venues, Parlor...' 
                value={value}
                onChangeText={onChange}
                onSubmitEditing={handleSubmit}
                placeholderTextColor={Colors.textTertiary}
                className='flex-1 text-base px-4'
                style={{color: Colors.textPrimary}}
            />
            <Pressable className='px-3 active:opacity-70' onPress={handleSubmit}>
                <Search size={22} color={Colors.textSecondary} />
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.lightGray,
        borderRadius: 12,
        paddingVertical: Spacing.sm,
        minHeight: 50,
    }
})

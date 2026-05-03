import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { Search } from 'lucide-react-native'
import { Colors, Spacing } from '@/app/_constants/theme'

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
        <View style={styles.container} className='w-11/12 self-center'>
            <Search size={20} color={Colors.textTertiary} style={{marginLeft: 14}} />
            <TextInput 
                placeholder='Search venues, catering, parlors...' 
                value={value}
                onChangeText={onChange}
                onSubmitEditing={handleSubmit}
                placeholderTextColor={Colors.textTertiary}
                className='flex-1 text-base px-3'
                style={{color: Colors.textPrimary}}
            />
            <Pressable className='px-3 active:opacity-70' onPress={handleSubmit}>
                <View style={styles.searchButton}>
                    <Search size={18} color={Colors.white} />
                </View>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: Spacing.sm,
        marginBottom: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.lightGray,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        minHeight: 48,
    },
    searchButton: {
        backgroundColor: Colors.primary,
        borderRadius: 10,
        padding: 8,
    }
})

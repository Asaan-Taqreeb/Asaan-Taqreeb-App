import { StyleSheet, TextInput, View } from 'react-native'
import { Search } from 'lucide-react-native'

const S = {
  white:  '#FFFFFF',
  gray50: '#F4F4F5',
  gray400:'#A1A1AA',
  black:  '#0A0A0A',
  blue:   '#2563EB',
  border: '#E4E4E7',
}

type SearchBarProps = {
  value: string
  onChange: (text: string) => void
  onSubmit?: (text: string) => void
  placeholder?: string
}

export default function SearchBar({ value, onChange, onSubmit, placeholder }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Search size={16} color={S.gray400} />
      <TextInput
        placeholder={placeholder || 'Search venues, catering, parlors…'}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={() => onSubmit?.(value)}
        placeholderTextColor={S.gray400}
        style={styles.input}
        returnKeyType="search"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: S.gray50,
    borderWidth: 1,
    borderColor: S.border,
    borderRadius: 4,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: S.black,
    padding: 0,
  },
})

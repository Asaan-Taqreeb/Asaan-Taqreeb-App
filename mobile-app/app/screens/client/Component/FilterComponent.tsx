import { SlidersHorizontal, X, Star } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Colors, Shadows, Spacing } from '@/app/_constants/theme'

type FilterValues = {
    location: string
    minPrice: string
    maxPrice: string
    minRating: number
    minGuests: string
    maxGuests: string
}

type FilterComponentProps = {
    values: FilterValues
    onApply: (values: FilterValues) => void
    onReset: () => void
}

export default function FilterComponent({ values, onApply, onReset }: FilterComponentProps) {
  const [isFilterVisible, setFilterVisible] = useState(false)
    const [minPrice, setMinPrice] = useState(values.minPrice)
    const [maxPrice, setMaxPrice] = useState(values.maxPrice)
    const [selectedLocation, setSelectedLocation] = useState(values.location)
    const [minRating, setMinRating] = useState(values.minRating)
    const [minGuests, setMinGuests] = useState(values.minGuests)
    const [maxGuests, setMaxGuests] = useState(values.maxGuests)
  const placesArr = ["Garden", "Nazimabad", "Shahrah e Faisal", "Gulshan", "Clifton", "DHA"]
  const ratingArr = [3, 3.5, 4, 4.5, 5]

  const toggleModal = () => {
    setFilterVisible(!isFilterVisible)
  }

    useEffect(() => {
        setMinPrice(values.minPrice)
        setMaxPrice(values.maxPrice)
        setSelectedLocation(values.location)
        setMinRating(values.minRating)
        setMinGuests(values.minGuests)
        setMaxGuests(values.maxGuests)
    }, [values])

    const handleApply = () => {
        onApply({ 
            location: selectedLocation, 
            minPrice, 
            maxPrice,
            minRating,
            minGuests,
            maxGuests
        })
        toggleModal()
    }

    const handleReset = () => {
        setMinPrice("")
        setMaxPrice("")
        setSelectedLocation("")
        setMinRating(0)
        setMinGuests("")
        setMaxGuests("")
        onReset()
    }

    return (
    <View>
        <Pressable className='p-2 active:opacity-70' onPress={toggleModal}>
            <SlidersHorizontal size={24} color={Colors.textPrimary} />
        </Pressable>

        <Modal
            animationType='slide'
            transparent={true}
            visible={isFilterVisible}
            onRequestClose={() => toggleModal()}
        >
            <KeyboardAvoidingView 
                className='flex-1 justify-end'
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
            >
                {/* Background overlay */}
                <Pressable onPress={toggleModal} style={styles.overlay} />
                
                {/* Modal content */}
                <View className='rounded-t-3xl z-10' style={[styles.modalContent, {height: '80%'}]}>
                    <View className='flex-row justify-between items-center px-6 py-5' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
                        <Text className='text-2xl font-extrabold' style={{color: Colors.textPrimary}}>Filters</Text>
                        <Pressable className='p-2 rounded-full active:opacity-70' style={{backgroundColor: Colors.lightGray}} onPress={toggleModal}>
                            <X size={22} color={Colors.textPrimary} />
                        </Pressable>
                    </View>
                    <ScrollView className='px-6' style={{flex: 1}} showsVerticalScrollIndicator={false}>
                        <View className='mt-6'>
                            <Text className='text-lg font-bold mb-3' style={{color: Colors.textPrimary}}>Location</Text>
                            <View className='flex-row flex-wrap gap-3'>
                                {placesArr.map((item, index) => {
                                    const isSelected = selectedLocation === item
                                    return (
                                        <Pressable
                                            key={index}
                                            className='px-4 py-3 rounded-xl active:opacity-70'
                                            style={{ backgroundColor: isSelected ? Colors.primary : Colors.lightGray }}
                                            onPress={() => setSelectedLocation(isSelected ? "" : item)}
                                        >
                                            <Text className='text-sm font-semibold' style={{ color: isSelected ? Colors.white : Colors.textPrimary }}>{item}</Text>
                                        </Pressable>
                                    )
                                })}
                            </View>
                        </View>

                        <View className='mt-6'>
                            <Text className='text-lg font-bold mb-3' style={{color: Colors.textPrimary}}>Price Range</Text>
                            <View className='flex-row gap-3'>
                                <View className='flex-1'>
                                    <Text className='text-sm font-semibold mb-2' style={{color: Colors.textSecondary}}>Min Price</Text>
                                    <TextInput 
                                        placeholder='E.g. 50000'
                                        onChangeText={setMinPrice}
                                        value={minPrice}
                                        keyboardType='numeric'
                                        placeholderTextColor={Colors.textTertiary}
                                        className='rounded-xl p-4 text-base'
                                        style={{borderWidth: 2, borderColor: Colors.border, color: Colors.textPrimary}} 
                                    />
                                </View>
                                <View className='flex-1'>
                                    <Text className='text-sm font-semibold mb-2' style={{color: Colors.textSecondary}}>Max Price</Text>
                                    <TextInput 
                                        placeholder='E.g. 200000'
                                        onChangeText={setMaxPrice}
                                        value={maxPrice}
                                        keyboardType='numeric'
                                        placeholderTextColor={Colors.textTertiary}
                                        className='rounded-xl p-4 text-base'
                                        style={{borderWidth: 2, borderColor: Colors.border, color: Colors.textPrimary}} 
                                    />
                                </View>
                            </View>
                        </View>

                        <View className='mt-6'>
                            <Text className='text-lg font-bold mb-3' style={{color: Colors.textPrimary}}>Minimum Rating</Text>
                            <View className='flex-row flex-wrap gap-3'>
                                {ratingArr.map((rating, index) => {
                                    const isSelected = minRating === rating
                                    return (
                                        <Pressable
                                            key={index}
                                            className='px-5 py-3 rounded-xl active:opacity-70 flex-row items-center gap-1'
                                            style={{ backgroundColor: isSelected ? Colors.primary : Colors.lightGray }}
                                            onPress={() => setMinRating(isSelected ? 0 : rating)}
                                        >
                                            <Text className='text-sm font-semibold' style={{ color: isSelected ? Colors.white : Colors.textPrimary }}>{rating}</Text>
                                            <Star size={14} color={isSelected ? Colors.white : '#FFD700'} fill={isSelected ? Colors.white : '#FFD700'} />
                                        </Pressable>
                                    )
                                })}
                            </View>
                        </View>

                        <View className='mt-6 mb-6'>
                            <Text className='text-lg font-bold mb-3' style={{color: Colors.textPrimary}}>Guest Capacity</Text>
                            <View className='flex-row gap-3'>
                                <View className='flex-1'>
                                    <Text className='text-sm font-semibold mb-2' style={{color: Colors.textSecondary}}>Min Guests</Text>
                                    <TextInput 
                                        placeholder='E.g. 100'
                                        onChangeText={setMinGuests}
                                        value={minGuests}
                                        keyboardType='numeric'
                                        placeholderTextColor={Colors.textTertiary}
                                        className='rounded-xl p-4 text-base'
                                        style={{borderWidth: 2, borderColor: Colors.border, color: Colors.textPrimary}} 
                                    />
                                </View>
                                <View className='flex-1'>
                                    <Text className='text-sm font-semibold mb-2' style={{color: Colors.textSecondary}}>Max Guests</Text>
                                    <TextInput 
                                        placeholder='E.g. 500'
                                        onChangeText={setMaxGuests}
                                        value={maxGuests}
                                        keyboardType='numeric'
                                        placeholderTextColor={Colors.textTertiary}
                                        className='rounded-xl p-4 text-base'
                                        style={{borderWidth: 2, borderColor: Colors.border, color: Colors.textPrimary}} 
                                    />
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                    <View className='flex-row justify-between items-center px-6 py-4 gap-3' style={{borderTopWidth: 1, borderTopColor: Colors.border}}>
                        <Pressable 
                            className='flex-1 py-4 rounded-xl active:opacity-80' 
                            style={[{backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border}, Shadows.small]} 
                            onPress={handleReset}
                        >
                            <Text className='text-base font-bold text-center' style={{color: Colors.textSecondary}}>Reset</Text>
                        </Pressable>
                        <Pressable 
                            className='flex-1 py-4 rounded-xl active:opacity-80' 
                            style={[{backgroundColor: Colors.primary}, Shadows.medium]} 
                            onPress={handleApply}
                        >
                            <Text className='text-base font-bold text-center' style={{color: Colors.white}}>Apply Filter</Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.overlay,
    },
    modalContent: {
        backgroundColor: Colors.white,
    }
})
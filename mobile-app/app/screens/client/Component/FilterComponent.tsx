import { SlidersHorizontal, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

type FilterValues = {
    location: string
    maxPrice: string
}

type FilterComponentProps = {
    values: FilterValues
    onApply: (values: FilterValues) => void
    onReset: () => void
}

export default function FilterComponent({ values, onApply, onReset }: FilterComponentProps) {
  const [isFilterVisible, setFilterVisible] = useState(false)
    const [price, setPrice] = useState(values.maxPrice)
    const [selectedLocation, setSelectedLocation] = useState(values.location)
  const placesArr = ["Garden", "Nazimabad", "Shahrah e Faisal", "Gulshan", "Clifton", "DHA"]

  const toggleModal = () => {
    setFilterVisible(!isFilterVisible)
  }

    useEffect(() => {
        setPrice(values.maxPrice)
        setSelectedLocation(values.location)
    }, [values.location, values.maxPrice])

    const handleApply = () => {
        onApply({ location: selectedLocation, maxPrice: price })
        toggleModal()
    }

    const handleReset = () => {
        setPrice("")
        setSelectedLocation("")
        onReset()
    }

    return (
    <View>
        <Pressable className='active:opacity-50' onPress={toggleModal}>
            <SlidersHorizontal />
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
                {/* Background overlay with opacity */}
                <Pressable onPress={toggleModal} className='absolute inset-0 bg-[#0A0A0A] opacity-30' />
                
                {/* Modal content at 100% opacity */}
                <View className='bg-[#FFFFFF] h-[55%] rounded-t-[30] z-10 relative'>
                    <View className='flex-row justify-between items-center mx-5 mt-5'>
                        <Text className='text-2xl font-medium'>Filters</Text>
                        <Pressable className='active:opacity-50 bg-gray-100 px-2 py-2 rounded-full' onPress={toggleModal}>
                            <X size={20} />
                        </Pressable>
                    </View>
                    <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
                        <View className='mx-5 mt-5'>
                            <Text className='text-xl font-medium'>Location</Text>
                            <View className='flex-row justify-normal items-center mt-2 flex-wrap gap-3'>
                                {
                                    placesArr.map((item, index) => {
                                        const isSelected = selectedLocation === item
                                        return (
                                            <Pressable
                                                key={index}
                                                className='active:opacity-50 px-4 py-2 rounded-xl'
                                                style={{ backgroundColor: isSelected ? "#4F46E5" : "#FAFAFA" }}
                                                onPress={() => setSelectedLocation(isSelected ? "" : item)}
                                            >
                                                <Text className='text-lg' style={{ color: isSelected ? "#FAFAFA" : "#0A0A0A" }}>{item}</Text>
                                            </Pressable>
                                        )
                                    })
                            }
                            </View>
                        </View>
                        <View className='mx-5 mt-5'>
                            <Text className='text-xl font-medium'>Max Price</Text>
                            <TextInput 
                                placeholder='E.g. 200000'
                                onChangeText={setPrice}
                                value={price}
                                keyboardType='numeric'
                                className='border border-gray-100 mt-3 rounded-xl p-4 text-lg' 
                            />
                        </View>
                    </ScrollView>
                    <View className='flex-row justify-around items-center py-5 border-t border-gray-100'>
                        <Pressable className='active:opacity-50 bg-[#FFFFFF] w-2/5 border border-gray-100 py-5 rounded-xl' style={styles.boxShadow} onPress={handleReset}>
                            <Text className='text-xl font-bold text-center text-gray-500'>Reset</Text>
                        </Pressable>
                        <Pressable className='active:opacity-50 bg-indigo-600 w-2/5 border border-gray-100 py-5 rounded-xl' style={styles.boxShadow} onPress={handleApply}>
                            <Text className='text-xl font-bold text-center text-[#FAFAFA]'>Apply Filter</Text>
                        </Pressable>
                    </View>
                </View>
                </KeyboardAvoidingView>
        </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
    boxShadow: {
        shadowColor: "#0A0A0A",
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 6
    }
})
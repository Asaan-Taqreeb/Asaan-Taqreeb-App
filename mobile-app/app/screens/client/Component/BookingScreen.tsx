import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Circle, Dot, Square, MapPin, Clock } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, TextInput } from 'react-native'
import { Calendar } from "react-native-calendars"
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, getCategoryColor, Shadows, Spacing } from '@/app/_constants/theme'

export default function BookingScreen() {
    const insets = useSafeAreaInsets()
    const params = useLocalSearchParams()
    
    // Parse booking data from params
    let bookingData: any = {
        category: 'banquet',
        packageName: 'Classic Package',
        price: 250000,
        guestCount: 200
    }
    
    if (params.bookingData) {
        try {
            bookingData = JSON.parse(params.bookingData as string)
        } catch (e) {
            console.log('Error parsing booking data')
        }
    }

    const categoryColor = getCategoryColor(bookingData.category)

    const [selectedDate, setSelectedDate] = useState('')
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
    const [customStartTime, setCustomStartTime] = useState('')
    const [customEndTime, setCustomEndTime] = useState('')
    const [location, setLocation] = useState('')
    const [specialRequests, setSpecialRequests] = useState('')
    const [selectedAddons, setSelectedAddons] = useState<{[key: number]: boolean}>({})
    const [expandedAddons, setExpandedAddons] = useState<{[key: number]: boolean}>({})

    // Predefined time slots for banquet
    const banquetSlots = [
        { id: 'morning', label: 'Morning', time: '10 AM to 1 PM' },
        { id: 'afternoon', label: 'Afternoon', time: '3 PM to 7 PM' },
        { id: 'evening', label: 'Evening', time: '9 PM to 12 AM' }
    ]

    // Optional add-ons (mock data - will be dynamic later)
    const addons = [
        {
            id: 1,
            name: bookingData.category === 'banquet' ? 'Premium Decoration Upgrade' : 
                  bookingData.category === 'catering' ? 'Live Cooking Station' :
                  bookingData.category === 'photo' ? 'Drone Photography' : 'Hair Extensions',
            price: bookingData.category === 'banquet' ? 50000 : 
                   bookingData.category === 'catering' ? 30000 :
                   bookingData.category === 'photo' ? 25000 : 5000,
            items: bookingData.category === 'banquet' ? 
                ['Crystal Chandeliers', 'Imported Flowers', 'LED Stage'] :
                bookingData.category === 'catering' ?
                ['Live Pasta Station', 'BBQ Corner', 'Chef on Duty'] :
                bookingData.category === 'photo' ?
                ['Aerial Shots', '4K Video', 'Same Day Highlights'] :
                ['Premium Extensions', 'Custom Styling']
        },
        {
            id: 2,
            name: bookingData.category === 'banquet' ? 'Valet Parking Service' : 
                  bookingData.category === 'catering' ? 'Premium Beverage Package' :
                  bookingData.category === 'photo' ? 'Printed Photo Album' : 'Professional Nail Art',
            price: bookingData.category === 'banquet' ? 25000 : 
                   bookingData.category === 'catering' ? 15000 :
                   bookingData.category === 'photo' ? 20000 : 3000,
            items: bookingData.category === 'banquet' ? 
                ['Valet Staff', 'Parking Management', 'Security'] :
                bookingData.category === 'catering' ?
                ['Fresh Juices', 'Mocktails', 'Premium Soft Drinks'] :
                bookingData.category === 'photo' ?
                ['30 Pages', 'Premium Leather Cover', 'Custom Design'] :
                ['Gel Polish', 'Crystal Decoration']
        }
    ]

    const toggleAddon = (addonId: number) => {
        setSelectedAddons(prev => ({
            ...prev,
            [addonId]: !prev[addonId]
        }))
    }

    const toggleExpandAddon = (addonId: number) => {
        setExpandedAddons(prev => ({
            ...prev,
            [addonId]: !prev[addonId]
        }))
    }

    // Calculate total price
    const addonsTotal = Object.keys(selectedAddons).reduce((sum, key) => {
        if (selectedAddons[parseInt(key)]) {
            const addon = addons.find(a => a.id === parseInt(key))
            return sum + (addon?.price || 0)
        }
        return sum
    }, 0)

    const totalPrice = bookingData.price + addonsTotal
    const advancePayment = Math.round(totalPrice * 0.5) // 50% advance

    // Get today's date for min date
    const today = new Date()
    const minDate = today.toISOString().split('T')[0]
 
  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
        {/* Header */}
        <View className='flex-row items-center gap-4 px-5 py-5' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
            <Pressable className='rounded-full p-2 active:opacity-70' style={{backgroundColor: Colors.lightGray}} onPress={() => router.back()}>
                <ArrowLeft color={categoryColor} size={24} />
            </Pressable>
            <Text className='text-xl font-extrabold' style={{color: Colors.textPrimary}}>Booking Details</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
            {/* Selected Package Info - Locked */}
            <View className='mx-5 my-5 rounded-2xl p-5' style={[{backgroundColor: Colors.white, borderWidth: 2, borderColor: categoryColor}, Shadows.medium]}>
                <Text className='text-xs font-extrabold mb-2' style={{color: Colors.textSecondary}}>SELECTED PACKAGE</Text>
                <Text className='text-xl font-extrabold mb-3' style={{color: Colors.textPrimary}}>{bookingData.packageName}</Text>
                <View className='flex-row justify-between items-center'>
                    <View>
                        <Text className='text-lg font-extrabold' style={{color: categoryColor}}>PKR {bookingData.price.toLocaleString()}</Text>
                        {bookingData.guestCount && (
                            <Text className='text-sm font-medium mt-1' style={{color: Colors.textSecondary}}>For {bookingData.guestCount} guests</Text>
                        )}
                    </View>
                    <View className='px-3 py-2 rounded-full' style={{backgroundColor: '#dcfce7'}}>
                        <Text className='text-xs font-extrabold' style={{color: Colors.success}}>✓ Locked</Text>
                    </View>
                </View>
            </View>

            {/* Time Slot Selection */}
            <View className='px-5 mb-6'>
                <Text className='text-xl font-extrabold mb-4' style={{color: Colors.textPrimary}}>Time Slot</Text>
                
                {/* Banquet - Predefined Slots */}
                {bookingData.category === 'banquet' && (
                    <View className='gap-3'>
                        {banquetSlots.map((slot) => (
                            <Pressable 
                                key={slot.id}
                                className='flex-row items-center gap-3 p-4 rounded-2xl active:opacity-80'
                                style={[{borderWidth: 2, borderColor: selectedSlot === slot.id ? categoryColor : Colors.border, backgroundColor: selectedSlot === slot.id ? `${categoryColor}10` : Colors.white}]}
                                onPress={() => setSelectedSlot(slot.id)}
                            >
                                <Circle 
                                    size={20} 
                                    color={selectedSlot === slot.id ? categoryColor : Colors.borderDark} 
                                    fill={selectedSlot === slot.id ? categoryColor : 'transparent'} 
                                />
                                <View>
                                    <Text className='text-base font-extrabold' style={{color: Colors.textPrimary}}>{slot.label}</Text>
                                    <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>{slot.time}</Text>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                )}

                {/* Others - Custom Time Input */}
                {bookingData.category !== 'banquet' && (
                    <View className='rounded-2xl p-4' style={[{backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border}, Shadows.medium]}>
                        <View className='flex-row items-center gap-2 mb-4'>
                            <Clock size={20} color={categoryColor} />
                            <Text className='text-base font-bold' style={{color: Colors.textPrimary}}>Custom Time</Text>
                        </View>
                        <View className='flex-row gap-3'>
                            <View className='flex-1'>
                                <Text className='text-sm font-bold mb-2' style={{color: Colors.textPrimary}}>From</Text>
                                <TextInput
                                    placeholder='09:00 AM'
                                    value={customStartTime}
                                    onChangeText={setCustomStartTime}
                                    className='rounded-xl px-4 py-3 text-sm'
                                    style={{borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary}}
                                    placeholderTextColor={Colors.textTertiary}
                                />
                            </View>
                            <View className='flex-1'>
                                <Text className='text-sm font-bold mb-2' style={{color: Colors.textPrimary}}>To</Text>
                                <TextInput
                                    placeholder='05:00 PM'
                                    value={customEndTime}
                                    onChangeText={setCustomEndTime}
                                    className='rounded-xl px-4 py-3 text-sm'
                                    style={{borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary}}
                                    placeholderTextColor={Colors.textTertiary}
                                />
                            </View>
                        </View>
                    </View>
                )}
            </View>

            {/* Date Selection */}
            <View className='px-5 mb-6'>
                <Text className='text-xl font-extrabold mb-4' style={{color: Colors.textPrimary}}>Select Date</Text>
                <View className='rounded-2xl overflow-hidden' style={[{backgroundColor: Colors.lightGray}, Shadows.medium]}>
                    <Calendar 
                        onDayPress={day => {
                            setSelectedDate(day.dateString)
                        }}
                        markedDates={{
                            [selectedDate]: {selected: true, marked: true, selectedColor: categoryColor}
                        }}
                        minDate={minDate}
                        theme={{
                            todayTextColor: categoryColor,
                            arrowColor: Colors.textPrimary,
                            selectedDayBackgroundColor: categoryColor,
                            selectedDayTextColor: Colors.white,
                            textMonthFontSize: 18,
                            textMonthFontWeight: '800',
                            monthTextColor: Colors.textPrimary,
                            textDayFontWeight: '500',
                            textDayStyle: {color: Colors.textPrimary}
                        }}
                        style={{
                            margin: 12,
                            borderRadius: 16,
                            ...Shadows.medium
                        }}
                    />
                    <View className='flex-row justify-center items-center gap-4 pb-4'>
                        <View className='flex-row items-center gap-1'>
                            <Square color={Colors.borderDark} fill={Colors.borderDark} size={12} />
                            <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Past Dates</Text>
                        </View>
                        <View className='flex-row items-center gap-1'>
                            <Square color={categoryColor} fill={categoryColor} size={12} />
                            <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Selected</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Location Input - Only for Catering & Photographer */}
            {(bookingData.category === 'catering' || bookingData.category === 'photo') && (
                <View className='px-5 mb-6'>
                    <Text className='text-xl font-extrabold mb-4' style={{color: Colors.textPrimary}}>
                        {bookingData.category === 'catering' ? 'Delivery Location' : 'Event Location'}
                    </Text>
                    <View className='flex-row items-center rounded-2xl px-4 py-4' style={[{backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border}, Shadows.medium]}>
                        <MapPin size={20} color={categoryColor} />
                        <TextInput
                            placeholder={bookingData.category === 'catering' ? 'Enter delivery address' : 'Enter event venue address'}
                            value={location}
                            onChangeText={setLocation}
                            className='flex-1 ml-3 text-sm'
                            style={{color: Colors.textPrimary}}
                            placeholderTextColor={Colors.textTertiary}
                            multiline
                        />
                    </View>
                </View>
            )}

            {/* Special Requests */}
            <View className='px-5 mb-6'>
                <Text className='text-xl font-extrabold mb-2' style={{color: Colors.textPrimary}}>Special Requests</Text>
                <Text className='text-sm font-medium mb-3' style={{color: Colors.textSecondary}}>Let the vendor know about any specific requirements or preferences</Text>
                <View className='rounded-2xl p-4' style={[{backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border}, Shadows.medium]}>
                    <TextInput
                        placeholder='e.g., Dietary restrictions, specific decorations, timing preferences, etc.'
                        value={specialRequests}
                        onChangeText={setSpecialRequests}
                        className='text-sm'
                        style={{color: Colors.textPrimary, minHeight: 100, textAlignVertical: 'top'}}
                        placeholderTextColor={Colors.textTertiary}
                        multiline
                        numberOfLines={4}
                    />
                </View>
            </View>
            
            {/* Optional Add-ons */}
            <View className='px-5 mb-6'>
                <Text className='text-xl font-extrabold mb-4' style={{color: Colors.textPrimary}}>Optional Add-ons</Text>
                <View className='gap-3'>
                    {addons.map((addon) => (
                        <View key={addon.id} className='rounded-2xl overflow-hidden' style={[{backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border}]}>
                            <Pressable 
                                className='p-4 flex-row justify-between items-center active:opacity-80'
                                onPress={() => toggleExpandAddon(addon.id)}
                            >
                                <View className='flex-row items-center gap-3 flex-1'>
                                    <Pressable onPress={() => toggleAddon(addon.id)}>
                                        <Circle 
                                            size={20} 
                                            color={selectedAddons[addon.id] ? categoryColor : Colors.borderDark} 
                                            fill={selectedAddons[addon.id] ? categoryColor : 'transparent'} 
                                        />
                                    </Pressable>
                                    <View className='flex-1'>
                                        <Text className='text-sm font-extrabold' style={{color: Colors.textPrimary}} numberOfLines={2}>{addon.name}</Text>
                                        <Text className='text-sm font-bold mt-1' style={{color: categoryColor}}>
                                            + PKR {addon.price.toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            </Pressable>
                            
                            {expandedAddons[addon.id] && (
                                <View className='px-4 pb-4 pt-3 ml-12' style={{borderTopWidth: 1, borderTopColor: Colors.border}}>
                                    {addon.items.map((item, idx) => (
                                        <View key={idx} className='flex-row items-center mb-1'>
                                            <Dot size={16} color={categoryColor} />
                                            <Text className='text-sm flex-1' style={{color: Colors.textSecondary}}>{item}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </View>

            {/* Booking Summary */}
            <View className='px-5 mb-6'>
                <Text className='text-xl font-extrabold mb-4' style={{color: Colors.textPrimary}}>Booking Summary</Text>
                <View className='rounded-2xl p-5' style={[{backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border}, Shadows.medium]}>
                    {/* Package */}
                    <View className='flex-row justify-between items-start mb-3'>
                        <View className='flex-1'>
                            <Text className='text-xs font-bold' style={{color: Colors.textSecondary}}>Package</Text>
                            <Text className='text-sm font-extrabold mt-1' style={{color: Colors.textPrimary}} numberOfLines={2}>{bookingData.packageName}</Text>
                        </View>
                        <Text className='text-base font-extrabold' style={{color: Colors.textPrimary}}>PKR {bookingData.price.toLocaleString()}</Text>
                    </View>

                    {/* Guest Count */}
                    {bookingData.guestCount && (
                        <View className='flex-row justify-between items-center mb-3'>
                            <Text className='text-xs font-bold' style={{color: Colors.textSecondary}}>Guests</Text>
                            <Text className='text-sm font-bold' style={{color: Colors.textPrimary}}>{bookingData.guestCount}</Text>
                        </View>
                    )}

                    {/* Time Slot */}
                    <View className='flex-row justify-between items-center mb-3'>
                        <Text className='text-xs font-bold' style={{color: Colors.textSecondary}}>Time</Text>
                        <Text className='text-sm font-bold' style={{color: Colors.textPrimary}} numberOfLines={1}>
                            {bookingData.category === 'banquet' 
                                ? (selectedSlot ? banquetSlots.find(s => s.id === selectedSlot)?.time : 'Not selected')
                                : (customStartTime && customEndTime ? `${customStartTime} - ${customEndTime}` : 'Not selected')}
                        </Text>
                    </View>

                    {/* Date */}
                    <View className='flex-row justify-between items-center mb-3'>
                        <Text className='text-xs font-bold' style={{color: Colors.textSecondary}}>Date</Text>
                        <Text className='text-sm font-bold' style={{color: Colors.textPrimary}}>
                            {selectedDate || 'Not selected'}
                        </Text>
                    </View>

                    {/* Location */}
                    {(bookingData.category === 'catering' || bookingData.category === 'photo') && (
                        <View className='flex-row justify-between items-start mb-3'>
                            <Text className='text-xs font-bold' style={{color: Colors.textSecondary}}>Location</Text>
                            <Text className='text-sm font-bold flex-1 text-right' style={{color: Colors.textPrimary}} numberOfLines={2}>
                                {location || 'Not provided'}
                            </Text>
                        </View>
                    )}

                    {/* Special Requests */}
                    {specialRequests && (
                        <View className='flex-row justify-between items-start mb-3'>
                            <Text className='text-xs font-bold' style={{color: Colors.textSecondary}}>Special Requests</Text>
                            <Text className='text-sm font-bold flex-1 text-right' style={{color: Colors.textPrimary}} numberOfLines={3}>
                                {specialRequests}
                            </Text>
                        </View>
                    )}

                    {/* Add-ons */}
                    {Object.keys(selectedAddons).some(key => selectedAddons[parseInt(key)]) && (
                        <View className='mb-3'>
                            <Text className='text-xs font-bold mb-2' style={{color: Colors.textSecondary}}>Add-ons</Text>
                            {Object.keys(selectedAddons).map(key => {
                                if (selectedAddons[parseInt(key)]) {
                                    const addon = addons.find(a => a.id === parseInt(key))
                                    return (
                                        <View key={key} className='flex-row justify-between items-center mb-1 ml-2'>
                                            <Text className='text-sm font-medium flex-1' style={{color: Colors.textSecondary}} numberOfLines={1}>• {addon?.name}</Text>
                                            <Text className='text-sm font-bold' style={{color: Colors.textPrimary}}>PKR {addon?.price.toLocaleString()}</Text>
                                        </View>
                                    )
                                }
                                return null
                            })}
                        </View>
                    )}

                    {/* Divider */}
                    <View className='my-4' style={{borderTopWidth: 2, borderTopColor: Colors.border}} />

                    {/* Total */}
                    <View className='flex-row justify-between items-center mb-4'>
                        <Text className='text-lg font-extrabold' style={{color: Colors.textPrimary}}>Total Amount</Text>
                        <Text className='text-xl font-extrabold' style={{color: categoryColor}}>PKR {totalPrice.toLocaleString()}</Text>
                    </View>

                    {/* Advance Payment */}
                    <View className='rounded-xl p-4' style={{backgroundColor: Colors.lightGray}}>
                        <View className='flex-row justify-between items-center'>
                            <View className='flex-1'>
                                <Text className='text-sm font-bold' style={{color: Colors.textSecondary}}>Advance Payment (50%)</Text>
                                <Text className='text-xs font-medium mt-1' style={{color: Colors.textSecondary}}>Pay now to confirm</Text>
                            </View>
                            <Text className='text-lg font-extrabold' style={{color: Colors.success}}>PKR {advancePayment.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Request Booking Button */}
            <Pressable 
                className='mx-5 mb-8 py-5 rounded-2xl active:opacity-85'
                style={[{backgroundColor: categoryColor}, Shadows.medium]}
                onPress={() => {
                    // Logic will be: Send request to vendor for approval
                    // For now, just show alert or navigate back
                    router.back()
                }}
            >
                <Text className='text-center font-extrabold text-lg' style={{color: Colors.white}}>Request Booking</Text>
            </Pressable>
        </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: Colors.background
    }
})
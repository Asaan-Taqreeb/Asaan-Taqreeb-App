import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Circle, Dot, Square, MapPin, Clock } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { Calendar } from "react-native-calendars"
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, getCategoryColor, Shadows } from '@/app/_constants/theme'
import { createBooking } from '@/app/_utils/bookingsApi'
import { getVendorAvailability, type VendorAvailabilityDay } from '@/app/_utils/availabilityApi'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useUser } from '@/app/_context/UserContext'

type BookingAddon = {
    id: number
    name: string
    price: number
    items: string[]
}

const toMinutes = (value: string) => {
    const raw = String(value || '').trim().toUpperCase()
    
    // Handle AM/PM format (e.g., "10:00 AM", "9 PM")
    const ampmMatch = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/)
    if (ampmMatch) {
        let hour = Number(ampmMatch[1])
        const minute = Number(ampmMatch[2] || '0')
        const period = ampmMatch[3]
        if (hour === 12) hour = 0
        if (period === 'PM') hour += 12
        return hour * 60 + minute
    }

    // Handle 24-hour format (e.g., "14:30", "9:00")
    const h24Match = raw.match(/^(\d{1,2}):(\d{2})$/)
    if (h24Match) {
        const hour = Number(h24Match[1])
        const minute = Number(h24Match[2])
        if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
            return hour * 60 + minute
        }
    }

    return null
}

const parseRange = (value: string) => {
    const [fromRaw, toRaw] = String(value || '').split(/\s*(?:to|-|–|—)\s*/i)
    const from = toMinutes(fromRaw || '')
    const to = toMinutes(toRaw || '')

    if (from === null || to === null) return null

    if (to <= from) {
        return { from, to: to + 24 * 60 }
    }

    return { from, to }
}

const rangesOverlap = (
    a: { from: number; to: number },
    b: { from: number; to: number }
) => Math.max(a.from, b.from) < Math.min(a.to, b.to)

const generateHourlyIntervals = (fromStr: string, toStr: string) => {
    const fromMin = toMinutes(fromStr) ?? (9 * 60);
    const toMin = toMinutes(toStr) ?? (21 * 60);
    
    const intervals = [];
    // Loop every 60 minutes
    for (let time = fromMin; time <= toMin - 60; time += 60) {
        const hour = Math.floor(time / 60) % 24;
        const min = time % 60;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const displayMin = String(min).padStart(2, '0');
        
        const label = `${displayHour}:${displayMin} ${period}`;
        
        // Let's make it a 3-hour duration slot for booking
        const endTimeMin = time + 3 * 60;
        const endHour = Math.floor(endTimeMin / 60) % 24;
        const endMin = endTimeMin % 60;
        const endPeriod = endHour >= 12 ? 'PM' : 'AM';
        const endDisplayHour = endHour % 12 === 0 ? 12 : endHour % 12;
        const endDisplayMin = String(endMin).padStart(2, '0');
        
        const value = `${label} to ${endDisplayHour}:${endDisplayMin} ${endPeriod}`;
        intervals.push({ label, value });
    }
    return intervals;
}

export default function BookingScreen() {
    const insets = useSafeAreaInsets()
    const params = useLocalSearchParams()
    const { user } = useUser()
    
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
        } catch {
            console.log('Error parsing booking data')
        }
    }

    const categoryColor = getCategoryColor(bookingData.category)
    const normalizedCategory = String(bookingData.category || '').trim().toLowerCase()
    const requiresGuestCount = normalizedCategory === 'banquet' || normalizedCategory === 'catering'
    const vendorAvailabilityId = bookingData?.vendorId || bookingData?.serviceId

    const [selectedDate, setSelectedDate] = useState('')
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
    const [customStartHour, setCustomStartHour] = useState('')
    const [customStartMinute, setCustomStartMinute] = useState('')
    const [customStartPeriod, setCustomStartPeriod] = useState<'AM' | 'PM'>('AM')
    const [customEndHour, setCustomEndHour] = useState('')
    const [customEndMinute, setCustomEndMinute] = useState('')
    const [customEndPeriod, setCustomEndPeriod] = useState<'AM' | 'PM'>('PM')
    const [location, setLocation] = useState('')
    const [specialRequests, setSpecialRequests] = useState('')
    const [selectedAddons, setSelectedAddons] = useState<{[key: number]: boolean}>({})
    const [expandedAddons, setExpandedAddons] = useState<{[key: number]: boolean}>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [availabilityDays, setAvailabilityDays] = useState<VendorAvailabilityDay[]>([])
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(false)

    const [slots, setSlots] = useState<{id: string, label: string, time: string}[]>([
        { id: 'morning', label: 'Morning', time: '10 AM to 1 PM' },
        { id: 'afternoon', label: 'Afternoon', time: '3 PM to 7 PM' },
        { id: 'evening', label: 'Evening', time: '9 PM to 12 AM' }
    ])
    const [operatingHours, setOperatingHours] = useState<{ from: string; to: string } | null>(null)

    useEffect(() => {
        const loadTimeOptions = async () => {
            if (!vendorAvailabilityId) return;
            try {
                if (bookingData.category === 'banquet') {
                    const saved = await AsyncStorage.getItem('vendor_slots_' + vendorAvailabilityId);
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        setSlots(parsed.map((s: any) => ({
                            id: s.id,
                            label: s.label,
                            time: `${s.from} to ${s.to}`
                        })));
                    }
                } else {
                    const savedHours = await AsyncStorage.getItem('vendor_operating_hours_' + vendorAvailabilityId);
                    if (savedHours) {
                        setOperatingHours(JSON.parse(savedHours));
                    } else {
                        // Default operating hours if none configured
                        setOperatingHours({ from: '09:00 AM', to: '09:00 PM' });
                    }
                }
            } catch (error) {
                console.log('Failed to load vendor time options:', error);
            }
        };
        loadTimeOptions();
    }, [vendorAvailabilityId, bookingData.category]);

    const addons: BookingAddon[] = useMemo(() => {
        const rawOptional: any[] = Array.isArray(bookingData.optionalServices)
            ? bookingData.optionalServices
            : Array.isArray(bookingData.optionalDishes)
                ? bookingData.optionalDishes
                : []

        return rawOptional
            .map((item: any, index: number) => ({
                id: index + 1,
                name: String(item?.name || item?.title || '').trim(),
                price: Number(item?.price || item?.amount || 0),
                items: Array.isArray(item?.items)
                    ? item.items.map((value: any) => String(value)).filter(Boolean)
                    : [],
            }))
            .filter((item) => item.name.length > 0)
    }, [bookingData.optionalDishes, bookingData.optionalServices])

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

    const packagePrice = Number(bookingData.price) || 0
    const guestMultiplier = requiresGuestCount ? (Number(bookingData.guestCount) || 1) : 1
    const totalPrice = (packagePrice * guestMultiplier) + addonsTotal
    const advancePayment = Math.round(totalPrice * 0.5) // 50% advance

    // Get today's date for min date
    const today = new Date()
    const minDate = today.toISOString().split('T')[0]

    useEffect(() => {
        let mounted = true

        const loadAvailability = async () => {
            if (!vendorAvailabilityId) {
                if (mounted) setAvailabilityDays([])
                return
            }

            try {
                if (mounted) setIsLoadingAvailability(true)
                const now = new Date()
                const from = now.toISOString().slice(0, 10)
                const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
                const to = nextYear.toISOString().slice(0, 10)
                const days = await getVendorAvailability(vendorAvailabilityId, from, to)

                if (mounted) {
                    setAvailabilityDays(days)
                }
            } catch (error) {
                console.log('Failed to load vendor availability:', error)
                if (mounted) {
                    setAvailabilityDays([])
                }
            } finally {
                if (mounted) setIsLoadingAvailability(false)
            }
        }

        loadAvailability()

        return () => {
            mounted = false
        }
    }, [vendorAvailabilityId])

    const unavailableRangesMap = useMemo(() => {
        return availabilityDays.reduce<Record<string, { from: number; to: number; type: 'blocked' | 'booked' }[]>>((acc, day) => {
            if (!day.isBlocked && !day.isBooked) return acc

            let from = 0
            let to = 24 * 60

            if (day.timeSlot) {
                const parsedFrom = toMinutes(day.timeSlot.from)
                const parsedTo = toMinutes(day.timeSlot.to)
                
                // Only use the parsed values if BOTH are valid, otherwise fallback to full day
                if (parsedFrom !== null && parsedTo !== null) {
                    from = parsedFrom
                    to = parsedTo
                    if (to <= from) to += 24 * 60
                }
            }

            if (!acc[day.date]) acc[day.date] = []
            acc[day.date].push({ 
                from, 
                to, 
                type: (day.isBooked ? 'booked' : 'blocked') as 'blocked' | 'booked' 
            })

            return acc
        }, {})
    }, [availabilityDays])

    const selectedTimeRange = useMemo(() => {
        if (bookingData.category === 'banquet') {
            const slot = slots.find((item) => item.id === selectedSlot)
            if (!slot) return null
            return parseRange(slot.time)
        }

        if (!selectedSlot) return null
        return parseRange(selectedSlot)
    }, [bookingData.category, selectedSlot, slots])

    const intervals = useMemo(() => {
        if (bookingData.category === 'banquet') return [];
        const from = operatingHours?.from ?? '09:00 AM';
        const to = operatingHours?.to ?? '09:00 PM';
        return generateHourlyIntervals(from, to);
    }, [operatingHours, bookingData.category]);

    const dayStatusMap = useMemo(() => {
        return availabilityDays.reduce<Record<string, { hasBookings: boolean; hasBlocks: boolean; isFullDayBlocked: boolean }>>((acc, day) => {
            if (!acc[day.date]) {
                acc[day.date] = { hasBookings: false, hasBlocks: false, isFullDayBlocked: false }
            }

            if (day.isBooked) {
                acc[day.date].hasBookings = true
            }

            if (day.isBlocked) {
                acc[day.date].hasBlocks = true
                if (!day.timeSlot?.from || !day.timeSlot?.to) {
                    acc[day.date].isFullDayBlocked = true
                }
            }

            return acc
        }, {})
    }, [availabilityDays])

    const markedDates = useMemo(() => {
        const result: Record<string, any> = {}

        for (const [date, status] of Object.entries(dayStatusMap)) {
            const ranges = unavailableRangesMap[date] || []
            
            // A date is only disabled if:
            // 1. It's blocked for the full day
            // 2. A specific time is selected AND that time overlaps with ANY booked or blocked range
            const isFullDayBlocked = status.isFullDayBlocked || (ranges.length > 0 && ranges.some(r => r.from === 0 && r.to === 1440 && r.type === 'blocked'))
            
            const isBlockedBySelection = Boolean(
                selectedTimeRange && ranges.some((range) => rangesOverlap(selectedTimeRange, range))
            )
            
            const shouldDisable = isFullDayBlocked || isBlockedBySelection

            result[date] = {
                disabled: shouldDisable,
                disableTouchEvent: shouldDisable,
                marked: true,
                dotColor: shouldDisable ? Colors.error : (status.hasBookings ? Colors.primary : Colors.textTertiary),
                customStyles: {
                    container: {
                        backgroundColor: shouldDisable ? '#fee2e2' : (status.hasBookings || status.hasBlocks ? `${Colors.primary}10` : 'transparent'),
                        borderRadius: 12,
                        borderWidth: (status.hasBookings || status.hasBlocks) && !shouldDisable ? 1 : 0,
                        borderColor: `${Colors.primary}30`,
                    },
                    text: {
                        color: shouldDisable ? Colors.error : Colors.textPrimary,
                        fontWeight: shouldDisable ? '700' : '600',
                    },
                },
            }
        }

        if (selectedDate) {
            result[selectedDate] = {
                ...(result[selectedDate] || {}),
                selected: true,
                selectedColor: categoryColor,
                marked: true,
                dotColor: Colors.white,
                disabled: false,
                disableTouchEvent: false,
            }
        }

        return result
    }, [categoryColor, selectedDate, selectedTimeRange, unavailableRangesMap, dayStatusMap])

    useEffect(() => {
        if (selectedDate && selectedSlot) {
            const blocked = bookingData.category === 'banquet'
                ? isBanquetSlotBlocked(selectedSlot)
                : isTimeBlockedOnSelectedDate(selectedSlot);
            if (blocked) {
                setSelectedSlot(null)
            }
        }
    }, [selectedDate, selectedSlot, unavailableRangesMap])

    const getSelectedTime = () => {
        if (bookingData.category === 'banquet') {
            return selectedSlot ? (slots.find(s => s.id === selectedSlot)?.time ?? '') : ''
        }
        return selectedSlot ?? ''
    }

    const isTimeBlockedOnSelectedDate = (timeRange: string) => {
        if (!selectedDate) return false

        const selectedRange = parseRange(timeRange)
        if (!selectedRange) return false

        // Check full day block first
        const status = dayStatusMap[selectedDate]
        if (status?.isFullDayBlocked) return true

        const blockedRanges = unavailableRangesMap[selectedDate] || []
        return blockedRanges.some((range) => rangesOverlap(selectedRange, range))
    }

    const isBanquetSlotBlocked = (slotId: string) => {
        const slot = slots.find((item) => item.id === slotId)
        if (!slot) return false
        return isTimeBlockedOnSelectedDate(slot.time)
    }

    const validateBooking = () => {
        if (!selectedDate) {
            Alert.alert('Missing Date', 'Please select an event date.')
            return false
        }

        if (!getSelectedTime()) {
            Alert.alert('Missing Time', 'Please select or enter event time.')
            return false
        }

        if (isTimeBlockedOnSelectedDate(getSelectedTime())) {
            Alert.alert('Time Not Available', 'This time slot is blocked by vendor on selected date.')
            return false
        }

        if ((bookingData.category === 'catering' || bookingData.category === 'photo') && !location.trim()) {
            Alert.alert('Missing Location', 'Please provide the event location.')
            return false
        }

        return true
    }

    const handleRequestBooking = async () => {
        if (user?.isGuest) {
            Alert.alert('Guest Mode', 'Sign in to request a booking.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign In', onPress: () => router.push('/screens/client/Component/LoginScreen') },
            ])
            return
        }

        if (!validateBooking() || isSubmitting) {
            return
        }

        const selectedAddonsList = addons
            .filter((addon) => selectedAddons[addon.id])
            .map((addon) => ({ name: addon.name, price: addon.price }))

        try {
            setIsSubmitting(true)

            await createBooking({
                serviceId: bookingData.serviceId,
                vendorId: bookingData.vendorId,
                packageName: bookingData.packageName,
                category: bookingData.category,
                eventDate: selectedDate,
                eventTime: getSelectedTime(),
                ...(bookingData.guestCount != null ? { guestCount: bookingData.guestCount } : {}),
                location: location.trim() || bookingData.vendorLocation,
                specialRequests: specialRequests.trim(),
                addons: selectedAddonsList,
                totalAmount: totalPrice,
                advancePayment,
            })

            Alert.alert('Success', 'Booking request sent to vendor successfully.', [
                {
                    text: 'OK',
                    onPress: () => router.replace('/screens/client/BookingScreen'),
                },
            ])
        } catch (error: any) {
            Alert.alert('Booking Failed', error?.message || 'Unable to submit booking. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }
 
  return (
    <KeyboardAvoidingView
        style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
    >
        {/* Header */}
        <View className='flex-row items-center gap-4 px-5 py-5' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
            <Pressable className='rounded-full p-2 active:opacity-70' style={{backgroundColor: Colors.lightGray}} onPress={() => router.back()}>
                <ArrowLeft color={categoryColor} size={24} />
            </Pressable>
            <Text className='text-xl font-extrabold' style={{color: Colors.textPrimary}}>Booking Details</Text>
        </View>

        {user?.isGuest ? (
            <View className='flex-1 px-5 justify-center items-center'>
                <View className='w-full rounded-3xl p-6' style={[{backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border}, Shadows.medium]}>
                    <Text className='text-2xl font-extrabold text-center mb-2' style={{color: Colors.textPrimary}}>Booking locked in guest mode</Text>
                    <Text className='text-sm font-medium text-center mb-6' style={{color: Colors.textSecondary}}>
                        You can browse vendors, but sign in to submit booking requests.
                    </Text>
                    <Pressable
                        className='py-4 rounded-2xl active:opacity-85 mb-3'
                        style={{backgroundColor: categoryColor}}
                        onPress={() => router.push('/screens/client/Component/LoginScreen')}
                    >
                        <Text className='text-center font-extrabold text-base' style={{color: Colors.white}}>Sign In</Text>
                    </Pressable>
                    <Pressable
                        className='py-4 rounded-2xl active:opacity-80'
                        style={{borderWidth: 1, borderColor: Colors.border}}
                        onPress={() => router.back()}
                    >
                        <Text className='text-center font-bold text-base' style={{color: Colors.textPrimary}}>Continue Browsing</Text>
                    </Pressable>
                </View>
            </View>
        ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
            {/* Selected Package Info - Locked */}
            <View className='mx-5 my-5 rounded-2xl p-5' style={[{backgroundColor: Colors.white, borderWidth: 2, borderColor: categoryColor}, Shadows.medium]}>
                <Text className='text-xs font-extrabold mb-2' style={{color: Colors.textSecondary}}>SELECTED PACKAGE</Text>
                <Text className='text-xl font-extrabold mb-3' style={{color: Colors.textPrimary}}>{bookingData.packageName}</Text>
                <View className='flex-row justify-between items-center'>
                    <View>
                        <Text className='text-lg font-extrabold' style={{color: categoryColor}}>PKR {packagePrice.toLocaleString()}</Text>
                        {requiresGuestCount && bookingData.guestCount && (
                            <Text className='text-sm font-medium mt-1' style={{color: Colors.textSecondary}}>For {bookingData.guestCount} guests</Text>
                        )}
                    </View>
                    <View className='px-3 py-2 rounded-full' style={{backgroundColor: '#dcfce7'}}>
                        <Text className='text-xs font-extrabold' style={{color: Colors.success}}>✓ Locked</Text>
                    </View>
                </View>
            </View>

            {/* Date Selection */}
            <View className='px-5 mb-6'>
                <Text className='text-xl font-extrabold mb-4' style={{color: Colors.textPrimary}}>Select Date</Text>
                {isLoadingAvailability && (
                    <Text className='text-xs font-semibold mb-2' style={{color: Colors.textSecondary}}>Loading vendor availability...</Text>
                )}
                <View className='rounded-2xl overflow-hidden' style={[{backgroundColor: Colors.lightGray}, Shadows.medium]}>
                    <Calendar 
                        onDayPress={day => {
                            const state = dayStatusMap[day.dateString]

                            if (state?.isFullDayBlocked) {
                                Alert.alert('Date Not Available', 'Vendor has blocked this date.')
                                return
                            }

                            setSelectedDate(day.dateString)
                        }}
                        markingType={'custom'}
                        markedDates={markedDates}
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
                            <Square color={Colors.error} fill={Colors.error} size={12} />
                            <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Locked</Text>
                        </View>
                        <View className='flex-row items-center gap-1'>
                            <Square color={Colors.vendor} fill={Colors.vendor} size={12} />
                            <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Booked</Text>
                        </View>
                        <View className='flex-row items-center gap-1'>
                            <Square color={categoryColor} fill={categoryColor} size={12} />
                            <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Selected</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Time Slot Selection */}
            <View className='px-5 mb-6'>
                <Text className='text-xl font-extrabold mb-4' style={{color: Colors.textPrimary}}>Time Slot</Text>
                
                {/* Banquet - Predefined Slots */}
                {bookingData.category === 'banquet' && (
                    <View className='gap-3'>
                        {slots.map((slot) => (
                            (() => {
                                const blocked = isBanquetSlotBlocked(slot.id)
                                const selected = selectedSlot === slot.id

                                return (
                            <Pressable 
                                key={slot.id}
                                className='flex-row items-center gap-3 p-4 rounded-2xl active:opacity-80'
                                style={[{
                                    borderWidth: 2,
                                    borderColor: selected ? categoryColor : blocked ? Colors.error : Colors.border,
                                    backgroundColor: selected ? `${categoryColor}10` : blocked ? '#fee2e2' : Colors.white,
                                    opacity: blocked ? 0.75 : 1,
                                }]}
                                onPress={() => {
                                    if (blocked) return
                                    setSelectedSlot(slot.id)
                                }}
                                disabled={blocked}
                            >
                                <Circle 
                                    size={20} 
                                    color={selected ? categoryColor : blocked ? Colors.error : Colors.borderDark}
                                    fill={selected ? categoryColor : 'transparent'} 
                                />
                                <View>
                                    <Text className='text-base font-extrabold' style={{color: Colors.textPrimary}}>{slot.label}</Text>
                                    <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>{slot.time}</Text>
                                    {blocked && selectedDate && (
                                        <Text className='text-xs font-bold mt-1' style={{color: Colors.error}}>Blocked on {selectedDate}</Text>
                                    )}
                                </View>
                            </Pressable>
                                )
                            })()
                        ))}
                    </View>
                )}

                {/* Others - Hourly Slots Selection */}
                {bookingData.category !== 'banquet' && (
                    <View className='rounded-2xl p-4' style={[{backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border}, Shadows.medium]}>
                        <View className='flex-row items-center gap-2 mb-4'>
                            <Clock size={20} color={categoryColor} />
                            <Text className='text-base font-bold' style={{color: Colors.textPrimary}}>Select Start Time</Text>
                        </View>
                        {intervals.length === 0 ? (
                            <Text className='text-sm text-center font-medium my-4' style={{color: Colors.textSecondary}}>
                                No slots available within operating hours.
                            </Text>
                        ) : (
                            <View style={styles.timeGrid}>
                                {intervals.map((interval) => {
                                    const isSelected = selectedSlot === interval.value
                                    const blocked = isTimeBlockedOnSelectedDate(interval.value)

                                    return (
                                        <Pressable
                                            key={interval.value}
                                            style={[
                                                styles.gridItem,
                                                {
                                                    borderColor: isSelected ? categoryColor : blocked ? Colors.error : Colors.border,
                                                    backgroundColor: isSelected ? `${categoryColor}15` : blocked ? '#fee2e2' : Colors.white,
                                                    opacity: blocked ? 0.6 : 1,
                                                }
                                            ]}
                                            onPress={() => {
                                                if (blocked) return
                                                setSelectedSlot(interval.value)
                                            }}
                                            disabled={blocked}
                                        >
                                            <Text 
                                                style={[
                                                    styles.gridItemText,
                                                    {
                                                        color: isSelected ? categoryColor : blocked ? Colors.error : Colors.textPrimary,
                                                        fontWeight: isSelected ? '800' : '600',
                                                    }
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {interval.label}
                                            </Text>
                                        </Pressable>
                                    )
                                })}
                            </View>
                        )}
                        <Text className='text-xs font-semibold mt-3 text-center' style={{color: Colors.textTertiary}}>
                            All bookings have a standard 3-hour session duration.
                        </Text>
                    </View>
                )}
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
                        <Text className='text-base font-extrabold' style={{color: Colors.textPrimary}}>PKR {packagePrice.toLocaleString()}</Text>
                    </View>

                    {/* Guest Count */}
                    {requiresGuestCount && bookingData.guestCount && (
                        <View className='flex-row justify-between items-center mb-3'>
                            <Text className='text-xs font-bold' style={{color: Colors.textSecondary}}>Guests</Text>
                            <Text className='text-sm font-bold' style={{color: Colors.textPrimary}}>{bookingData.guestCount}</Text>
                        </View>
                    )}

                    {/* Time Slot */}
                    <View className='flex-row justify-between items-center mb-3'>
                        <Text className='text-xs font-bold' style={{color: Colors.textSecondary}}>Time</Text>
                        <Text className='text-sm font-bold' style={{color: Colors.textPrimary}} numberOfLines={1}>
                            {getSelectedTime() || 'Not selected'}
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

                    {/* Token Payment */}
                    <View className='rounded-xl p-4' style={{backgroundColor: Colors.lightGray}}>
                        <Text className='text-sm font-bold' style={{color: Colors.textSecondary}}>Token Payment via Chat</Text>
                        <Text className='text-xs font-medium mt-1 leading-relaxed' style={{color: Colors.textSecondary}}>
                            After the vendor approves your booking, they will ask for a 5% to 10% token payment in chat. Send the payment screenshot there for confirmation.
                        </Text>
                    </View>
                </View>
            </View>

            {/* Request Booking Button */}
            <Pressable 
                className='mx-5 mb-8 py-5 rounded-2xl active:opacity-85'
                style={[{backgroundColor: categoryColor}, Shadows.medium]}
                onPress={handleRequestBooking}
            >
                <Text className='text-center font-extrabold text-lg' style={{color: Colors.white}}>
                    {isSubmitting ? 'Sending Request...' : 'Request Booking'}
                </Text>
            </Pressable>
        </ScrollView>
        )}
        </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: Colors.background
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'flex-start',
    },
    gridItem: {
        width: '31%',
        borderWidth: 2,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridItemText: {
        fontSize: 13,
    }
})
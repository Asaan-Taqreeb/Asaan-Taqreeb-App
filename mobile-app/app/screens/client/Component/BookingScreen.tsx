import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Circle, Dot, Square, MapPin, Clock, Users, CheckCircle2, AlertCircle, Sparkles, SlidersHorizontal, ChevronDown } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, TextInput, KeyboardAvoidingView, Platform , ActivityIndicator} from 'react-native'
import { Calendar } from "react-native-calendars"
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, getCategoryColor, Shadows } from '@/app/_constants/theme'
import { createBooking } from '@/app/_utils/bookingsApi'
import { getVendorAvailability, type VendorAvailabilityDay } from '@/app/_utils/availabilityApi'
import { parseRange, rangesOverlap, toLocalIsoDate, toMinutes, generateHourlyIntervals, generateParlorSlots, generatePhotographyPresets, formatMinutesTo12Hour, type QuickSlotOption } from '@/app/_utils/calendarDateUtils'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useUser } from '@/app/_context/UserContext'
import { showAlert } from '@/app/_utils/alert'
import TimePickerModal from '@/app/_components/TimePickerModal'

type BookingAddon = {
    id: number
    name: string
    price: number
    items: string[]
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
            const rawData = params.bookingData.toString();
            bookingData = JSON.parse(
                rawData.startsWith('{')
                    ? rawData
                    : decodeURIComponent(rawData)
            );
        } catch (err) {
            console.log('Error parsing booking data', err)
        }
    }

    const categoryColor = getCategoryColor(bookingData.category)
    const normalizedCategory = String(bookingData.category || '').trim().toLowerCase()
    const isBanquet = normalizedCategory.includes('banquet') || normalizedCategory.includes('hall') || normalizedCategory === 'venue'
    const isCatering = normalizedCategory.includes('cater')
    const isPhoto = normalizedCategory.includes('photo') || normalizedCategory.includes('photography')
    const isParlor = normalizedCategory.includes('parlor') || normalizedCategory.includes('salon') || normalizedCategory.includes('parlour')
    const requiresGuestCount = isBanquet || isCatering
    const vendorAvailabilityId = bookingData?.vendorId || bookingData?.serviceId

    // Slot capacity (simultaneous clients/teams allowed per slot)
    const slotCapacity = useMemo(() => {
        const cap = Number(bookingData.slotCapacity || bookingData.capacity?.maxGuests)
        if (Number.isFinite(cap) && cap > 0) return cap
        if (isParlor) return 3
        return 1
    }, [bookingData.slotCapacity, bookingData.capacity, isParlor])

    const [selectedDate, setSelectedDate] = useState('')
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
    const [isCustomTimeMode, setIsCustomTimeMode] = useState(false)

    // Custom time states
    const [customStartHour, setCustomStartHour] = useState('09')
    const [customStartMinute, setCustomStartMinute] = useState('00')
    const [customStartPeriod, setCustomStartPeriod] = useState<'AM' | 'PM'>('AM')
    const [customEndHour, setCustomEndHour] = useState('11')
    const [customEndMinute, setCustomEndMinute] = useState('00')
    const [customEndPeriod, setCustomEndPeriod] = useState<'AM' | 'PM'>('AM')

    const [isStartPickerVisible, setIsStartPickerVisible] = useState(false)
    const [isEndPickerVisible, setIsEndPickerVisible] = useState(false)
    const [location, setLocation] = useState('')
    const [specialRequests, setSpecialRequests] = useState('')
    const [selectedAddons, setSelectedAddons] = useState<{[key: number]: boolean}>({})
    const [expandedAddons, setExpandedAddons] = useState<{[key: number]: boolean}>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isHomeService, setIsHomeService] = useState(false)
    const [availabilityDays, setAvailabilityDays] = useState<VendorAvailabilityDay[]>([])
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(false)

    const [banquetSlots, setBanquetSlots] = useState<{id: string, label: string, time: string}[]>([
        { id: 'morning', label: 'Morning Session', time: '10:00 AM to 01:00 PM' },
        { id: 'afternoon', label: 'Afternoon Session', time: '03:00 PM to 07:00 PM' },
        { id: 'evening', label: 'Evening Session', time: '09:00 PM to 12:00 AM' }
    ])
    const [operatingHours, setOperatingHours] = useState<{ from: string; to: string } | null>(null)

    const serializedOperatingHours = JSON.stringify(bookingData.operatingHours || null)

    useEffect(() => {
        const loadTimeOptions = async () => {
            if (!vendorAvailabilityId) return;
            try {
                if (isBanquet) {
                    const saved = await AsyncStorage.getItem('vendor_slots_' + vendorAvailabilityId);
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        setBanquetSlots(parsed.map((s: any) => ({
                            id: s.id,
                            label: s.label,
                            time: `${s.from} to ${s.to}`
                        })));
                    }
                } else {
                    if (bookingData.operatingHours) {
                        setOperatingHours(bookingData.operatingHours);
                    } else {
                        const savedHours = await AsyncStorage.getItem('vendor_operating_hours_' + vendorAvailabilityId);
                        if (savedHours) {
                            setOperatingHours(JSON.parse(savedHours));
                        } else {
                            setOperatingHours({ from: '09:00 AM', to: '09:00 PM' });
                        }
                    }
                }
            } catch (error) {
                console.log('Failed to load vendor time options:', error);
            }
        };
        loadTimeOptions();
    }, [vendorAvailabilityId, bookingData.category, serializedOperatingHours]);

    // Generate Quick Slots
    const parlorSlots = useMemo(() => {
        if (!isParlor) return []
        return generateParlorSlots(operatingHours)
    }, [isParlor, operatingHours])

    const photoSlots = useMemo(() => {
        if (!isPhoto) return []
        return generatePhotographyPresets(operatingHours)
    }, [isPhoto, operatingHours])

    const cateringIntervals = useMemo(() => {
        if (!isCatering) return []
        const from = operatingHours?.from ?? '09:00 AM';
        const to = operatingHours?.to ?? '09:00 PM';
        return generateHourlyIntervals(from, to);
    }, [isCatering, operatingHours]);

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

    // Pricing calculation
    const addonsTotal = Object.keys(selectedAddons).reduce((sum, key) => {
        if (selectedAddons[parseInt(key)]) {
            const addon = addons.find(a => a.id === parseInt(key))
            return sum + (addon?.price || 0)
        }
        return sum
    }, 0)

    const packagePrice = Number(bookingData.price) || 0
    const guestMultiplier = requiresGuestCount ? Number(bookingData.guestCount) : 1
    const travelFeeTotal = (isParlor && isHomeService) ? (Number(bookingData.onSiteFee) || 0) : 0
    const totalPrice = (packagePrice * guestMultiplier) + addonsTotal + travelFeeTotal
    const advancePayment = Math.round(totalPrice * 0.5)

    const minDate = toLocalIsoDate(new Date())

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
                const from = toLocalIsoDate(now)
                const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
                const to = toLocalIsoDate(nextYear)
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

    function toTwentyFourHour(value: string, period: 'AM' | 'PM') {
        const [hourRaw, minuteRaw] = String(value || '').split(':')
        const hour = Number(hourRaw)
        const minute = Number(minuteRaw)

        if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
        if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null

        let normalizedHour = hour % 12
        if (period === 'PM') normalizedHour += 12
        return `${String(normalizedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    }

    function getCustomTimeString() {
        if (!customStartHour || !customEndHour) return ''
        const startMin = (customStartMinute || '00').padStart(2, '0')
        const endMin = (customEndMinute || '00').padStart(2, '0')
        return `${customStartHour.padStart(2, '0')}:${startMin} ${customStartPeriod} to ${customEndHour.padStart(2, '0')}:${endMin} ${customEndPeriod}`
    }

    function getSelectedTime(): string {
        if (isCustomTimeMode) {
            return getCustomTimeString()
        }
        return selectedSlot || ''
    }

    // Capacity & Overlap checker for any time range on the selected date
    const getSlotAvailability = (timeRangeStr: string) => {
        if (!selectedDate) {
            return {
                isBlocked: false,
                isFull: false,
                spotsRemaining: slotCapacity,
                bookedCount: 0,
                statusText: `${slotCapacity} spot${slotCapacity > 1 ? 's' : ''} available`,
            }
        }

        const status = dayStatusMap[selectedDate]
        if (status?.isFullDayBlocked) {
            return {
                isBlocked: true,
                isFull: true,
                spotsRemaining: 0,
                bookedCount: slotCapacity,
                statusText: 'Day Blocked',
            }
        }

        const range = parseRange(timeRangeStr)
        if (!range) {
            return {
                isBlocked: false,
                isFull: false,
                spotsRemaining: slotCapacity,
                bookedCount: 0,
                statusText: 'Available',
            }
        }

        const dayEvents = unavailableRangesMap[selectedDate] || []

        // Check if vendor manually blocked this slot
        const manualBlock = dayEvents.find(e => e.type === 'blocked' && rangesOverlap(range, e))
        if (manualBlock) {
            return {
                isBlocked: true,
                isFull: true,
                spotsRemaining: 0,
                bookedCount: slotCapacity,
                statusText: 'Blocked by Vendor',
            }
        }

        // Count overlapping active bookings
        const overlappingBookings = dayEvents.filter(e => e.type === 'booked' && rangesOverlap(range, e))
        const bookedCount = overlappingBookings.length
        const spotsRemaining = Math.max(0, slotCapacity - bookedCount)
        const isFull = spotsRemaining === 0

        let statusText = ''
        if (isFull) {
            statusText = 'Fully Booked'
        } else if (slotCapacity > 1) {
            statusText = spotsRemaining === 1 ? '1 spot left!' : `${spotsRemaining} spots available`
        } else {
            statusText = 'Available'
        }

        return {
            isBlocked: false,
            isFull,
            spotsRemaining,
            bookedCount,
            statusText,
        }
    }

    const markedDates = useMemo(() => {
        const result: Record<string, any> = {};
        for (const [date, status] of Object.entries(dayStatusMap)) {
            const isFullDayBlocked = status.isFullDayBlocked;
            const isPast = date < minDate;
            const shouldDisable = isFullDayBlocked || isPast;

            result[date] = {
                disabled: shouldDisable,
                disableTouchEvent: shouldDisable,
                marked: true,
                dotColor: shouldDisable ? Colors.error : (status.hasBookings ? Colors.primary : Colors.textTertiary),
                customStyles: {
                    container: {
                        backgroundColor: shouldDisable ? '#d1d5db' : (status.hasBookings || status.hasBlocks ? `${Colors.primary}10` : 'transparent'),
                        borderRadius: 12,
                        borderWidth: (status.hasBookings || status.hasBlocks) && !shouldDisable ? 1 : 0,
                        borderColor: `${Colors.primary}30`,
                    },
                    text: {
                        color: shouldDisable ? Colors.textTertiary : Colors.textPrimary,
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
    }, [categoryColor, selectedDate, dayStatusMap, minDate])

    // Current selection availability status
    const currentSelectedAvailability = useMemo(() => {
        const timeStr = getSelectedTime()
        if (!timeStr || !selectedDate) return null
        return getSlotAvailability(timeStr)
    }, [selectedDate, selectedSlot, isCustomTimeMode, customStartHour, customStartMinute, customStartPeriod, customEndHour, customEndMinute, customEndPeriod, unavailableRangesMap])

    const validateBooking = () => {
        if (!selectedDate) {
            showAlert('Missing Date', 'Please select an event date.')
            return false
        }

        const timeStr = getSelectedTime()
        if (!timeStr) {
            showAlert('Missing Time', 'Please select a time slot or specify custom hours.')
            return false
        }

        if (isCustomTimeMode) {
            const from24 = toTwentyFourHour(`${customStartHour}:${customStartMinute || '00'}`, customStartPeriod)
            const to24 = toTwentyFourHour(`${customEndHour}:${customEndMinute || '00'}`, customEndPeriod)

            if (!from24 || !to24) {
                showAlert('Invalid Time', 'Please select valid start and end times.')
                return false
            }

            if (from24 >= to24) {
                showAlert('Invalid Range', 'End time must be later than start time.')
                return false
            }

            // Check if within operating hours
            if (operatingHours) {
                const opRange = parseRange(`${operatingHours.from} to ${operatingHours.to}`)
                const selRange = parseRange(timeStr)
                if (opRange && selRange) {
                    if (selRange.from < opRange.from || selRange.to > opRange.to) {
                        showAlert(
                            'Outside Operating Hours',
                            `Please select a time within operating hours (${operatingHours.from} to ${operatingHours.to}).`
                        )
                        return false
                    }
                }
            }
        }

        const avail = getSlotAvailability(timeStr)
        if (avail.isBlocked) {
            showAlert('Time Not Available', 'This time slot is blocked by the vendor on the selected date.')
            return false
        }
        if (avail.isFull) {
            showAlert('Slot Fully Booked', `This time slot has reached its maximum capacity (${slotCapacity} booking${slotCapacity > 1 ? 's' : ''}). Please choose another time.`)
            return false
        }

        if (requiresGuestCount && (!bookingData.guestCount || Number(bookingData.guestCount) <= 0)) {
            showAlert('Missing Guests', 'Please provide the number of guests for this booking.')
            return false
        }

        const locationRequired = 
            isCatering || 
            isPhoto || 
            (isParlor && isHomeService);

        if (locationRequired && !location.trim()) {
            showAlert('Missing Location', 'Please provide the address details properly.')
            return false
        }

        return true
    }

    const handleRequestBooking = async () => {
        if (user?.isGuest) {
            showAlert('Guest Mode', 'Sign in to request a booking.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign In', onPress: () => router.push('/screens/client/Component/LoginScreen') },
            ]);
            return;
        }

        if (!validateBooking() || isSubmitting) {
            return
        }

        const selectedAddonsList = addons
            .filter((addon) => selectedAddons[addon.id])
            .map((addon) => ({ name: addon.name, price: addon.price }))

        try {
            setIsSubmitting(true)

            const travelNotes = (isParlor && isHomeService) 
                ? `[On-Site/Home Service Requested - Travel Fee: PKR ${travelFeeTotal.toLocaleString()}]\n` 
                : '';
            const finalSpecialRequests = travelNotes + specialRequests.trim();

            await createBooking({
                serviceId: bookingData.serviceId,
                vendorId: bookingData.vendorId,
                packageName: bookingData.packageName,
                category: bookingData.category,
                eventDate: selectedDate,
                eventTime: getSelectedTime(),
                ...(bookingData.guestCount != null ? { guestCount: bookingData.guestCount } : {}),
                location: (isParlor && !isHomeService)
                    ? bookingData.vendorLocation
                    : (location.trim() || bookingData.vendorLocation),
                specialRequests: finalSpecialRequests,
                addons: selectedAddonsList,
                totalAmount: totalPrice,
                advancePayment,
            })

            showAlert('Success', 'Booking request sent to vendor successfully.', [
                {
                    text: 'OK',
                    onPress: () => router.replace('/screens/client/BookingScreen'),
                },
            ]);
        } catch (error: any) {
            showAlert('Booking Failed', error?.message || 'Unable to submit booking. Please try again.');
        } finally {
            setIsSubmitting(false)
        }
    }

  return (
    <KeyboardAvoidingView
        style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
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
        <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 60 }}
        >
            {/* Selected Package Info */}
            <View className='mx-5 my-5 rounded-2xl p-5' style={[{backgroundColor: Colors.white, borderWidth: 2, borderColor: categoryColor}, Shadows.medium]}>
                <Text className='text-xs font-extrabold mb-2' style={{color: Colors.textSecondary}}>SELECTED PACKAGE</Text>
                <Text className='text-xl font-extrabold mb-3' style={{color: Colors.textPrimary}}>{bookingData.packageName}</Text>
                <View className='flex-row justify-between items-center'>
                    <View>
                        <Text className='text-lg font-extrabold' style={{color: categoryColor}}>PKR {packagePrice.toLocaleString()}</Text>
                        {requiresGuestCount && bookingData.guestCount ? (
                            <Text className='text-sm font-medium mt-1' style={{color: Colors.textSecondary}}>For {bookingData.guestCount} guests</Text>
                        ) : null}
                    </View>
                    <View className='px-3 py-2 rounded-full' style={{backgroundColor: '#dcfce7'}}>
                        <Text className='text-xs font-extrabold' style={{color: Colors.success}}>✓ Selected</Text>
                    </View>
                </View>
            </View>

            {/* Date Selection */}
            <View className='px-5 mb-6'>
                <Text className='text-xl font-extrabold mb-4' style={{color: Colors.textPrimary}}>Select Date</Text>
                {isLoadingAvailability && (
                    <View className='flex-row items-center gap-2 mb-2'>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text className='text-xs font-semibold' style={{color: Colors.textSecondary}}>Loading vendor availability...</Text>
                    </View>
                )}
                <View className='rounded-2xl overflow-hidden' style={[{backgroundColor: Colors.lightGray}, Shadows.medium]}>
                    <Calendar 
                        onDayPress={day => {
                            if (day.dateString < minDate) return;
                            const state = dayStatusMap[day.dateString];
                            if (state?.isFullDayBlocked) {
                                showAlert('Date Not Available', 'Vendor has blocked this entire date.');
                                return;
                            }
                            setSelectedDate(day.dateString);
                        }}
                        markingType={'custom'}
                        markedDates={markedDates}
                        minDate={minDate}
                        disableAllTouchEventsForDisabledDays={true}
                        theme={{
                            todayTextColor: categoryColor,
                            arrowColor: Colors.textPrimary,
                            selectedDayBackgroundColor: categoryColor,
                            selectedDayTextColor: Colors.white,
                            textMonthFontSize: 18,
                            textMonthFontWeight: '800',
                            monthTextColor: Colors.textPrimary,
                            textDayFontWeight: '500',
                            textDayStyle: {color: Colors.textPrimary},
                            textDisabledColor: Colors.textTertiary,
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
                            <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Blocked</Text>
                        </View>
                        <View className='flex-row items-center gap-1'>
                            <Square color={Colors.vendor} fill={Colors.vendor} size={12} />
                            <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Has Bookings</Text>
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
                <View className='flex-row justify-between items-center mb-3'>
                    <Text className='text-xl font-extrabold' style={{color: Colors.textPrimary}}>Select Time Slot</Text>
                    {slotCapacity > 1 && (
                        <View className='flex-row items-center gap-1.5 px-3 py-1.5 rounded-full' style={{ backgroundColor: `${categoryColor}15` }}>
                            <Users size={14} color={categoryColor} />
                            <Text className='text-xs font-extrabold' style={{ color: categoryColor }}>
                                {slotCapacity} concurrent spots
                            </Text>
                        </View>
                    )}
                </View>

                {/* 1. Banquet Hall Slots */}
                {isBanquet && (
                    <View className='gap-3'>
                        {banquetSlots.map((slot) => {
                            const avail = getSlotAvailability(slot.time)
                            const isSelected = !isCustomTimeMode && selectedSlot === slot.time

                            return (
                                <Pressable 
                                    key={slot.id}
                                    className='flex-row items-center justify-between p-4 rounded-2xl active:opacity-80'
                                    style={[{
                                        borderWidth: 2,
                                        borderColor: isSelected ? categoryColor : avail.isFull ? Colors.error : Colors.border,
                                        backgroundColor: isSelected ? `${categoryColor}10` : avail.isFull ? '#fee2e2' : Colors.white,
                                        opacity: avail.isFull ? 0.7 : 1,
                                    }]}
                                    onPress={() => {
                                        if (avail.isFull) return
                                        setSelectedSlot(slot.time)
                                        setIsCustomTimeMode(false)
                                    }}
                                    disabled={avail.isFull}
                                >
                                    <View className='flex-row items-center gap-3 flex-1'>
                                        <Circle 
                                            size={20} 
                                            color={isSelected ? categoryColor : avail.isFull ? Colors.error : Colors.borderDark}
                                            fill={isSelected ? categoryColor : 'transparent'} 
                                        />
                                        <View className='flex-1'>
                                            <Text className='text-base font-extrabold' style={{color: Colors.textPrimary}}>{slot.label}</Text>
                                            <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>{slot.time}</Text>
                                        </View>
                                    </View>
                                    <View className='px-2.5 py-1 rounded-lg' style={{ backgroundColor: avail.isFull ? '#fecaca' : isSelected ? `${categoryColor}20` : '#f1f5f9' }}>
                                        <Text className='text-xs font-bold' style={{ color: avail.isFull ? Colors.error : isSelected ? categoryColor : Colors.textSecondary }}>
                                            {avail.statusText}
                                        </Text>
                                    </View>
                                </Pressable>
                            )
                        })}
                    </View>
                )}

                {/* 2. Parlor / Salon Quick 1-Tap Slots */}
                {isParlor && (
                    <View className='gap-3'>
                        {parlorSlots.map((slot) => {
                            const avail = getSlotAvailability(slot.time)
                            const isSelected = !isCustomTimeMode && selectedSlot === slot.time

                            return (
                                <Pressable
                                    key={slot.id}
                                    className='p-4 rounded-2xl active:opacity-85'
                                    style={[{
                                        borderWidth: 2,
                                        borderColor: isSelected ? categoryColor : avail.isFull ? Colors.error : Colors.border,
                                        backgroundColor: isSelected ? `${categoryColor}10` : avail.isFull ? '#fee2e2' : Colors.white,
                                        opacity: avail.isFull ? 0.65 : 1,
                                    }, Shadows.small]}
                                    onPress={() => {
                                        if (avail.isFull) return
                                        setSelectedSlot(slot.time)
                                        setIsCustomTimeMode(false)
                                    }}
                                    disabled={avail.isFull}
                                >
                                    <View className='flex-row justify-between items-center mb-1'>
                                        <View className='flex-row items-center gap-2'>
                                            <Circle 
                                                size={18} 
                                                color={isSelected ? categoryColor : avail.isFull ? Colors.error : Colors.borderDark}
                                                fill={isSelected ? categoryColor : 'transparent'} 
                                            />
                                            <Text className='text-base font-extrabold' style={{ color: Colors.textPrimary }}>
                                                {slot.label}
                                            </Text>
                                        </View>
                                        <View className='px-2.5 py-1 rounded-full' style={{ backgroundColor: avail.isFull ? '#fecaca' : avail.spotsRemaining === 1 && slotCapacity > 1 ? '#fef08a' : '#dcfce7' }}>
                                            <Text className='text-xs font-extrabold' style={{ color: avail.isFull ? Colors.error : avail.spotsRemaining === 1 && slotCapacity > 1 ? '#854d0e' : Colors.success }}>
                                                {avail.statusText}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className='flex-row justify-between items-center ml-7 mt-1'>
                                        <Text className='text-sm font-semibold' style={{ color: Colors.textSecondary }}>
                                            {slot.time}
                                        </Text>
                                        <Text className='text-xs font-bold' style={{ color: Colors.textTertiary }}>
                                            Duration: 2 hrs
                                        </Text>
                                    </View>
                                </Pressable>
                            )
                        })}
                    </View>
                )}

                {/* 3. Photography Quick Event Presets */}
                {isPhoto && (
                    <View className='gap-3'>
                        {photoSlots.map((slot) => {
                            const avail = getSlotAvailability(slot.time)
                            const isSelected = !isCustomTimeMode && selectedSlot === slot.time

                            return (
                                <Pressable
                                    key={slot.id}
                                    className='p-4 rounded-2xl active:opacity-85'
                                    style={[{
                                        borderWidth: 2,
                                        borderColor: isSelected ? categoryColor : avail.isFull ? Colors.error : Colors.border,
                                        backgroundColor: isSelected ? `${categoryColor}10` : avail.isFull ? '#fee2e2' : Colors.white,
                                        opacity: avail.isFull ? 0.65 : 1,
                                    }, Shadows.small]}
                                    onPress={() => {
                                        if (avail.isFull) return
                                        setSelectedSlot(slot.time)
                                        setIsCustomTimeMode(false)
                                    }}
                                    disabled={avail.isFull}
                                >
                                    <View className='flex-row justify-between items-center mb-1'>
                                        <View className='flex-row items-center gap-2'>
                                            <Circle 
                                                size={18} 
                                                color={isSelected ? categoryColor : avail.isFull ? Colors.error : Colors.borderDark}
                                                fill={isSelected ? categoryColor : 'transparent'} 
                                            />
                                            <Text className='text-base font-extrabold' style={{ color: Colors.textPrimary }}>
                                                {slot.label}
                                            </Text>
                                        </View>
                                        <View className='px-2.5 py-1 rounded-full' style={{ backgroundColor: avail.isFull ? '#fecaca' : isSelected ? `${categoryColor}20` : '#dcfce7' }}>
                                            <Text className='text-xs font-extrabold' style={{ color: avail.isFull ? Colors.error : isSelected ? categoryColor : Colors.success }}>
                                                {avail.statusText}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className='flex-row justify-between items-center ml-7 mt-1'>
                                        <Text className='text-sm font-semibold' style={{ color: Colors.textSecondary }}>
                                            {slot.time}
                                        </Text>
                                        <Text className='text-xs font-bold' style={{ color: Colors.textTertiary }}>
                                            {slot.durationText}
                                        </Text>
                                    </View>
                                </Pressable>
                            )
                        })}
                    </View>
                )}

                {/* 4. Catering Hourly Grid */}
                {isCatering && (
                    <View className='rounded-2xl p-4' style={[{backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border}, Shadows.medium]}>
                        <View className='flex-row items-center gap-2 mb-4'>
                            <Clock size={20} color={categoryColor} />
                            <Text className='text-base font-bold' style={{color: Colors.textPrimary}}>Select Event Start Time</Text>
                        </View>
                        {cateringIntervals.length === 0 ? (
                            <Text className='text-sm text-center font-medium my-4' style={{color: Colors.textSecondary}}>
                                No slots available within operating hours.
                            </Text>
                        ) : (
                            <View style={styles.timeGrid}>
                                {cateringIntervals.map((interval: { label: string; value: string }) => {
                                    const isSelected = selectedSlot === interval.value
                                    const avail = getSlotAvailability(interval.value)

                                    return (
                                        <Pressable
                                            key={interval.value}
                                            style={[
                                                styles.gridItem,
                                                {
                                                    borderColor: isSelected ? categoryColor : avail.isFull ? Colors.error : Colors.border,
                                                    backgroundColor: isSelected ? `${categoryColor}15` : avail.isFull ? '#fee2e2' : Colors.white,
                                                    opacity: avail.isFull ? 0.6 : 1,
                                                }
                                            ]}
                                            onPress={() => {
                                                if (avail.isFull) return
                                                setSelectedSlot(interval.value)
                                            }}
                                            disabled={avail.isFull}
                                        >
                                            <Text 
                                                style={[
                                                    styles.gridItemText,
                                                    {
                                                        color: isSelected ? categoryColor : avail.isFull ? Colors.error : Colors.textPrimary,
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
                            Includes a standard 3-hour serving window.
                        </Text>
                    </View>
                )}

                {/* Custom Time Selector Toggle (for Parlor and Photography) */}
                {(isParlor || isPhoto) && (
                    <View className='mt-4'>
                        <Pressable
                            onPress={() => {
                                setIsCustomTimeMode(!isCustomTimeMode)
                                if (!isCustomTimeMode) {
                                    setSelectedSlot(null)
                                }
                            }}
                            className='flex-row items-center justify-between p-4 rounded-2xl border active:opacity-85'
                            style={{
                                borderColor: isCustomTimeMode ? categoryColor : Colors.border,
                                backgroundColor: isCustomTimeMode ? `${categoryColor}08` : '#f8fafc',
                            }}
                        >
                            <View className='flex-row items-center gap-2.5'>
                                <SlidersHorizontal size={18} color={isCustomTimeMode ? categoryColor : Colors.textSecondary} />
                                <Text className='text-sm font-extrabold' style={{ color: isCustomTimeMode ? categoryColor : Colors.textPrimary }}>
                                    {isCustomTimeMode ? 'Custom Time Selected' : 'Need a Specific Time? (Choose Custom)'}
                                </Text>
                            </View>
                            <View className='px-2.5 py-1 rounded-lg' style={{ backgroundColor: isCustomTimeMode ? categoryColor : Colors.lightGray }}>
                                <Text className='text-xs font-bold' style={{ color: isCustomTimeMode ? Colors.white : Colors.textSecondary }}>
                                    {isCustomTimeMode ? 'Active' : 'Custom'}
                                </Text>
                            </View>
                        </Pressable>

                        {/* Custom Time Picker Expander */}
                        {isCustomTimeMode && (
                            <View className='mt-3 p-5 rounded-2xl bg-white border border-gray-200' style={Shadows.small}>
                                <Text className='text-xs font-extrabold uppercase tracking-wide text-gray-500 mb-3'>Pick Custom Start & End Times</Text>
                                
                                <View className='flex-row gap-3 mb-3'>
                                    {/* Start Time */}
                                    <View className='flex-1'>
                                        <Text className='text-[10px] font-bold text-gray-400 mb-1 uppercase'>Start Time</Text>
                                        <Pressable
                                            onPress={() => setIsStartPickerVisible(true)}
                                            className='flex-row items-center justify-between px-3 py-3 rounded-xl border border-gray-200 bg-slate-50 active:opacity-80'
                                        >
                                            <Text className='font-bold text-sm text-gray-900'>
                                                {customStartHour}:{customStartMinute} {customStartPeriod}
                                            </Text>
                                            <Clock size={16} color={categoryColor} />
                                        </Pressable>
                                    </View>

                                    {/* End Time */}
                                    <View className='flex-1'>
                                        <Text className='text-[10px] font-bold text-gray-400 mb-1 uppercase'>End Time</Text>
                                        <Pressable
                                            onPress={() => setIsEndPickerVisible(true)}
                                            className='flex-row items-center justify-between px-3 py-3 rounded-xl border border-gray-200 bg-slate-50 active:opacity-80'
                                        >
                                            <Text className='font-bold text-sm text-gray-900'>
                                                {customEndHour}:{customEndMinute} {customEndPeriod}
                                            </Text>
                                            <Clock size={16} color={categoryColor} />
                                        </Pressable>
                                    </View>
                                </View>

                                {operatingHours && (
                                    <Text className='text-[11px] font-semibold text-gray-400 text-center'>
                                        Operating Hours: {operatingHours.from} to {operatingHours.to}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                )}

                {/* Live Availability Status Pill */}
                {getSelectedTime() && selectedDate && currentSelectedAvailability ? (
                    <View 
                        className='mt-4 p-3.5 rounded-2xl flex-row items-center gap-3'
                        style={{
                            backgroundColor: currentSelectedAvailability.isFull ? '#fee2e2' : '#f0fdf4',
                            borderWidth: 1.5,
                            borderColor: currentSelectedAvailability.isFull ? Colors.error : Colors.success,
                        }}
                    >
                        {currentSelectedAvailability.isFull ? (
                            <AlertCircle size={20} color={Colors.error} />
                        ) : (
                            <CheckCircle2 size={20} color={Colors.success} />
                        )}
                        <View className='flex-1'>
                            <Text 
                                className='text-xs font-extrabold'
                                style={{ color: currentSelectedAvailability.isFull ? Colors.error : Colors.success }}
                            >
                                {currentSelectedAvailability.isFull ? 'Time Slot Unavailable' : 'Slot Available & Confirmed'}
                            </Text>
                            <Text className='text-xs font-medium text-gray-600 mt-0.5'>
                                {getSelectedTime()} • {currentSelectedAvailability.statusText}
                            </Text>
                        </View>
                    </View>
                ) : null}

                {/* Modals for Custom Time */}
                <TimePickerModal
                    visible={isStartPickerVisible}
                    title="Select Start Time"
                    initialHour={customStartHour}
                    initialMinute={customStartMinute}
                    initialPeriod={customStartPeriod}
                    categoryColor={categoryColor}
                    onClose={() => setIsStartPickerVisible(false)}
                    onConfirm={(h, m, p) => {
                        setCustomStartHour(h)
                        setCustomStartMinute(m)
                        setCustomStartPeriod(p)
                        setIsStartPickerVisible(false)
                    }}
                />

                <TimePickerModal
                    visible={isEndPickerVisible}
                    title="Select End Time"
                    initialHour={customEndHour}
                    initialMinute={customEndMinute}
                    initialPeriod={customEndPeriod}
                    categoryColor={categoryColor}
                    onClose={() => setIsEndPickerVisible(false)}
                    onConfirm={(h, m, p) => {
                        setCustomEndHour(h)
                        setCustomEndMinute(m)
                        setCustomEndPeriod(p)
                        setIsEndPickerVisible(false)
                    }}
                />
            </View>

            {/* Travel Toggle for Parlor */}
            {isParlor && bookingData.isOnSite && (
                <View className='px-5 mb-6'>
                    <Text className='text-xl font-extrabold mb-4' style={{color: Colors.textPrimary}}>Service Location</Text>
                    <View className='rounded-2xl p-4 flex-row gap-3' style={[{backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border}, Shadows.medium]}>
                        <Pressable 
                            className='flex-1 py-3.5 px-4 rounded-xl border flex-row items-center justify-center gap-2 active:opacity-80'
                            style={{
                                borderColor: !isHomeService ? categoryColor : Colors.border,
                                backgroundColor: !isHomeService ? `${categoryColor}10` : 'transparent'
                            }}
                            onPress={() => setIsHomeService(false)}
                        >
                            <Circle size={16} color={!isHomeService ? categoryColor : Colors.borderDark} fill={!isHomeService ? categoryColor : 'transparent'} />
                            <Text className='font-bold text-sm' style={{color: !isHomeService ? categoryColor : Colors.textSecondary}}>Go to Salon</Text>
                        </Pressable>
                        <Pressable 
                            className='flex-1 py-3.5 px-4 rounded-xl border flex-row items-center justify-center gap-2 active:opacity-80'
                            style={{
                                borderColor: isHomeService ? categoryColor : Colors.border,
                                backgroundColor: isHomeService ? `${categoryColor}10` : 'transparent'
                            }}
                            onPress={() => setIsHomeService(true)}
                        >
                            <Circle size={16} color={isHomeService ? categoryColor : Colors.borderDark} fill={isHomeService ? categoryColor : 'transparent'} />
                            <Text className='font-bold text-sm' style={{color: isHomeService ? categoryColor : Colors.textSecondary}}>At My Location</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {/* Location Input - Only for Catering, Photographer & Parlor On-Site */}
            {(isCatering || isPhoto || (isParlor && isHomeService)) && (
                <View className='px-5 mb-6'>
                    <Text className='text-xl font-extrabold mb-4' style={{color: Colors.textPrimary}}>
                        {isCatering ? 'Delivery Location' : 'Event / Home Location'}
                    </Text>
                    <View className='flex-row items-center rounded-2xl px-4 py-4' style={[{backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border}, Shadows.medium]}>
                        <MapPin size={20} color={categoryColor} />
                        <TextInput
                            placeholder={
                                isCatering ? 'Enter delivery address' :
                                isParlor ? 'Enter your home/venue address properly' :
                                'Enter event venue address'
                            }
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
            {addons.length > 0 && (
                <View className='px-5 mb-6'>
                    <Text className='text-xl font-extrabold mb-4' style={{color: Colors.textPrimary}}>Optional Add-ons</Text>
                    <View className='gap-3'>
                        {addons.map((addon) => (
                            <View key={addon.id} className='rounded-2xl overflow-hidden' style={[{backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border}]}>
                                <Pressable 
                                    className='p-4 flex-row justify-between items-center active:opacity-80'
                                    onPress={() => toggleAddon(addon.id)}
                                >
                                    <View className='flex-row items-center gap-3 flex-1'>
                                        <View>
                                            <Circle 
                                                size={20} 
                                                color={selectedAddons[addon.id] ? categoryColor : Colors.borderDark} 
                                                fill={selectedAddons[addon.id] ? categoryColor : 'transparent'} 
                                            />
                                        </View>
                                        <View className='flex-1'>
                                            <Text className='text-sm font-extrabold' style={{color: Colors.textPrimary}} numberOfLines={2}>{addon.name}</Text>
                                            <Text className='text-sm font-bold mt-1' style={{color: categoryColor}}>
                                                + PKR {addon.price.toLocaleString()}
                                            </Text>
                                        </View>
                                    </View>
                                    {addon.items && addon.items.length > 0 && (
                                        <Pressable 
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                toggleExpandAddon(addon.id);
                                            }}
                                            className='p-2'
                                        >
                                            <ChevronDown size={20} color={Colors.textSecondary} style={{ transform: [{ rotate: expandedAddons[addon.id] ? '180deg' : '0deg' }] }} />
                                        </Pressable>
                                    )}
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
            )}

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
                    {requiresGuestCount && bookingData.guestCount ? (
                        <View className='flex-row justify-between items-center mb-3'>
                            <Text className='text-xs font-bold' style={{color: Colors.textSecondary}}>Guests</Text>
                            <Text className='text-sm font-bold' style={{color: Colors.textPrimary}}>{bookingData.guestCount}</Text>
                        </View>
                    ) : null}

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
                    {(isCatering || isPhoto || (isParlor && isHomeService)) && (
                        <View className='flex-row justify-between items-start mb-3'>
                            <Text className='text-xs font-bold' style={{color: Colors.textSecondary}}>Location</Text>
                            <Text className='text-sm font-bold flex-1 text-right' style={{color: Colors.textPrimary}} numberOfLines={2}>
                                {location || 'Not provided'}
                            </Text>
                        </View>
                    )}

                    {/* Special Requests */}
                    {specialRequests ? (
                        <View className='flex-row justify-between items-start mb-3'>
                            <Text className='text-xs font-bold' style={{color: Colors.textSecondary}}>Special Requests</Text>
                            <Text className='text-sm font-bold flex-1 text-right' style={{color: Colors.textPrimary}} numberOfLines={3}>
                                {specialRequests}
                            </Text>
                        </View>
                    ) : null}

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

                    {/* Travel Fee */}
                    {travelFeeTotal > 0 && (
                        <View className='flex-row justify-between items-center mb-3'>
                            <Text className='text-xs font-bold' style={{color: Colors.textSecondary}}>On-Site Travel Fee</Text>
                            <Text className='text-sm font-bold' style={{color: Colors.textPrimary}}>PKR {travelFeeTotal.toLocaleString()}</Text>
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
        justifyContent: 'space-between',
        rowGap: 10,
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
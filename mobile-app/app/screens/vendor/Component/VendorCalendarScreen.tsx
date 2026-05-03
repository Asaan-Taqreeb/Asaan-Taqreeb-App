import { View, Text, ScrollView, Pressable, StyleSheet, Modal, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { useEffect, useMemo, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, ChevronRight, Calendar, Lock, CheckCircle, X, Clock, Users, MapPin } from 'lucide-react-native'
import { Colors, Shadows } from '@/app/_constants/theme'
import { blockDateForVendor, getVendorAvailability, unblockDateForVendor, type VendorAvailabilityDay } from '@/app/_utils/availabilityApi'
import { getVendorBookings } from '@/app/_utils/bookingsApi'
import { useUser } from '@/app/_context/UserContext'

import AsyncStorage from '@react-native-async-storage/async-storage'
 
interface BookingDetail {
  id: number
  clientName: string
  packageName: string
  time: string
  guests?: number
  location?: string
  status: 'confirmed' | 'pending'
  amount: number
}

interface TimeSlot {
  id: string
  label: string
  from: string
  to: string
}

interface DayData {
  date: number
  isCurrentMonth: boolean
  isToday: boolean
  isBooked: boolean
  isBlocked: boolean
  bookings: BookingDetail[]
}

export default function VendorCalendarScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useUser()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [manageDateString, setManageDateString] = useState('')
  const [blockFromHour, setBlockFromHour] = useState('10')
  const [blockFromMinute, setBlockFromMinute] = useState('00')
  const [blockFromPeriod, setBlockFromPeriod] = useState<'AM' | 'PM'>('AM')
  const [blockToHour, setBlockToHour] = useState('05')
  const [blockToMinute, setBlockToMinute] = useState('00')
  const [blockToPeriod, setBlockToPeriod] = useState<'AM' | 'PM'>('PM')
  const [blockReason, setBlockReason] = useState('Blocked by vendor')
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false)
  const [availabilityDays, setAvailabilityDays] = useState<VendorAvailabilityDay[]>([])
  const [bookingsByDate, setBookingsByDate] = useState<Record<string, BookingDetail[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [slots, setSlots] = useState<TimeSlot[]>([])

  useEffect(() => {
    const loadSlots = async () => {
      if (!user?.id) return
      try {
        const saved = await AsyncStorage.getItem('vendor_slots_' + user.id)
        if (saved) {
          setSlots(JSON.parse(saved))
        }
      } catch (error) {
        console.log('Failed to load slots in calendar:', error)
      }
    }
    loadSlots()
  }, [user?.id])

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const blockedDateSet = useMemo(() => {
    return new Set(availabilityDays.filter((day) => day.isBlocked).map((day) => day.date))
  }, [availabilityDays])

  const blockedSlotsByDate = useMemo(() => {
    return availabilityDays.reduce<Record<string, VendorAvailabilityDay[]>>((acc, day) => {
      if (!day.isBlocked) return acc
      if (!acc[day.date]) acc[day.date] = []
      acc[day.date].push(day)
      return acc
    }, {})
  }, [availabilityDays])

  const toDateString = (day: DayData) => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`
  }

  useEffect(() => {
    let mounted = true

    const loadCalendarData = async () => {
      if (!user?.id) {
        if (mounted) {
          setAvailabilityDays([])
          setBookingsByDate({})
        }
        return
      }

      try {
        if (mounted) setIsLoading(true)

        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const from = new Date(year, month, 1).toISOString().slice(0, 10)
        const to = new Date(year, month + 1, 0).toISOString().slice(0, 10)

        const [availability, vendorBookings] = await Promise.all([
          getVendorAvailability(user.id, from, to),
          getVendorBookings(),
        ])

        if (!mounted) return

        setAvailabilityDays(availability)

        const normalizedBookings = vendorBookings.reduce<Record<string, BookingDetail[]>>((acc, booking, index) => {
          // Ignore rejected bookings in the calendar view
          if (booking.status === 'rejected') return acc

          const date = String(booking.eventDate || '').slice(0, 10)
          if (!date) return acc

          if (!acc[date]) acc[date] = []

          acc[date].push({
            id: index + 1,
            clientName: booking.customerName,
            packageName: booking.packageName,
            time: booking.eventTime,
            guests: booking.guestCount,
            location: undefined,
            status: booking.status === 'pending' ? 'pending' : 'confirmed',
            amount: booking.totalAmount,
          })

          return acc
        }, {})

        setBookingsByDate(normalizedBookings)
      } catch (error) {
        console.log('Failed to load calendar data:', error)
        if (mounted) {
          setAvailabilityDays([])
          setBookingsByDate({})
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadCalendarData()

    return () => {
      mounted = false
    }
  }, [currentDate, user?.id])

  const getDaysInMonth = (date: Date): DayData[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days: DayData[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = prevMonthLastDay - i
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isBooked: false,
        isBlocked: false,
        bookings: []
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(year, month, i)
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      const bookings = bookingsByDate[dateString] || []
      
      days.push({
        date: i,
        isCurrentMonth: true,
        isToday: dateObj.getTime() === today.getTime(),
        isBooked: bookings.length > 0,
        isBlocked: blockedDateSet.has(dateString),
        bookings
      })
    }

    // Next month days
    const remainingDays = 42 - days.length // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        isToday: false,
        isBooked: false,
        isBlocked: false,
        bookings: []
      })
    }

    return days
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleDatePress = (day: DayData) => {
    if (!day.isCurrentMonth) return
    
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date)
    setSelectedDate(selected)
    
    if (day.bookings.length > 0) {
      setShowBookingModal(true)
    }
  }

  const isValidTime = (value: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)

  const toTwentyFourHour = (value: string, period: 'AM' | 'PM') => {
    const [hourRaw, minuteRaw] = String(value || '').split(':')
    const hour = Number(hourRaw)
    const minute = Number(minuteRaw)

    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null

    let normalizedHour = hour % 12
    if (period === 'PM') normalizedHour += 12
    return `${String(normalizedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  const openBlockManager = (day: DayData) => {
    if (!day.isCurrentMonth || day.isBooked) return

    const dateString = toDateString(day)
    setManageDateString(dateString)
    setBlockFromHour('10')
    setBlockFromMinute('00')
    setBlockFromPeriod('AM')
    setBlockToHour('05')
    setBlockToMinute('00')
    setBlockToPeriod('PM')
    setBlockReason('Blocked by vendor')
    setShowBlockModal(true)
  }

  const applyPredefinedSlot = (slot: TimeSlot) => {
    // Expected format "10:00 AM"
    const fromParts = slot.from.match(/(\d+):(\d+)\s*(AM|PM)/i)
    const toParts = slot.to.match(/(\d+):(\d+)\s*(AM|PM)/i)
    
    if (fromParts) {
      setBlockFromHour(fromParts[1])
      setBlockFromMinute(fromParts[2])
      setBlockFromPeriod(fromParts[3].toUpperCase() as 'AM' | 'PM')
    }
    
    if (toParts) {
      setBlockToHour(toParts[1])
      setBlockToMinute(toParts[2])
      setBlockToPeriod(toParts[3].toUpperCase() as 'AM' | 'PM')
    }
  }

  const handleBlockWithTime = async () => {
    if (!manageDateString || isSubmittingBlock) return

    const from24 = toTwentyFourHour(`${blockFromHour}:${blockFromMinute}`, blockFromPeriod)
    const to24 = toTwentyFourHour(`${blockToHour}:${blockToMinute}`, blockToPeriod)

    if (!from24 || !to24) {
      Alert.alert('Invalid Time', 'Use 12-hour time values like 09:30 with AM or PM selected.')
      return
    }

    if (!isValidTime(from24) || !isValidTime(to24)) {
      Alert.alert('Invalid Time', 'Please enter valid times.')
      return
    }

    if (from24 >= to24) {
      Alert.alert('Invalid Range', 'End time must be later than start time.')
      return
    }

    try {
      setIsSubmittingBlock(true)
      const success = await blockDateForVendor(manageDateString, {
        vendorId: user?.id,
        reason: blockReason.trim() || 'Blocked by vendor',
        timeSlot: { from: from24, to: to24 },
      })

      if (!success) return

      setAvailabilityDays((prev) => {
        const next = prev.filter((item) => {
          const sameDate = item.date === manageDateString
          const sameTime = item.timeSlot?.from === from24 && item.timeSlot?.to === to24
          return !(sameDate && sameTime)
        })

        next.push({
          date: manageDateString,
          isBlocked: true,
          isBooked: false,
          reason: blockReason.trim() || 'Blocked by vendor',
          timeSlot: { from: from24, to: to24 },
        })

        return next
      })

      setShowBlockModal(false)
    } catch (error: any) {
      Alert.alert('Failed', error?.message || 'Unable to block this time slot.')
    } finally {
      setIsSubmittingBlock(false)
    }
  }

  const handleUnblockDate = async () => {
    if (!manageDateString || isSubmittingBlock) return

    try {
      setIsSubmittingBlock(true)
      const success = await unblockDateForVendor(manageDateString, { vendorId: user?.id })
      if (!success) return

      setAvailabilityDays((prev) => prev.filter((item) => item.date !== manageDateString))
      setShowBlockModal(false)
    } catch (error: any) {
      Alert.alert('Failed', error?.message || 'Unable to unblock this date.')
    } finally {
      setIsSubmittingBlock(false)
    }
  }

  const days = getDaysInMonth(currentDate)
  const selectedDayData = selectedDate ? days.find(d => 
    d.isCurrentMonth && d.date === selectedDate.getDate()
  ) : null

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* Header */}
      <View className='px-5 py-4 flex-row items-center justify-between' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
        <View>
          <Text className='text-2xl font-extrabold' style={{color: Colors.textPrimary}}>Calendar</Text>
          <Text className='text-xs font-medium mt-1' style={{color: Colors.textSecondary}}>Manage your bookings & availability</Text>
        </View>
        <Calendar size={28} color={Colors.vendor} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month Navigation */}
        <View className='px-5 py-4 flex-row items-center justify-between'>
          <Pressable 
            className='p-2 rounded-full active:opacity-70'
            style={{backgroundColor: Colors.lightGray}}
            onPress={handlePrevMonth}
          >
            <ChevronLeft size={24} color={Colors.textPrimary} />
          </Pressable>
          
          <Text className='text-xl font-extrabold' style={{color: Colors.textPrimary}}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          
          <Pressable 
            className='p-2 rounded-full active:opacity-70'
            style={{backgroundColor: Colors.lightGray}}
            onPress={handleNextMonth}
          >
            <ChevronRight size={24} color={Colors.textPrimary} />
          </Pressable>
        </View>

        {isLoading && (
          <View className='px-5 pb-2'>
            <Text className='text-xs font-semibold' style={{color: Colors.textSecondary}}>Refreshing availability...</Text>
          </View>
        )}

        {/* Legend */}
        <View className='px-5 pb-3 flex-row flex-wrap gap-3'>
          <View className='flex-row items-center gap-1'>
            <View className='w-3 h-3 rounded-full' style={{backgroundColor: Colors.vendor}} />
            <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Booked</Text>
          </View>
          <View className='flex-row items-center gap-1'>
            <View className='w-3 h-3 rounded-full' style={{backgroundColor: Colors.error}} />
            <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Blocked</Text>
          </View>
          <View className='flex-row items-center gap-1'>
            <View className='w-3 h-3 rounded-full border-2' style={{borderColor: Colors.primary}} />
            <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Today</Text>
          </View>
        </View>

        {/* Calendar Grid */}
        <View className='px-5 pb-4'>
          <View className='rounded-2xl overflow-hidden' style={[{backgroundColor: Colors.white}, Shadows.medium]}>
            {/* Day Headers */}
            <View className='flex-row bg-gray-50 border-b' style={{borderBottomColor: Colors.border}}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <View key={day} className='flex-1 py-3 items-center'>
                  <Text className='text-xs font-bold' style={{color: Colors.textSecondary}}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Days */}
            <View className='flex-row flex-wrap'>
              {days.map((day, index) => {
                const isWeekend = index % 7 === 0 || index % 7 === 6
                
                return (
                  <Pressable
                    key={index}
                    className='border-r border-b'
                    style={[
                      {
                        width: '14.28%',
                        aspectRatio: 1,
                        borderRightColor: Colors.border,
                        borderBottomColor: Colors.border,
                        backgroundColor: !day.isCurrentMonth ? '#f9fafb' : Colors.white
                      }
                    ]}
                    onPress={() => handleDatePress(day)}
                    onLongPress={() => openBlockManager(day)}
                    disabled={!day.isCurrentMonth}
                  >
                    <View className='w-full h-full items-center justify-center p-1'>
                      <View className='relative items-center justify-center'>
                        {day.isToday && (
                          <View 
                            className='absolute w-8 h-8 rounded-full border-2'
                            style={{borderColor: Colors.primary}}
                          />
                        )}
                        {day.isBooked && (
                          <View 
                            className='absolute w-8 h-8 rounded-full'
                            style={{backgroundColor: Colors.vendor, opacity: 0.9}}
                          />
                        )}
                        {day.isBlocked && !day.isBooked && (
                          <View 
                            className='absolute w-8 h-8 rounded-full'
                            style={{backgroundColor: Colors.error, opacity: 0.9}}
                          />
                        )}
                        <Text 
                          className='text-sm font-bold z-10'
                          style={{
                            color: day.isBooked || day.isBlocked 
                              ? Colors.white 
                              : day.isCurrentMonth 
                                ? (isWeekend ? Colors.vendor : Colors.textPrimary)
                                : Colors.textTertiary
                          }}
                        >
                          {day.date}
                        </Text>
                      </View>
                      
                      {day.bookings.length > 1 && (
                        <View className='mt-0.5 px-1 py-0.5 rounded' style={{backgroundColor: Colors.white}}>
                          <Text className='text-xs font-bold' style={{color: Colors.vendor}}>
                            {day.bookings.length}
                          </Text>
                        </View>
                      )}
                      
                      {day.isBlocked && !day.isBooked && (
                        <Lock size={10} color={Colors.white} className='absolute bottom-1' />
                      )}
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View className='px-5 pb-4'>
          <View className='rounded-xl p-4' style={{backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe'}}>
            <Text className='text-xs font-bold mb-2' style={{color: Colors.primary}}>HOW TO USE</Text>
            <Text className='text-sm font-medium leading-relaxed mb-1' style={{color: Colors.textSecondary}}>
              • <Text className='font-bold'>Tap</Text> on a date to view bookings
            </Text>
            <Text className='text-sm font-medium leading-relaxed mb-1' style={{color: Colors.textSecondary}}>
              • <Text className='font-bold'>Long press</Text> on empty dates to manage blocked time slots
            </Text>
            <Text className='text-sm font-medium leading-relaxed' style={{color: Colors.textSecondary}}>
              • Blocked dates won&apos;t be available for client bookings
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View className='px-5 pb-6'>
          <Text className='text-lg font-extrabold mb-3' style={{color: Colors.textPrimary}}>This Month</Text>
          <View className='flex-row gap-3'>
            <View className='flex-1 rounded-xl p-4' style={[{backgroundColor: Colors.white}, Shadows.small]}>
              <View className='flex-row items-center justify-between mb-1'>
                <CheckCircle size={20} color={Colors.success} />
                <Text className='text-2xl font-extrabold' style={{color: Colors.success}}>
                  {Object.keys(bookingsByDate).filter(date => date.startsWith(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`)).length}
                </Text>
              </View>
              <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Bookings</Text>
            </View>
            
            <View className='flex-1 rounded-xl p-4' style={[{backgroundColor: Colors.white}, Shadows.small]}>
              <View className='flex-row items-center justify-between mb-1'>
                <Lock size={20} color={Colors.error} />
                <Text className='text-2xl font-extrabold' style={{color: Colors.error}}>
                  {Array.from(blockedDateSet).filter(date => date.startsWith(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`)).length}
                </Text>
              </View>
              <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Blocked Days</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showBlockModal}
        transparent={true}
        animationType='slide'
        onRequestClose={() => setShowBlockModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View className='flex-1 justify-end' style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <View className='rounded-t-3xl p-6 pb-10' style={{backgroundColor: Colors.white}}>
              <View className='flex-row items-center justify-between mb-4'>
                <View>
                  <Text className='text-xl font-extrabold' style={{color: Colors.textPrimary}}>Manage Availability</Text>
                  <Text className='text-sm font-medium mt-1' style={{color: Colors.textSecondary}}>{manageDateString}</Text>
                </View>
                <Pressable
                  className='p-2 rounded-full active:opacity-70'
                  style={{backgroundColor: Colors.lightGray}}
                  onPress={() => setShowBlockModal(false)}
                >
                  <X size={22} color={Colors.textPrimary} />
                </Pressable>
              </View>

              {/* Predefined Slots */}
              {slots.length > 0 && (
                <View className="mb-6">
                  <Text className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">QUICK BLOCK SLOTS</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {slots.map(slot => (
                      <Pressable
                        key={slot.id}
                        onPress={() => applyPredefinedSlot(slot)}
                        className="px-4 py-3 rounded-2xl border-2 items-center justify-center"
                        style={{
                          borderColor: Colors.vendor + '20',
                          backgroundColor: Colors.vendor + '05',
                          minWidth: '30%'
                        }}
                      >
                        <Text className="text-sm font-extrabold" style={{ color: Colors.vendor }}>
                          {slot.label}
                        </Text>
                        <Text className="text-[10px] font-bold text-gray-500 mt-0.5">{slot.from} - {slot.to}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              <View className='mb-3'>
                <Text className='text-[10px] font-bold mb-2' style={{color: Colors.textSecondary}}>FROM</Text>
                <View className='flex-row gap-2'>
                  <TextInput
                    value={blockFromHour}
                    onChangeText={setBlockFromHour}
                    placeholder='10'
                    className='flex-1 rounded-xl px-3 py-3'
                    style={{borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary}}
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType='numeric'
                    maxLength={2}
                  />
                  <Text className='self-center text-lg font-extrabold' style={{color: Colors.textSecondary}}>:</Text>
                  <TextInput
                    value={blockFromMinute}
                    onChangeText={setBlockFromMinute}
                    placeholder='00'
                    className='flex-1 rounded-xl px-3 py-3'
                    style={{borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary}}
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType='numeric'
                    maxLength={2}
                  />
                  <View className='flex-row rounded-xl overflow-hidden' style={{borderWidth: 1, borderColor: Colors.border}}>
                    <Pressable
                      className='px-3 py-3'
                      style={{backgroundColor: blockFromPeriod === 'AM' ? Colors.vendor : 'transparent'}}
                      onPress={() => setBlockFromPeriod('AM')}
                    >
                      <Text className='font-bold' style={{color: blockFromPeriod === 'AM' ? Colors.white : Colors.textSecondary}}>AM</Text>
                    </Pressable>
                    <Pressable
                      className='px-3 py-3'
                      style={{backgroundColor: blockFromPeriod === 'PM' ? Colors.vendor : 'transparent'}}
                      onPress={() => setBlockFromPeriod('PM')}
                    >
                      <Text className='font-bold' style={{color: blockFromPeriod === 'PM' ? Colors.white : Colors.textSecondary}}>PM</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View className='mb-4'>
                <Text className='text-[10px] font-bold mb-2' style={{color: Colors.textSecondary}}>TO</Text>
                <View className='flex-row gap-2'>
                  <TextInput
                    value={blockToHour}
                    onChangeText={setBlockToHour}
                    placeholder='05'
                    className='flex-1 rounded-xl px-3 py-3'
                    style={{borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary}}
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType='numeric'
                    maxLength={2}
                  />
                  <Text className='self-center text-lg font-extrabold' style={{color: Colors.textSecondary}}>:</Text>
                  <TextInput
                    value={blockToMinute}
                    onChangeText={setBlockToMinute}
                    placeholder='00'
                    className='flex-1 rounded-xl px-3 py-3'
                    style={{borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary}}
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType='numeric'
                    maxLength={2}
                  />
                  <View className='flex-row rounded-xl overflow-hidden' style={{borderWidth: 1, borderColor: Colors.border}}>
                    <Pressable
                      className='px-3 py-3'
                      style={{backgroundColor: blockToPeriod === 'AM' ? Colors.vendor : 'transparent'}}
                      onPress={() => setBlockToPeriod('AM')}
                    >
                      <Text className='font-bold' style={{color: blockToPeriod === 'AM' ? Colors.white : Colors.textSecondary}}>AM</Text>
                    </Pressable>
                    <Pressable
                      className='px-3 py-3'
                      style={{backgroundColor: blockToPeriod === 'PM' ? Colors.vendor : 'transparent'}}
                      onPress={() => setBlockToPeriod('PM')}
                    >
                      <Text className='font-bold' style={{color: blockToPeriod === 'PM' ? Colors.white : Colors.textSecondary}}>PM</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View className='mb-6'>
                <Text className='text-[10px] font-bold mb-2' style={{color: Colors.textSecondary}}>REASON (OPTIONAL)</Text>
                <TextInput
                  value={blockReason}
                  onChangeText={setBlockReason}
                  placeholder='Why is this date blocked?'
                  className='rounded-xl px-4 py-3'
                  style={{borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary}}
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>

              <View className='flex-row gap-3'>
                <Pressable
                  className='flex-1 py-4 rounded-2xl active:opacity-85 border-2'
                  style={{borderColor: Colors.error}}
                  onPress={handleUnblockDate}
                  disabled={isSubmittingBlock}
                >
                  <Text className='text-center font-extrabold' style={{color: Colors.error}}>
                    {isSubmittingBlock ? '...' : 'Clear All'}
                  </Text>
                </Pressable>
                <Pressable
                  className='flex-2 py-4 rounded-2xl active:opacity-85'
                  style={{backgroundColor: Colors.vendor, flex: 2}}
                  onPress={handleBlockWithTime}
                  disabled={isSubmittingBlock}
                >
                  <Text className='text-center text-white font-extrabold text-lg'>
                    {isSubmittingBlock ? 'Updating...' : 'Block Selected Time'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Booking Details Modal */}
      <Modal
        visible={showBookingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View className='flex-1 justify-end' style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <View 
            className='rounded-t-3xl p-5'
            style={[{backgroundColor: Colors.white, maxHeight: '80%'}]}
          >
            {/* Modal Header */}
            <View className='flex-row items-center justify-between mb-4'>
              <View>
                <Text className='text-xl font-extrabold' style={{color: Colors.textPrimary}}>
                  {selectedDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
                <Text className='text-sm font-medium mt-1' style={{color: Colors.textSecondary}}>
                  {selectedDayData?.bookings.length || 0} Booking(s)
                </Text>
              </View>
              <Pressable
                className='p-2 rounded-full active:opacity-70'
                style={{backgroundColor: Colors.lightGray}}
                onPress={() => setShowBookingModal(false)}
              >
                <X size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            {/* Bookings List */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedDayData?.bookings.map((booking) => (
                <View 
                  key={booking.id}
                  className='rounded-xl p-4 mb-3'
                  style={[{backgroundColor: Colors.background}, Shadows.small]}
                >
                  <View className='flex-row items-start justify-between mb-3'>
                    <View className='flex-1'>
                      <Text className='text-base font-extrabold mb-1' style={{color: Colors.textPrimary}}>
                        {booking.clientName}
                      </Text>
                      <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>
                        {booking.packageName}
                      </Text>
                    </View>
                    <View 
                      className='px-2 py-1 rounded-full'
                      style={{backgroundColor: booking.status === 'confirmed' ? '#dcfce7' : '#fef3c7'}}
                    >
                      <Text 
                        className='text-xs font-bold uppercase'
                        style={{color: booking.status === 'confirmed' ? Colors.success : Colors.warning}}
                      >
                        {booking.status}
                      </Text>
                    </View>
                  </View>

                  <View className='gap-2'>
                    <View className='flex-row items-center gap-2'>
                      <Clock size={16} color={Colors.vendor} />
                      <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>
                        {booking.time}
                      </Text>
                    </View>
                    
                    {booking.guests && (
                      <View className='flex-row items-center gap-2'>
                        <Users size={16} color={Colors.vendor} />
                        <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>
                          {booking.guests} Guests
                        </Text>
                      </View>
                    )}
                    
                    {booking.location && (
                      <View className='flex-row items-start gap-2'>
                        <MapPin size={16} color={Colors.vendor} className='mt-0.5' />
                        <Text className='text-sm font-medium flex-1' style={{color: Colors.textSecondary}}>
                          {booking.location}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className='pt-3 mt-3 flex-row items-center justify-between' style={{borderTopWidth: 1, borderTopColor: Colors.border}}>
                    <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>Amount</Text>
                    <Text className='text-lg font-extrabold' style={{color: Colors.vendor}}>
                      PKR {booking.amount.toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  }
})

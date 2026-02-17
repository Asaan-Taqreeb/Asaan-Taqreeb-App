import { View, Text, ScrollView, Pressable, StyleSheet, Modal } from 'react-native'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, ChevronRight, Calendar, Lock, CheckCircle, X, Clock, Users, MapPin } from 'lucide-react-native'
import { Colors, Shadows, Spacing } from '@/app/_constants/theme'
import { router } from 'expo-router'

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
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  
  // Mock blocked dates (will come from backend)
  const [blockedDates, setBlockedDates] = useState<string[]>([
    '2026-02-20', '2026-02-27', '2026-03-05'
  ])

  // Mock bookings (will come from backend)
  const mockBookings: Record<string, BookingDetail[]> = {
    '2026-02-15': [
      {
        id: 1,
        clientName: 'Ahmed Khan',
        packageName: 'Premium Gold Package',
        time: '7:00 PM - 11:00 PM',
        guests: 500,
        status: 'confirmed',
        amount: 450000
      }
    ],
    '2026-02-20': [
      {
        id: 2,
        clientName: 'Sara Ali',
        packageName: 'Silver Package',
        time: '6:00 PM - 10:00 PM',
        guests: 300,
        status: 'confirmed',
        amount: 280000
      }
    ],
    '2026-02-22': [
      {
        id: 3,
        clientName: 'Hassan Raza',
        packageName: 'Executive Menu',
        time: '5:00 PM - 9:00 PM',
        location: 'Pearl Continental, Lahore',
        status: 'pending',
        amount: 320000
      },
      {
        id: 4,
        clientName: 'Fatima Malik',
        packageName: 'Bridal Deluxe',
        time: '10:00 AM - 2:00 PM',
        status: 'confirmed',
        amount: 45000
      }
    ],
    '2026-03-05': [
      {
        id: 5,
        clientName: 'Bilal Ahmed',
        packageName: 'Platinum Coverage',
        time: '3:00 PM - 10:00 PM',
        location: 'Beach View Park, Karachi',
        status: 'confirmed',
        amount: 85000
      }
    ]
  }

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

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
      const bookings = mockBookings[dateString] || []
      
      days.push({
        date: i,
        isCurrentMonth: true,
        isToday: dateObj.getTime() === today.getTime(),
        isBooked: bookings.length > 0,
        isBlocked: blockedDates.includes(dateString),
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

  const toggleBlockDate = (day: DayData) => {
    if (!day.isCurrentMonth || day.isBooked) return
    
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`
    
    if (blockedDates.includes(dateString)) {
      setBlockedDates(blockedDates.filter(d => d !== dateString))
    } else {
      setBlockedDates([...blockedDates, dateString])
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
                    onLongPress={() => toggleBlockDate(day)}
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
              • <Text className='font-bold'>Long press</Text> on empty dates to block/unblock
            </Text>
            <Text className='text-sm font-medium leading-relaxed' style={{color: Colors.textSecondary}}>
              • Blocked dates won't be available for client bookings
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
                  {Object.keys(mockBookings).filter(date => date.startsWith('2026-02')).length}
                </Text>
              </View>
              <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Bookings</Text>
            </View>
            
            <View className='flex-1 rounded-xl p-4' style={[{backgroundColor: Colors.white}, Shadows.small]}>
              <View className='flex-row items-center justify-between mb-1'>
                <Lock size={20} color={Colors.error} />
                <Text className='text-2xl font-extrabold' style={{color: Colors.error}}>
                  {blockedDates.filter(date => date.startsWith('2026-02')).length}
                </Text>
              </View>
              <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Blocked Days</Text>
            </View>
          </View>
        </View>
      </ScrollView>

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

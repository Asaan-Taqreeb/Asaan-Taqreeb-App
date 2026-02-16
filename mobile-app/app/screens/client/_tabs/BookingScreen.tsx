import { ScrollView, StyleSheet, Text, View, Pressable, Modal, TextInput } from 'react-native'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Clock, MapPin, Users, Calendar, CheckCircle, XCircle, AlertCircle, CreditCard, X } from 'lucide-react-native'
import { Colors, getCategoryColor, Shadows, Spacing } from '@/app/constants/theme'

type BookingStatus = 'pending' | 'approved' | 'rejected' | 'confirmed' | 'completed'

interface Booking {
  id: number
  category: string
  vendorName: string
  vendorLocation: string
  packageName: string
  date: string
  time: string
  guestCount?: number
  location?: string
  price: number
  advancePayment: number
  status: BookingStatus
  rejectionReason?: string
  bookingDate: string
}

export default function BookingScreen() {
  const insets = useSafeAreaInsets()
  const [selectedFilter, setSelectedFilter] = useState<'all' | BookingStatus>('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | null>(null)

  // Mock bookings data (will be from API/database in production)
  const [bookings] = useState<Booking[]>([
    {
      id: 1,
      category: 'banquet',
      vendorName: 'Royal Palace Banquet',
      vendorLocation: 'F-7, Islamabad',
      packageName: 'Premium Gold Package',
      date: '2026-03-15',
      time: 'Evening (9 PM to 12 AM)',
      guestCount: 500,
      price: 450000,
      advancePayment: 225000,
      status: 'approved',
      bookingDate: '2026-02-10'
    },
    {
      id: 2,
      category: 'catering',
      vendorName: 'Spice Garden Catering',
      vendorLocation: 'Gulberg, Lahore',
      packageName: 'Executive Menu',
      date: '2026-03-20',
      time: '05:00 PM - 10:00 PM',
      guestCount: 200,
      location: 'Pearl Continental Hotel, Mall Road, Lahore',
      price: 320000,
      advancePayment: 160000,
      status: 'pending',
      bookingDate: '2026-02-14'
    },
    {
      id: 3,
      category: 'photo',
      vendorName: 'Perfect Moments Photography',
      vendorLocation: 'Karachi',
      packageName: 'Platinum Coverage',
      date: '2026-04-05',
      time: '02:00 PM - 11:00 PM',
      location: 'Beach View Park, Karachi',
      price: 85000,
      advancePayment: 42500,
      status: 'rejected',
      rejectionReason: 'Already booked for that date. Please select another date or check our availability.',
      bookingDate: '2026-02-12'
    },
    {
      id: 4,
      category: 'parlor',
      vendorName: 'Glam Studio',
      vendorLocation: 'Blue Area, Islamabad',
      packageName: 'Bridal Deluxe Package',
      date: '2026-03-18',
      time: '10:00 AM - 04:00 PM',
      price: 45000,
      advancePayment: 22500,
      status: 'confirmed',
      bookingDate: '2026-02-08'
    }
  ])

  const getStatusConfig = (status: BookingStatus) => {
    switch(status) {
      case 'pending':
        return {
          label: 'Pending Approval',
          icon: AlertCircle,
          color: Colors.warning,
          bgColor: '#fef3c7',
          borderColor: '#fcd34d'
        }
      case 'approved':
        return {
          label: 'Approved - Payment Required',
          icon: CheckCircle,
          color: Colors.success,
          bgColor: '#dcfce7',
          borderColor: '#86efac'
        }
      case 'rejected':
        return {
          label: 'Rejected',
          icon: XCircle,
          color: Colors.error,
          bgColor: '#fee2e2',
          borderColor: '#fca5a5'
        }
      case 'confirmed':
        return {
          label: 'Confirmed & Paid',
          icon: CheckCircle,
          color: '#059669',
          bgColor: '#d1fae5',
          borderColor: '#6ee7b7'
        }
      case 'completed':
        return {
          label: 'Completed',
          icon: CheckCircle,
          color: Colors.textSecondary,
          bgColor: Colors.lightGray,
          borderColor: Colors.border
        }
    }
  }

  const filteredBookings = selectedFilter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === selectedFilter)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handlePayNow = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowPaymentModal(true)
  }

  const processPayment = () => {
    if (selectedBooking && paymentMethod) {
      // In production, this would process actual payment
      alert(`Payment of PKR ${selectedBooking.advancePayment.toLocaleString()} processed successfully!`)
      setShowPaymentModal(false)
      setSelectedBooking(null)
      setPaymentMethod(null)
    }
  }

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'confirmed', label: 'Confirmed' },
  ]

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      {/* Header */}
      <View className='px-5 py-4' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
        <Text className='text-2xl font-extrabold' style={{color: Colors.textPrimary}}>My Bookings</Text>
        <Text className='text-xs font-medium mt-1' style={{color: Colors.textSecondary}}>Track and manage your event bookings</Text>
      </View>

      {/* Filter Tabs */}
      <View className='px-5 py-3' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
        >
          {filters.map((filter) => (
            <Pressable
              key={filter.id}
              className='px-4 py-2 rounded-full mr-2 active:opacity-80'
              style={{
                backgroundColor: selectedFilter === filter.id ? Colors.primary : Colors.lightGray,
                borderWidth: selectedFilter === filter.id ? 0 : 1,
                borderColor: Colors.border
              }}
              onPress={() => setSelectedFilter(filter.id as any)}
            >
              <Text 
                className='text-base font-bold'
                style={{color: selectedFilter === filter.id ? Colors.white : Colors.textPrimary}}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Bookings List */}
      <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
        {filteredBookings.length === 0 ? (
          <View className='flex-1 justify-center items-center py-20'>
            <AlertCircle size={64} color={Colors.textTertiary} />
            <Text className='text-lg font-bold mt-4' style={{color: Colors.textSecondary}}>No bookings found</Text>
            <Text className='text-sm font-medium mt-2 text-center px-8' style={{color: Colors.textTertiary}}>
              {selectedFilter === 'all' 
                ? 'Start booking vendors for your event' 
                : `No ${selectedFilter} bookings at the moment`}
            </Text>
          </View>
        ) : (
          <View className='px-5 py-4 gap-4'>
            {filteredBookings.map((booking) => {
              const statusConfig = getStatusConfig(booking.status)
              const categoryColor = getCategoryColor(booking.category)
              const StatusIcon = statusConfig.icon

              return (
                <View 
                  key={booking.id}
                  className='rounded-2xl overflow-hidden'
                  style={[{backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border}, Shadows.medium]}
                >
                  {/* Status Header */}
                  <View 
                    className='px-4 py-3 flex-row items-center gap-2'
                    style={{backgroundColor: statusConfig.bgColor, borderBottomWidth: 1, borderBottomColor: statusConfig.borderColor}}
                  >
                    <StatusIcon size={18} color={statusConfig.color} />
                    <Text className='text-sm font-extrabold flex-1' style={{color: statusConfig.color}}>
                      {statusConfig.label}
                    </Text>
                    <Text className='text-xs font-medium' style={{color: statusConfig.color}}>
                      ID: #{booking.id}
                    </Text>
                  </View>

                  {/* Booking Details */}
                  <View className='p-4'>
                    {/* Vendor Info */}
                    <View className='mb-3'>
                      <View className='flex-row items-center gap-2 mb-1'>
                        <View 
                          className='w-2 h-2 rounded-full'
                          style={{backgroundColor: categoryColor}}
                        />
                        <Text className='text-xs font-bold uppercase' style={{color: Colors.textSecondary}}>
                          {booking.category}
                        </Text>
                      </View>
                      <Text className='text-xl font-extrabold' style={{color: Colors.textPrimary}}>
                        {booking.vendorName}
                      </Text>
                      <View className='flex-row items-center gap-1 mt-1'>
                        <MapPin size={14} color={Colors.textSecondary} />
                        <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>
                          {booking.vendorLocation}
                        </Text>
                      </View>
                    </View>

                    {/* Package Name */}
                    <View className='mb-3 px-3 py-2 rounded-lg' style={{backgroundColor: Colors.lightGray}}>
                      <Text className='text-sm font-extrabold' style={{color: Colors.textPrimary}}>
                        {booking.packageName}
                      </Text>
                    </View>

                    {/* Event Details Grid */}
                    <View className='gap-2 mb-3'>
                      <View className='flex-row items-center gap-2'>
                        <Calendar size={16} color={categoryColor} />
                        <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>
                          Date: <Text className='font-bold' style={{color: Colors.textPrimary}}>{formatDate(booking.date)}</Text>
                        </Text>
                      </View>
                      <View className='flex-row items-center gap-2'>
                        <Clock size={16} color={categoryColor} />
                        <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>
                          Time: <Text className='font-bold' style={{color: Colors.textPrimary}}>{booking.time}</Text>
                        </Text>
                      </View>
                      {booking.guestCount && (
                        <View className='flex-row items-center gap-2'>
                          <Users size={16} color={categoryColor} />
                          <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>
                            Guests: <Text className='font-bold' style={{color: Colors.textPrimary}}>{booking.guestCount}</Text>
                          </Text>
                        </View>
                      )}
                      {booking.location && (
                        <View className='flex-row items-start gap-2'>
                          <MapPin size={16} color={categoryColor} className='mt-0.5' />
                          <Text className='text-sm font-medium flex-1' style={{color: Colors.textSecondary}}>
                            Location: <Text className='font-bold' style={{color: Colors.textPrimary}}>{booking.location}</Text>
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Pricing */}
                    <View className='pt-3 mb-3' style={{borderTopWidth: 1, borderTopColor: Colors.border}}>
                      <View className='flex-row justify-between items-center mb-1'>
                        <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>Total Amount</Text>
                        <Text className='text-lg font-extrabold' style={{color: Colors.textPrimary}}>
                          PKR {booking.price.toLocaleString()}
                        </Text>
                      </View>
                      {booking.status !== 'rejected' && (
                        <View className='flex-row justify-between items-center'>
                          <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>Advance Payment (50%)</Text>
                          <Text className='text-base font-bold' style={{color: categoryColor}}>
                            PKR {booking.advancePayment.toLocaleString()}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Rejection Reason */}
                    {booking.status === 'rejected' && booking.rejectionReason && (
                      <View className='rounded-xl p-3 mb-3' style={{backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5'}}>
                        <Text className='text-xs font-bold mb-1' style={{color: Colors.error}}>REJECTION REASON</Text>
                        <Text className='text-sm font-medium leading-relaxed' style={{color: Colors.error}}>
                          {booking.rejectionReason}
                        </Text>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View className='gap-2'>
                      {booking.status === 'approved' && (
                        <Pressable 
                          className='py-4 rounded-xl flex-row items-center justify-center gap-2 active:opacity-85'
                          style={{backgroundColor: Colors.success}}
                          onPress={() => handlePayNow(booking)}
                        >
                          <CreditCard size={20} color={Colors.white} />
                          <Text className='font-extrabold text-base' style={{color: Colors.white}}>
                            Pay Now - PKR {booking.advancePayment.toLocaleString()}
                          </Text>
                        </Pressable>
                      )}
                      
                      {booking.status === 'rejected' && (
                        <Pressable 
                          className='py-4 rounded-xl active:opacity-80'
                          style={{backgroundColor: categoryColor}}
                          onPress={() => {
                            // Navigate back to vendor or rebooking flow
                            router.push('/screens/client/Component/VendorListView')
                          }}
                        >
                          <Text className='text-center font-extrabold text-base' style={{color: Colors.white}}>
                            Browse Other Vendors
                          </Text>
                        </Pressable>
                      )}

                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <View className='py-3 px-4 rounded-xl' style={{backgroundColor: Colors.lightGray}}>
                          <Text className='text-center text-sm font-medium' style={{color: Colors.textSecondary}}>
                            {booking.status === 'pending' 
                              ? 'Waiting for vendor approval...' 
                              : 'Your booking is confirmed!'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Booking Date Footer */}
                    <Text className='text-xs font-medium text-center mt-3 pt-3' style={{color: Colors.textTertiary, borderTopWidth: 1, borderTopColor: Colors.border}}>
                      Booked on {formatDate(booking.bookingDate)}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View className='flex-1 justify-end' style={{backgroundColor: Colors.overlay}}>
          <View className='rounded-t-3xl px-6 py-6' style={{backgroundColor: Colors.white, maxHeight: '85%'}}>
            {/* Header */}
            <View className='flex-row justify-between items-center mb-6 pb-4' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
              <Text className='text-2xl font-extrabold' style={{color: Colors.textPrimary}}>Payment</Text>
              <Pressable 
                className='rounded-full p-2 active:opacity-70'
                style={{backgroundColor: Colors.lightGray}}
                onPress={() => {
                  setShowPaymentModal(false)
                  setPaymentMethod(null)
                }}
              >
                <X color={Colors.textPrimary} size={24} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedBooking && (
                <>
                  {/* Booking Summary */}
                  <View className='rounded-2xl p-4 mb-6' style={{backgroundColor: Colors.lightGray}}>
                    <Text className='text-sm font-bold mb-2' style={{color: Colors.textSecondary}}>BOOKING SUMMARY</Text>
                    <Text className='text-lg font-extrabold mb-1' style={{color: Colors.textPrimary}}>
                      {selectedBooking.vendorName}
                    </Text>
                    <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>
                      {selectedBooking.packageName}
                    </Text>
                    <View className='flex-row justify-between items-center mt-4 pt-3' style={{borderTopWidth: 1, borderTopColor: Colors.border}}>
                      <Text className='text-base font-bold' style={{color: Colors.textPrimary}}>Advance Payment</Text>
                      <Text className='text-2xl font-extrabold' style={{color: Colors.success}}>
                        PKR {selectedBooking.advancePayment.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Payment Methods */}
                  <Text className='text-lg font-extrabold mb-4' style={{color: Colors.textPrimary}}>Select Payment Method</Text>
                  
                  <Pressable
                    className='rounded-2xl p-5 mb-3 flex-row items-center gap-4 active:opacity-80'
                    style={{
                      backgroundColor: paymentMethod === 'card' ? '#dcfce7' : Colors.white,
                      borderWidth: 2,
                      borderColor: paymentMethod === 'card' ? Colors.success : Colors.border
                    }}
                    onPress={() => setPaymentMethod('card')}
                  >
                    <CreditCard size={28} color={paymentMethod === 'card' ? Colors.success : Colors.textPrimary} />
                    <View className='flex-1'>
                      <Text className='text-base font-extrabold' style={{color: Colors.textPrimary}}>Credit/Debit Card</Text>
                      <Text className='text-sm font-medium mt-1' style={{color: Colors.textSecondary}}>Pay securely with your card</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    className='rounded-2xl p-5 mb-6 flex-row items-center gap-4 active:opacity-80'
                    style={{
                      backgroundColor: paymentMethod === 'bank' ? '#dcfce7' : Colors.white,
                      borderWidth: 2,
                      borderColor: paymentMethod === 'bank' ? Colors.success : Colors.border
                    }}
                    onPress={() => setPaymentMethod('bank')}
                  >
                    <View className='rounded-full p-2' style={{backgroundColor: paymentMethod === 'bank' ? Colors.success : Colors.lightGray}}>
                      <Text className='text-lg font-bold' style={{color: paymentMethod === 'bank' ? Colors.white : Colors.textPrimary}}>🏦</Text>
                    </View>
                    <View className='flex-1'>
                      <Text className='text-base font-extrabold' style={{color: Colors.textPrimary}}>Bank Transfer</Text>
                      <Text className='text-sm font-medium mt-1' style={{color: Colors.textSecondary}}>Transfer directly to vendor</Text>
                    </View>
                  </Pressable>

                  {/* Pay Button */}
                  <Pressable 
                    className='py-5 rounded-2xl mb-4 active:opacity-85'
                    disabled={!paymentMethod}
                    style={{backgroundColor: paymentMethod ? Colors.success : Colors.borderDark}}
                    onPress={processPayment}
                  >
                    <Text className='text-center font-extrabold text-lg' style={{color: Colors.white}}>
                      Confirm Payment
                    </Text>
                  </Pressable>

                  {/* Info */}
                  <View className='rounded-xl p-4' style={{backgroundColor: '#dbeafe'}}>
                    <Text className='text-sm leading-relaxed' style={{color: Colors.info}}>
                      💡 <Text className='font-bold'>Note:</Text> After payment, your booking will be confirmed. The remaining amount will be paid on the event day.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.background
  },
})
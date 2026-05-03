import { ScrollView, StyleSheet, Text, View, Pressable, Modal } from 'react-native'
import { useEffect, useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Clock, MapPin, Users, Calendar, CheckCircle, XCircle, AlertCircle, CreditCard, X } from 'lucide-react-native'
import { Colors, getCategoryColor, Shadows } from '@/app/_constants/theme'
import { ClientBookingItem, getMyBookings } from '@/app/_utils/bookingsApi'

type BookingStatus = 'pending' | 'approved' | 'rejected' | 'confirmed' | 'completed'

export default function BookingScreen() {
  const insets = useSafeAreaInsets()
  const [selectedFilter, setSelectedFilter] = useState<'all' | BookingStatus>('all')
  const [selectedBooking, setSelectedBooking] = useState<ClientBookingItem | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | null>(null)
  const [bookings, setBookings] = useState<ClientBookingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

    const loadBookings = useCallback(async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await getMyBookings()
        setBookings(response)
      } catch (apiError: any) {
        setError(apiError?.message || 'Failed to load bookings')
      } finally {
        setIsLoading(false)
      }
    }, [])

    useFocusEffect(
      useCallback(() => {
        loadBookings()
      }, [loadBookings])
    )

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

  const handlePayNow = (booking: ClientBookingItem) => {
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
      <View className='px-5 py-5' style={{borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white}}>
        <Text className='text-xl font-bold' style={{color: Colors.textPrimary}}>My Bookings</Text>
        <Text className='text-xs font-medium mt-0.5' style={{color: Colors.textSecondary}}>Track and manage your event bookings</Text>
      </View>

      <View className='px-5 py-3' style={{borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white}}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
        >
          {filters.map((filter) => (
            <Pressable
              key={filter.id}
              className='px-4 py-2 rounded-full mr-2 active:opacity-80'
              style={{
                backgroundColor: selectedFilter === filter.id ? Colors.primary : Colors.white,
                borderWidth: 1,
                borderColor: selectedFilter === filter.id ? Colors.primary : Colors.border
              }}
              onPress={() => setSelectedFilter(filter.id as any)}
            >
              <Text 
                className='text-sm font-bold'
                style={{color: selectedFilter === filter.id ? Colors.white : Colors.textSecondary}}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView className='flex-1' showsVerticalScrollIndicator={false} contentContainerStyle={{paddingVertical: 16}}>
        {isLoading && (
          <View className='px-5'>
            <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>Loading bookings...</Text>
          </View>
        )}
        {error && !isLoading && (
          <View className='px-5'>
            <Text className='text-sm font-medium' style={{color: Colors.error}}>{error}</Text>
          </View>
        )}
        {!isLoading && filteredBookings.length === 0 ? (
          <View className='flex-1 justify-center items-center py-20 px-8'>
            <View className='w-20 h-20 rounded-full items-center justify-center mb-4' style={{backgroundColor: Colors.lightGray}}>
              <Calendar size={32} color={Colors.textTertiary} />
            </View>
            <Text className='text-lg font-bold text-center' style={{color: Colors.textSecondary}}>No bookings found</Text>
            <Text className='text-sm font-medium mt-2 text-center' style={{color: Colors.textTertiary}}>
              {selectedFilter === 'all' 
                ? 'Start booking vendors for your event' 
                : `No ${selectedFilter} bookings at the moment`}
            </Text>
          </View>
        ) : (
          <View className='px-5 gap-4'>
            {filteredBookings.map((booking) => {
              const statusConfig = getStatusConfig(booking.status)
              const categoryColor = getCategoryColor(booking.category)
              const StatusIcon = statusConfig.icon

              return (
                <View 
                  key={booking.id}
                  className='rounded-2xl overflow-hidden'
                  style={[{backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border}, Shadows.small]}
                >
                  <View 
                    className='px-4 py-3 flex-row items-center gap-2'
                    style={{backgroundColor: statusConfig.bgColor + '40', borderBottomWidth: 1, borderBottomColor: statusConfig.borderColor + '40'}}
                  >
                    <StatusIcon size={16} color={statusConfig.color} />
                    <Text className='text-xs font-bold flex-1' style={{color: statusConfig.color}}>
                      {statusConfig.label}
                    </Text>
                    <Text className='text-[10px] font-bold' style={{color: Colors.textTertiary}}>
                      ID: #{booking.id}
                    </Text>
                  </View>

                  <View className='p-4'>
                    <View className='mb-3'>
                      <View className='flex-row items-center gap-2 mb-1'>
                        <View 
                          className='w-1.5 h-1.5 rounded-full'
                          style={{backgroundColor: categoryColor}}
                        />
                        <Text className='text-[10px] font-bold uppercase tracking-wider' style={{color: Colors.textSecondary}}>
                          {booking.category}
                        </Text>
                      </View>
                      <Text className='text-lg font-bold' style={{color: Colors.textPrimary}}>
                        {booking.vendorName}
                      </Text>
                      <View className='flex-row items-center gap-1 mt-1'>
                        <MapPin size={12} color={Colors.textSecondary} />
                        <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>
                          {booking.vendorLocation}
                        </Text>
                      </View>
                    </View>

                    <View className='mb-4 px-3 py-2.5 rounded-xl' style={{backgroundColor: Colors.lightGray, borderWidth: 1, borderColor: Colors.border}}>
                      <Text className='text-sm font-bold' style={{color: Colors.textPrimary}}>
                        {booking.packageName}
                      </Text>
                    </View>

                    <View className='gap-2.5 mb-4'>
                      <View className='flex-row items-center gap-2.5'>
                        <Calendar size={14} color={categoryColor} />
                        <Text className='text-xs font-semibold' style={{color: Colors.textSecondary}}>
                          Date: <Text className='font-bold' style={{color: Colors.textPrimary}}>{formatDate(booking.date)}</Text>
                        </Text>
                      </View>
                      <View className='flex-row items-center gap-2.5'>
                        <Clock size={14} color={categoryColor} />
                        <Text className='text-xs font-semibold' style={{color: Colors.textSecondary}}>
                          Time: <Text className='font-bold' style={{color: Colors.textPrimary}}>{booking.time}</Text>
                        </Text>
                      </View>
                      {booking.guestCount && (
                        <View className='flex-row items-center gap-2.5'>
                          <Users size={14} color={categoryColor} />
                          <Text className='text-xs font-semibold' style={{color: Colors.textSecondary}}>
                            Guests: <Text className='font-bold' style={{color: Colors.textPrimary}}>{booking.guestCount}</Text>
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className='pt-4 mb-4' style={{borderTopWidth: 1, borderTopColor: Colors.border, borderStyle: 'dashed'}}>
                      <View className='flex-row justify-between items-center mb-1.5'>
                        <Text className='text-xs font-semibold' style={{color: Colors.textSecondary}}>Total Amount</Text>
                        <Text className='text-base font-bold' style={{color: Colors.textPrimary}}>
                          PKR {booking.price.toLocaleString()}
                        </Text>
                      </View>
                      {booking.status !== 'rejected' && (
                        <View className='flex-row justify-between items-center'>
                          <Text className='text-xs font-semibold' style={{color: Colors.textSecondary}}>Advance Payment (50%)</Text>
                          <Text className='text-base font-bold' style={{color: categoryColor}}>
                            PKR {booking.advancePayment.toLocaleString()}
                          </Text>
                        </View>
                      )}
                    </View>

                    {booking.status === 'rejected' && booking.rejectionReason && (
                      <View className='rounded-xl p-3 mb-4' style={{backgroundColor: Colors.errorLight, borderWidth: 1, borderColor: Colors.error + '20'}}>
                        <Text className='text-[10px] font-bold mb-1 tracking-wider' style={{color: Colors.error}}>REJECTION REASON</Text>
                        <Text className='text-xs font-medium leading-relaxed' style={{color: Colors.error}}>
                          {booking.rejectionReason}
                        </Text>
                      </View>
                    )}

                    <View className='gap-2'>
                      {booking.status === 'approved' && (
                        <Pressable 
                          className='py-3.5 rounded-xl flex-row items-center justify-center gap-2 active:opacity-85'
                          style={{backgroundColor: Colors.success, ...Shadows.small}}
                          onPress={() => handlePayNow(booking)}
                        >
                          <CreditCard size={18} color={Colors.white} />
                          <Text className='font-bold text-sm' style={{color: Colors.white}}>
                            Pay Advance — PKR {booking.advancePayment.toLocaleString()}
                          </Text>
                        </Pressable>
                      )}
                      
                      {booking.status === 'rejected' && (
                        <Pressable 
                          className='py-3.5 rounded-xl active:opacity-80'
                          style={{backgroundColor: Colors.primary}}
                          onPress={() => {
                            router.push('/screens/client/Component/VendorListView')
                          }}
                        >
                          <Text className='text-center font-bold text-sm' style={{color: Colors.white}}>
                            Browse Other Vendors
                          </Text>
                        </Pressable>
                      )}

                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <View className='py-3 px-4 rounded-xl items-center justify-center' style={{backgroundColor: Colors.lightGray}}>
                          <Text className='text-xs font-bold' style={{color: Colors.textSecondary}}>
                            {booking.status === 'pending' 
                              ? 'Waiting for Vendor' 
                              : 'Booking Confirmed'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text className='text-[10px] font-medium text-center mt-4' style={{color: Colors.textTertiary}}>
                      Booked on {formatDate(booking.bookingDate)}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View className='flex-1 justify-end' style={{backgroundColor: Colors.overlay}}>
          <View className='rounded-t-3xl px-6 py-6' style={{backgroundColor: Colors.white, maxHeight: '85%'}}>
            <View className='flex-row justify-between items-center mb-6 pb-4' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
              <Text className='text-xl font-bold' style={{color: Colors.textPrimary}}>Secure Payment</Text>
              <Pressable 
                className='rounded-full p-1.5 active:opacity-70'
                style={{backgroundColor: Colors.lightGray}}
                onPress={() => {
                  setShowPaymentModal(false)
                  setPaymentMethod(null)
                }}
              >
                <X color={Colors.textPrimary} size={20} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedBooking && (
                <>
                  <View className='rounded-2xl p-4 mb-6' style={{backgroundColor: Colors.lightGray, borderWidth: 1, borderColor: Colors.border}}>
                    <Text className='text-[10px] font-bold mb-2 tracking-widest' style={{color: Colors.textSecondary}}>SUMMARY</Text>
                    <Text className='text-base font-bold mb-1' style={{color: Colors.textPrimary}}>
                      {selectedBooking.vendorName}
                    </Text>
                    <Text className='text-xs font-semibold' style={{color: Colors.textSecondary}}>
                      {selectedBooking.packageName}
                    </Text>
                    <View className='flex-row justify-between items-center mt-4 pt-3' style={{borderTopWidth: 1, borderTopColor: Colors.border, borderStyle: 'dashed'}}>
                      <Text className='text-sm font-bold' style={{color: Colors.textPrimary}}>Advance Due</Text>
                      <Text className='text-xl font-bold' style={{color: Colors.success}}>
                        PKR {selectedBooking.advancePayment.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <Text className='text-sm font-bold mb-4' style={{color: Colors.textPrimary}}>Payment Method</Text>
                  
                  <Pressable
                    className='rounded-2xl p-4 mb-3 flex-row items-center gap-4 active:opacity-80'
                    style={{
                      backgroundColor: paymentMethod === 'card' ? Colors.successLight : Colors.white,
                      borderWidth: 1,
                      borderColor: paymentMethod === 'card' ? Colors.success : Colors.border
                    }}
                    onPress={() => setPaymentMethod('card')}
                  >
                    <View className='w-12 h-12 rounded-xl items-center justify-center' style={{backgroundColor: paymentMethod === 'card' ? Colors.white : Colors.lightGray}}>
                      <CreditCard size={24} color={paymentMethod === 'card' ? Colors.success : Colors.textPrimary} />
                    </View>
                    <View className='flex-1'>
                      <Text className='text-sm font-bold' style={{color: Colors.textPrimary}}>Credit / Debit Card</Text>
                      <Text className='text-xs font-medium mt-0.5' style={{color: Colors.textSecondary}}>Visa, Mastercard, PayPak</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    className='rounded-2xl p-4 mb-8 flex-row items-center gap-4 active:opacity-80'
                    style={{
                      backgroundColor: paymentMethod === 'bank' ? Colors.successLight : Colors.white,
                      borderWidth: 1,
                      borderColor: paymentMethod === 'bank' ? Colors.success : Colors.border
                    }}
                    onPress={() => setPaymentMethod('bank')}
                  >
                    <View className='w-12 h-12 rounded-xl items-center justify-center' style={{backgroundColor: paymentMethod === 'bank' ? Colors.white : Colors.lightGray}}>
                      <Text className='text-lg font-bold'>🏦</Text>
                    </View>
                    <View className='flex-1'>
                      <Text className='text-sm font-bold' style={{color: Colors.textPrimary}}>Direct Bank Transfer</Text>
                      <Text className='text-xs font-medium mt-0.5' style={{color: Colors.textSecondary}}>Secure IBAN transfer</Text>
                    </View>
                  </Pressable>

                  <Pressable 
                    className='py-4 rounded-xl mb-4 active:opacity-85 shadow-sm'
                    disabled={!paymentMethod}
                    style={{backgroundColor: paymentMethod ? Colors.primary : Colors.borderDark}}
                    onPress={processPayment}
                  >
                    <Text className='text-center font-bold text-base' style={{color: Colors.white}}>
                      Confirm Payment
                    </Text>
                  </Pressable>

                  <View className='rounded-xl p-4' style={{backgroundColor: Colors.infoLight + '50', borderWidth: 1, borderColor: Colors.info + '10'}}>
                    <Text className='text-xs leading-relaxed text-center' style={{color: Colors.info}}>
                      Payments are secured and encrypted. Remaining balance is payable on event day.
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
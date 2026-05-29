import { ScrollView, StyleSheet, Text, View, Pressable, TextInput } from 'react-native'
import { useEffect, useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Clock, MapPin, Users, Calendar, CheckCircle, XCircle, AlertCircle, Star } from 'lucide-react-native'
import { ClientBookingItem, getMyBookings } from '@/app/_utils/bookingsApi'
import { createReview } from '@/app/_utils/reviewsApi'
import { useUser } from '@/app/_context/UserContext'
import { useLanguage } from '@/app/_context/LanguageContext'
import { Colors, Shadows, getCategoryColor } from '@/app/_constants/theme'

type BookingStatus = 'pending' | 'approved' | 'rejected' | 'confirmed' | 'completed'

export default function BookingScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useUser()
  const { t } = useLanguage()
  const [selectedFilter, setSelectedFilter] = useState<'all' | BookingStatus>('all')
  
  const [bookings, setBookings] = useState<ClientBookingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<ClientBookingItem | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

    const loadBookings = useCallback(async () => {
      if (user?.isGuest) {
        setBookings([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const response = await getMyBookings()
        setBookings(response)
      } catch (apiError: any) {
        setError(apiError?.message || t('loadingBookings'))
      } finally {
        setIsLoading(false)
      }
    }, [user?.isGuest])

    useFocusEffect(
      useCallback(() => {
        loadBookings()
      }, [loadBookings])
    )

  const getStatusConfig = (status: BookingStatus) => {
    switch(status) {
      case 'pending':
        return {
          label: t('pending') + ' Approval',
          icon: AlertCircle,
          color: Colors.warning,
          bgColor: '#fef3c7',
          borderColor: '#fcd34d'
        }
      case 'approved':
        return {
          label: 'Approved - Token Request in Chat',
          icon: CheckCircle,
          color: Colors.success,
          bgColor: '#dcfce7',
          borderColor: '#86efac'
        }
      case 'rejected':
        return {
          label: t('rejected'),
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

  const submitReview = async () => {
    if (!selectedBookingForReview) return
    try {
      setIsSubmittingReview(true)
      await createReview(String(selectedBookingForReview.id), rating, comment)
      alert('Review submitted successfully!')
      setReviewModalVisible(false)
      setComment('')
      setRating(5)
      // Optionally reload bookings if you want to disable the review button next time
    } catch (err: any) {
      alert(err.message || 'Failed to submit review.')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  

  const filters = [
    { id: 'all', label: t('all') },
    { id: 'pending', label: t('pending') },
    { id: 'approved', label: 'Approved' },
    { id: 'confirmed', label: 'Confirmed' },
  ]

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      {user?.isGuest ? (
        <View className='px-5 py-5' style={{borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white}}>
          <Text className='text-xl font-bold' style={{color: Colors.textPrimary}}>{t('bookingsLocked')}</Text>
          <Text className='text-xs font-medium mt-0.5' style={{color: Colors.textSecondary}}>{t('signInToViewBookings')}</Text>
          <Pressable
            className='mt-4 py-3 rounded-xl active:opacity-85'
            style={{backgroundColor: Colors.primary}}
            onPress={() => router.push('/screens/client/Component/LoginScreen')}
          >
            <Text className='text-center font-bold text-sm' style={{color: Colors.white}}>Sign In</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View className='px-5 py-5' style={{borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white}}>
            <Text className='text-xl font-bold' style={{color: Colors.textPrimary}}>{t('myBookingsTitle')}</Text>
            <Text className='text-xs font-medium mt-0.5' style={{color: Colors.textSecondary}}>{t('trackBookings')}</Text>
          </View>

          <View className='px-5 py-3' style={{borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white}}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
            >
              {filters.map((filter) => (
                <Pressable
                  key={filter.id}
                  style={{
                    backgroundColor: selectedFilter === filter.id ? Colors.primary : Colors.white,
                    borderWidth: 1,
                    borderColor: selectedFilter === filter.id ? Colors.primary : Colors.border,
                    borderRadius: 4,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    marginRight: 8,
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
        </>
      )}

      <ScrollView className='flex-1' showsVerticalScrollIndicator={false} contentContainerStyle={{paddingVertical: 16}}>
        {user?.isGuest && (
          <View className='px-5 mb-4'>
            <View className='rounded-2xl p-5' style={{backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, ...Shadows.small}}>
              <Text className='text-lg font-bold text-center' style={{color: Colors.textPrimary}}>{t('youAreGuest')}</Text>
              <Text className='text-sm font-medium text-center mt-2' style={{color: Colors.textSecondary}}>
                {t('bookingHistoryAfterSignIn')}
              </Text>
            </View>
          </View>
        )}
        {isLoading && (
          <View className='px-5'>
            <Text className='text-sm font-medium' style={{color: Colors.textSecondary}}>{t('loadingBookings')}</Text>
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
            <Text className='text-lg font-bold text-center' style={{color: Colors.textSecondary}}>{t('noBookingsFound')}</Text>
            <Text className='text-sm font-medium mt-2 text-center' style={{color: Colors.textTertiary}}>
              {selectedFilter === 'all' 
                ? t('startBooking') 
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
                  style={[{backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 4}]}
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

                    <View className='gap-2 mb-4'>
                      <View className='flex-row items-center gap-2'>
                        <Calendar size={14} color={categoryColor} />
                        <Text className='text-xs font-semibold' style={{color: Colors.textSecondary}}>
                          Date: <Text className='font-bold' style={{color: Colors.textPrimary}}>{formatDate(booking.date)}</Text>
                        </Text>
                      </View>
                      <View className='flex-row items-center gap-2'>
                        <Clock size={14} color={categoryColor} />
                        <Text className='text-xs font-semibold' style={{color: Colors.textSecondary}}>
                          Time: <Text className='font-bold' style={{color: Colors.textPrimary}}>{booking.time}</Text>
                        </Text>
                      </View>
                      {booking.guestCount && (
                        <View className='flex-row items-center gap-2'>
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
                      <View className='rounded-xl p-3 mt-2' style={{backgroundColor: Colors.infoLight + '40', borderWidth: 1, borderColor: Colors.info + '15'}}>
                        <Text className='text-xs font-bold mb-1' style={{color: Colors.info}}>TOKEN PAYMENT IN CHAT</Text>
                        <Text className='text-xs font-medium leading-relaxed' style={{color: Colors.textSecondary}}>
                          Vendor will request a 5% to 10% token payment in chat. Send the screenshot or photo proof there for confirmation.
                        </Text>
                      </View>
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

                      {(booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'completed') && (
                        <View className='py-3 px-4 rounded-xl items-center justify-center' style={{backgroundColor: Colors.lightGray}}>
                          <Text className='text-xs font-bold' style={{color: Colors.textSecondary}}>
                            {booking.status === 'pending' 
                              ? 'Waiting for Vendor' 
                              : booking.status === 'confirmed' ? 'Booking Confirmed' : 'Booking Completed'}
                          </Text>
                        </View>
                      )}

                      {(booking.status === 'confirmed' || booking.status === 'completed') && (
                        <Pressable 
                          className='py-3.5 mt-2 rounded-xl active:opacity-80'
                          style={{backgroundColor: Colors.primary}}
                          onPress={() => {
                            setSelectedBookingForReview(booking)
                            setReviewModalVisible(true)
                          }}
                        >
                          <Text className='text-center font-bold text-sm' style={{color: Colors.white}}>
                            Leave a Review
                          </Text>
                        </Pressable>
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

      {/* Review Modal */}
      {reviewModalVisible && (
        <View className='absolute w-full h-full justify-center items-center px-5' style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50}}>
          <View style={{backgroundColor: Colors.white, borderRadius: 4, padding: 24, width: '100%'}}>
            <Text className='text-xl font-extrabold mb-4' style={{color: Colors.textPrimary}}>Rate your experience</Text>
            
            <View className='flex-row justify-center mb-6 gap-2'>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setRating(star)}>
                  <Star 
                    size={36} 
                    color={star <= rating ? Colors.rating : Colors.borderDark} 
                    fill={star <= rating ? Colors.rating : 'transparent'} 
                  />
                </Pressable>
              ))}
            </View>

            <View className='rounded-xl px-4 py-3 mb-6' style={{backgroundColor: Colors.lightGray, borderWidth: 1, borderColor: Colors.border}}>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder='Write your review (optional)...'
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={4}
                className='text-base text-black'
                style={{minHeight: 80, textAlignVertical: 'top'}}
              />
            </View>

            <View className='flex-row gap-3'>
              <Pressable 
                className='flex-1 py-3 rounded-xl active:opacity-80'
                style={{backgroundColor: Colors.lightGray}}
                onPress={() => setReviewModalVisible(false)}
              >
                <Text className='text-center font-bold text-sm' style={{color: Colors.textPrimary}}>Cancel</Text>
              </Pressable>
              <Pressable 
                className='flex-1 py-3 rounded-xl active:opacity-80 justify-center items-center'
                style={{backgroundColor: isSubmittingReview ? Colors.borderDark : Colors.primary}}
                onPress={submitReview}
                disabled={isSubmittingReview}
              >
                <Text className='text-center font-bold text-sm' style={{color: Colors.white}}>
                  {isSubmittingReview ? 'Submitting...' : 'Submit'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      
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
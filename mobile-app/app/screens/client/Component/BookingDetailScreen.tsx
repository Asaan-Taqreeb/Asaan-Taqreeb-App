import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, MapPin, Phone, MessageSquare, Info, CreditCard, DollarSign, Star } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';
import StatusStepper from '@/app/_components/StatusStepper';
import { useUser } from '@/app/_context/UserContext';
import RatingModal from './RatingModal';
import { createReview } from '@/app/_utils/reviewsApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelBooking } from '@/app/_utils/bookingsApi';

export default function BookingDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { user } = useUser();

  const buildChatId = (firstUserId: string | number, secondUserId: string | number) => {
    const first = String(firstUserId)
    const second = String(secondUserId)
    return first.localeCompare(second) <= 0 ? `chat_${first}_${second}` : `chat_${second}_${first}`
  }
  
  const booking = params.booking 
    ? JSON.parse(
        params.booking.toString().startsWith('{') 
          ? params.booking as string 
          : decodeURIComponent(params.booking as string)
      ) 
    : null;

  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [ratedBookings, setRatedBookings] = useState<Record<string, {rating: number, comment: string}>>({});

  useEffect(() => {
    loadRatedBookings();
  }, []);

  const loadRatedBookings = async () => {
    try {
      const saved = await AsyncStorage.getItem('client_rated_bookings');
      if (saved) {
        setRatedBookings(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Failed to load ratings:', error);
    }
  };

  const onRatingSubmit = async (rating: number, comment: string) => {
    if (!booking) return;
    
    try {
      await createReview(String(booking.id), rating, comment);
      const newRated = {
        ...ratedBookings,
        [booking.id]: { rating, comment }
      };
      setRatedBookings(newRated);
      await AsyncStorage.setItem('client_rated_bookings', JSON.stringify(newRated));
      Alert.alert('Success', 'Your review has been submitted successfully.');
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      Alert.alert('Error', error.message || 'Failed to submit review. Please try again.');
    }
  };

  const handleCancelBooking = () => {
    if (Platform.OS === 'web') {
      const confirmCancel = window.confirm('Are you sure you want to cancel this booking request?');
      if (confirmCancel) {
        (async () => {
          try {
            await cancelBooking(booking.id);
            window.alert('Your booking request has been successfully cancelled.');
            router.back();
          } catch (error: any) {
            console.error('Failed to cancel booking:', error);
            window.alert(error.message || 'Failed to cancel booking. Please try again.');
          }
        })();
      }
      return;
    }

    Alert.alert(
      'Cancel Booking Request',
      'Are you sure you want to cancel this booking request?',
      [
        { text: 'No, Keep Request', style: 'cancel' },
        {
          text: 'Yes, Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking(booking.id);
              Alert.alert('Cancelled', 'Your booking request has been successfully cancelled.', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error: any) {
              console.error('Failed to cancel booking:', error);
              Alert.alert('Error', error.message || 'Failed to cancel booking. Please try again.');
            }
          }
        }
      ]
    );
  };

  if (!booking) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>Booking details not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-6 py-2 bg-blue-500 rounded-xl">
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-100 flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: Colors.primary + '15' }}
        >
          <ArrowLeft size={22} color={Colors.primary} />
        </TouchableOpacity>
        <View>
          <Text className="text-lg font-bold" style={{ color: Colors.textPrimary }}>Booking Details</Text>
          <Text className="text-xs font-medium text-gray-400">Order #{booking.id.toString().slice(-6).toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Status Tracker */}
        <View className="bg-white mx-5 mt-6 p-6 rounded-3xl" style={Shadows.small}>
          <Text className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest text-center">Current Progress</Text>
          <StatusStepper status={booking.status} />
        </View>

        {/* Vendor Info */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-3xl" style={Shadows.small}>
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-2xl bg-gray-100 items-center justify-center">
              <Info size={32} color={Colors.primary} />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-xl font-bold" style={{ color: Colors.textPrimary }}>{booking.vendorName}</Text>
              <Text className="text-sm font-medium text-gray-400 uppercase tracking-tighter">{booking.category}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => {
                if (user?.isGuest) {
                  if (Platform.OS === 'web') {
                    const shouldSignIn = window.confirm('Guest Mode: Sign in to chat with vendors. Click OK to sign in.')
                    if (shouldSignIn) {
                      router.push('/screens/client/Component/LoginScreen')
                    }
                  } else {
                    Alert.alert('Guest Mode', 'Sign in to chat with vendors.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Sign In', onPress: () => router.push('/screens/client/Component/LoginScreen') },
                    ])
                  }
                  return
                }

                const chatVendorObj = {
                  userId: booking.vendorId,
                  name: booking.vendorName
                };
                router.push({
                  pathname: '/screens/client/Component/VendorChatScreen',
                  params: { 
                    chatId: user?.id ? buildChatId(user.id, booking.vendorId) : undefined,
                    vendor: encodeURIComponent(JSON.stringify(chatVendorObj))
                  }
                })
              }}
              className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center"
            >
              <MessageSquare size={20} color={Colors.info} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Booking Info */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-3xl" style={Shadows.small}>
          <Text className="text-sm font-bold mb-4" style={{ color: Colors.textPrimary }}>Event Information</Text>
          
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: Colors.primaryMuted }}>
              <Calendar size={18} color={Colors.primary} />
            </View>
            <View>
              <Text className="text-xs text-gray-400 font-bold uppercase">Date</Text>
              <Text className="text-sm font-bold" style={{ color: Colors.textPrimary }}>{booking.date}</Text>
            </View>
          </View>

          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
              <Clock size={18} color={Colors.info} />
            </View>
            <View>
              <Text className="text-xs text-gray-400 font-bold uppercase">Time Slot</Text>
              <Text className="text-sm font-bold" style={{ color: Colors.textPrimary }}>{booking.time}</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-teal-50 items-center justify-center mr-3">
              <MapPin size={18} color={Colors.vendor} />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-400 font-bold uppercase">Location</Text>
              <Text className="text-sm font-bold" style={{ color: Colors.textPrimary }} numberOfLines={1}>
                {booking.vendorLocation || 'Standard venue address'}
              </Text>
            </View>
          </View>
        </View>

        {/* Booking & Price */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-3xl" style={Shadows.small}>
          <Text className="text-sm font-bold mb-4" style={{ color: Colors.textPrimary }}>Booking Summary</Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-500 font-medium">{booking.packageName}</Text>
            <Text className="text-sm font-bold text-gray-700">PKR {booking.price.toLocaleString()}</Text>
          </View>
          
          <View className="flex-row justify-between mb-4 pb-4 border-b border-gray-50">
            <Text className="text-sm text-gray-500 font-medium">Booking Service Fee</Text>
            <Text className="text-sm font-bold text-gray-700">PKR 500</Text>
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <DollarSign size={18} color={Colors.primary} />
              <Text className="text-base font-bold ml-1" style={{ color: Colors.textPrimary }}>Total Amount</Text>
            </View>
            <Text className="text-2xl font-black" style={{ color: Colors.primary }}>
              PKR {(booking.price + 500).toLocaleString()}
            </Text>
          </View>

          <View className="mt-4 p-3 bg-teal-50 rounded-xl flex-row items-center">
            <CreditCard size={16} color={Colors.vendor} />
            <Text className="text-xs font-bold ml-2" style={{ color: Colors.vendor }}>Payment is coordinated directly in chat by the vendor</Text>
          </View>

          {/* Payment breakdown */}
          {booking.status !== 'rejected' && booking.status !== 'cancelled' && (
            <>
              <View className="h-px bg-gray-100 my-4" />
              <Text className="text-xs font-semibold text-gray-400 mb-3 tracking-wider uppercase">Payment Status</Text>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-500 font-medium">Paid So Far (Token)</Text>
                <Text className="text-sm font-bold text-emerald-600">PKR {Number(booking.paidAmount || 0).toLocaleString()}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500 font-medium">Remaining Balance</Text>
                <Text className="text-sm font-bold text-amber-600">
                  PKR {Math.max(0, (booking.price + 500) - Number(booking.paidAmount || 0)).toLocaleString()}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Special Requests */}
        {!!booking.specialRequests && (
          <View className="bg-white mx-5 mt-4 p-5 rounded-3xl" style={Shadows.small}>
            <Text className="text-sm font-bold mb-2" style={{ color: Colors.textPrimary }}>Special Requests</Text>
            <Text className="text-sm text-gray-600 leading-5">{booking.specialRequests}</Text>
          </View>
        )}

        {/* Cancel Booking Section */}
        {booking.status === 'pending' && (
          <View className="bg-white mx-5 mt-4 p-5 rounded-3xl" style={Shadows.small}>
            <Text className="text-sm font-bold mb-3" style={{ color: Colors.textPrimary }}>Manage Booking</Text>
            <TouchableOpacity 
              onPress={handleCancelBooking}
              className="py-3.5 rounded-2xl items-center"
              style={{ backgroundColor: Colors.error }}
            >
              <Text className="text-white font-bold text-sm">Cancel Booking Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Review / Rating Section */}
        {(booking.status === 'completed' || booking.status === 'confirmed') && (
          <View className="bg-white mx-5 mt-4 p-5 rounded-3xl" style={Shadows.small}>
            <Text className="text-sm font-bold mb-3" style={{ color: Colors.textPrimary }}>Your Review</Text>
            {ratedBookings[booking.id] ? (
              <View className="bg-yellow-50/50 border border-yellow-100 p-4 rounded-2xl">
                <View className="flex-row items-center mb-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={16} 
                      color={star <= ratedBookings[booking.id].rating ? "#FCD34D" : Colors.border} 
                      fill={star <= ratedBookings[booking.id].rating ? "#FCD34D" : "transparent"} 
                    />
                  ))}
                  <Text className="text-xs font-extrabold ml-2" style={{ color: "#F59E0B" }}>
                    {ratedBookings[booking.id].rating}.0 / 5.0
                  </Text>
                </View>
                {ratedBookings[booking.id].comment ? (
                  <Text className="text-xs font-medium text-gray-500 italic mt-1">
                    &quot;{ratedBookings[booking.id].comment}&quot;
                  </Text>
                ) : null}
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => setIsRatingModalVisible(true)}
                className="py-3.5 rounded-2xl items-center"
                style={{ backgroundColor: Colors.primary }}
              >
                <Text className="text-white font-bold text-sm">Rate Experience</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Support Link */}
        <TouchableOpacity 
          className="mx-5 mt-8 p-4 bg-gray-50 rounded-2xl items-center"
          onPress={() => Alert.alert('Help', 'Contact us at asaantaqreebhelpline@outlook.com')}
        >
          <Text className="text-xs font-bold text-gray-400">HAVE AN ISSUE WITH THIS BOOKING?</Text>
        </TouchableOpacity>
      </ScrollView>

      <RatingModal
        isVisible={isRatingModalVisible}
        onClose={() => setIsRatingModalVisible(false)}
        vendorName={booking.vendorName}
        onConfirm={onRatingSubmit}
      />
    </View>
  );
}

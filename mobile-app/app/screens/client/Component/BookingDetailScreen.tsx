import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, MapPin, Phone, MessageSquare, Info, CreditCard, DollarSign } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';
import StatusStepper from '@/app/_components/StatusStepper';

export default function BookingDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const booking = params.booking ? JSON.parse(params.booking as string) : null;

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
              onPress={() => router.push({
                pathname: '/screens/client/Component/VendorChatScreen',
                params: { vendorId: booking.vendorId, vendorName: booking.vendorName }
              })}
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

        {/* Package & Price */}
        <View className="bg-white mx-5 mt-4 p-5 rounded-3xl" style={Shadows.small}>
          <Text className="text-sm font-bold mb-4" style={{ color: Colors.textPrimary }}>Payment Details</Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-500 font-medium">{booking.packageName}</Text>
            <Text className="text-sm font-bold text-gray-700">PKR {booking.price.toLocaleString()}</Text>
          </View>
          
          <View className="flex-row justify-between mb-4 pb-4 border-b border-gray-50">
            <Text className="text-sm text-gray-500 font-medium">Service Fee</Text>
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
            <Text className="text-xs font-bold ml-2" style={{ color: Colors.vendor }}>Payment Method: Cash at Venue</Text>
          </View>
        </View>

        {/* Special Requests */}
        {booking.specialRequests && (
          <View className="bg-white mx-5 mt-4 p-5 rounded-3xl" style={Shadows.small}>
            <Text className="text-sm font-bold mb-2" style={{ color: Colors.textPrimary }}>Special Requests</Text>
            <Text className="text-sm text-gray-600 leading-5">{booking.specialRequests}</Text>
          </View>
        )}

        {/* Support Link */}
        <TouchableOpacity 
          className="mx-5 mt-8 p-4 bg-gray-50 rounded-2xl items-center"
          onPress={() => Alert.alert('Help', 'Contact us at support@asaantaqreeb.com')}
        >
          <Text className="text-xs font-bold text-gray-400">HAVE AN ISSUE WITH THIS BOOKING?</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

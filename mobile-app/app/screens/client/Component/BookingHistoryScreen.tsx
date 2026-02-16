import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle, XCircle, HourglassIcon } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';

// Mock booking data
const mockBookings = [
  {
    id: '1',
    vendorName: 'Royal Banquet Hall',
    vendorImage: 'https://i.pravatar.cc/150?img=60',
    serviceType: 'Banquet Hall',
    packageName: 'Premium Wedding Package',
    amount: 190000,
    eventDate: '2026-03-15',
    eventTime: '6:00 PM',
    location: 'Gulberg, Lahore',
    status: 'confirmed',
    bookingDate: '2026-02-10',
  },
  {
    id: '2',
    vendorName: 'Elite Catering Services',
    vendorImage: 'https://i.pravatar.cc/150?img=45',
    serviceType: 'Catering',
    packageName: 'Deluxe Catering Package',
    amount: 117000,
    eventDate: '2026-03-15',
    eventTime: '7:00 PM',
    location: 'Gulberg, Lahore',
    status: 'pending',
    bookingDate: '2026-02-12',
  },
  {
    id: '3',
    vendorName: 'Perfect Moments Photography',
    vendorImage: 'https://i.pravatar.cc/150?img=33',
    serviceType: 'Photography',
    packageName: 'Complete Wedding Coverage',
    amount: 155000,
    eventDate: '2026-03-15',
    eventTime: '3:00 PM',
    location: 'Gulberg, Lahore',
    status: 'confirmed',
    bookingDate: '2026-02-08',
  },
  {
    id: '4',
    vendorName: 'Glamour Beauty Parlor',
    vendorImage: 'https://i.pravatar.cc/150?img=28',
    serviceType: 'Parlor',
    packageName: 'Bridal Beauty Package',
    amount: 65000,
    eventDate: '2026-03-14',
    eventTime: '9:00 AM',
    location: 'Model Town, Lahore',
    status: 'confirmed',
    bookingDate: '2026-02-05',
  },
  {
    id: '5',
    vendorName: 'Grand Palace Hall',
    vendorImage: 'https://i.pravatar.cc/150?img=51',
    serviceType: 'Banquet Hall',
    packageName: 'Standard Hall Booking',
    amount: 80000,
    eventDate: '2026-02-20',
    eventTime: '5:00 PM',
    location: 'DHA, Lahore',
    status: 'cancelled',
    bookingDate: '2026-01-15',
  },
];

export default function BookingHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const getFilteredBookings = () => {
    if (selectedFilter === 'all') return mockBookings;
    return mockBookings.filter(booking => booking.status === selectedFilter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return CheckCircle;
      case 'pending':
        return HourglassIcon;
      case 'cancelled':
        return XCircle;
      default:
        return HourglassIcon;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const FilterButton = ({ label, value }: { label: string; value: string }) => {
    const isActive = selectedFilter === value;
    return (
      <TouchableOpacity
        onPress={() => setSelectedFilter(value)}
        className="px-4 py-2 rounded-full mr-2"
        style={{
          backgroundColor: isActive ? Colors.primary : '#F3F4F6',
        }}
      >
        <Text
          className="text-sm font-semibold"
          style={{
            color: isActive ? '#FFFFFF' : '#6B7280',
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{ backgroundColor: Colors.primary + '15' }}
          >
            <ArrowLeft size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold" style={{ color: Colors.textPrimary }}>
            My Bookings
          </Text>
          <View className="w-11" />
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          <FilterButton label="All" value="all" />
          <FilterButton label="Confirmed" value="confirmed" />
          <FilterButton label="Pending" value="pending" />
          <FilterButton label="Cancelled" value="cancelled" />
        </ScrollView>
      </View>

      {/* Bookings List */}
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
      >
        {getFilteredBookings().map((booking) => {
          const StatusIcon = getStatusIcon(booking.status);
          return (
            <TouchableOpacity
              key={booking.id}
              className="bg-white rounded-2xl p-4 mb-4"
              style={Shadows.small}
              activeOpacity={0.7}
              onPress={() => {
                // Navigate to booking detail
              }}
            >
              {/* Header */}
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-row items-start flex-1">
                  <Image
                    source={{ uri: booking.vendorImage }}
                    className="w-12 h-12 rounded-full"
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-bold" style={{ color: Colors.textPrimary }}>
                      {booking.vendorName}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-0.5">
                      {booking.serviceType}
                    </Text>
                  </View>
                </View>
                <View
                  className="px-3 py-1 rounded-full flex-row items-center"
                  style={{ backgroundColor: getStatusColor(booking.status) + '20' }}
                >
                  <StatusIcon size={14} color={getStatusColor(booking.status)} />
                  <Text
                    className="text-xs font-semibold ml-1"
                    style={{ color: getStatusColor(booking.status) }}
                  >
                    {getStatusText(booking.status)}
                  </Text>
                </View>
              </View>

              {/* Package Info */}
              <View className="bg-gray-50 rounded-xl p-3 mb-3">
                <Text className="text-sm font-semibold mb-2" style={{ color: Colors.textPrimary }}>
                  {booking.packageName}
                </Text>
                <View className="flex-row items-center mb-1.5">
                  <Calendar size={14} color="#6B7280" />
                  <Text className="text-xs text-gray-600 ml-2">
                    {booking.eventDate}
                  </Text>
                </View>
                <View className="flex-row items-center mb-1.5">
                  <Clock size={14} color="#6B7280" />
                  <Text className="text-xs text-gray-600 ml-2">
                    {booking.eventTime}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MapPin size={14} color="#6B7280" />
                  <Text className="text-xs text-gray-600 ml-2">
                    {booking.location}
                  </Text>
                </View>
              </View>

              {/* Amount */}
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-500">
                  Booked on {booking.bookingDate}
                </Text>
                <Text className="text-lg font-bold" style={{ color: Colors.primary }}>
                  PKR {booking.amount.toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {getFilteredBookings().length === 0 && (
          <View className="items-center justify-center py-20">
            <Calendar size={48} color="#D1D5DB" />
            <Text className="text-gray-400 text-base mt-4">No bookings found</Text>
            <Text className="text-gray-400 text-sm mt-2">
              Try changing the filter
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

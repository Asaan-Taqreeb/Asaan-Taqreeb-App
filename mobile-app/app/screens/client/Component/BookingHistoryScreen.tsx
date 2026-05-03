import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle, XCircle, HourglassIcon, Info } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';
import { getMyBookings, ClientBookingItem } from '@/app/_utils/bookingsApi';
import RatingModal from './RatingModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Star } from 'lucide-react-native';

export default function BookingHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [bookings, setBookings] = useState<ClientBookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<ClientBookingItem | null>(null);
  const [ratedBookings, setRatedBookings] = useState<Record<string, {rating: number, comment: string}>>({});

  useEffect(() => {
    fetchBookings();
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

  const handleRateBooking = (booking: ClientBookingItem) => {
    setSelectedBooking(booking);
    setIsRatingModalVisible(true);
  };

  const onRatingSubmit = async (rating: number, comment: string) => {
    if (!selectedBooking) return;
    
    const newRated = {
      ...ratedBookings,
      [selectedBooking.id]: { rating, comment }
    };
    
    setRatedBookings(newRated);
    try {
      await AsyncStorage.setItem('client_rated_bookings', JSON.stringify(newRated));
    } catch (error) {
      console.log('Failed to save rating:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const data = await getMyBookings();
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBookings();
  };

  const getFilteredBookings = () => {
    if (selectedFilter === 'all') return bookings;
    return bookings.filter(booking => {
        if (selectedFilter === 'confirmed') return booking.status === 'confirmed' || booking.status === 'approved';
        return booking.status === selectedFilter;
    });
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
      {isLoading && !isRefreshing ? (
          <View className="flex-1 justify-center items-center">
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text className="mt-4 font-bold text-gray-400">Loading your bookings...</Text>
          </View>
      ) : (
        <ScrollView
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
            refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
            }
        >
            {getFilteredBookings().map((booking) => {
            const StatusIcon = getStatusIcon(booking.status);
            return (
                <TouchableOpacity
                key={booking.id}
                className="bg-white rounded-2xl p-4 mb-4"
                style={Shadows.small}
                activeOpacity={0.7}
                onPress={() => router.push({
                    pathname: '/screens/client/Component/BookingDetailScreen',
                    params: { booking: JSON.stringify(booking) }
                })}
                >
                {/* Header */}
                <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-start flex-1">
                        <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center">
                            <Info size={24} color={Colors.primary} />
                        </View>
                    <View className="ml-3 flex-1">
                        <Text className="text-base font-bold" style={{ color: Colors.textPrimary }}>
                        {booking.vendorName}
                        </Text>
                        <Text className="text-sm text-gray-500 mt-0.5 uppercase tracking-tighter font-bold">
                        {booking.category}
                        </Text>
                    </View>
                    </View>
                    <View
                    className="px-3 py-1 rounded-full flex-row items-center"
                    style={{ backgroundColor: getStatusColor(booking.status) + '20' }}
                    >
                    <StatusIcon size={14} color={getStatusColor(booking.status)} />
                    <Text
                        className="text-xs font-bold ml-1"
                        style={{ color: getStatusColor(booking.status) }}
                    >
                        {getStatusText(booking.status)}
                    </Text>
                    </View>
                </View>

                {/* Package Info */}
                <View className="bg-gray-50 rounded-xl p-3 mb-3">
                    <Text className="text-sm font-bold mb-2" style={{ color: Colors.textPrimary }}>
                    {booking.packageName}
                    </Text>
                    <View className="flex-row items-center mb-1.5">
                    <Calendar size={14} color="#6B7280" />
                    <Text className="text-xs text-gray-600 ml-2">
                        {booking.date}
                    </Text>
                    </View>
                    <View className="flex-row items-center mb-1.5">
                    <Clock size={14} color="#6B7280" />
                    <Text className="text-xs text-gray-600 ml-2">
                        {booking.time}
                    </Text>
                    </View>
                    <View className="flex-row items-center">
                    <MapPin size={14} color="#6B7280" />
                    <Text className="text-xs text-gray-600 ml-2" numberOfLines={1}>
                        {booking.vendorLocation || 'Location details in chat'}
                    </Text>
                    </View>
                </View>

                {/* Amount */}
                <View className="flex-row items-center justify-between">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase">
                    Booked on {new Date(booking.bookingDate).toLocaleDateString()}
                    </Text>
                    <View className="items-end">
                      {ratedBookings[booking.id] ? (
                        <View className="flex-row items-center bg-yellow-50 px-2 py-1 rounded-lg mb-1">
                          <Star size={10} color="#F59E0B" fill="#F59E0B" />
                          <Text className="text-[10px] font-bold ml-1" style={{ color: "#F59E0B" }}>
                            {ratedBookings[booking.id].rating}.0 RATED
                          </Text>
                        </View>
                      ) : (booking.status === 'completed' || booking.status === 'confirmed') && (
                        <TouchableOpacity 
                          onPress={(e) => {
                            e.stopPropagation();
                            handleRateBooking(booking);
                          }}
                          className="bg-primary/10 px-3 py-1.5 rounded-lg mb-1"
                        >
                          <Text className="text-[10px] font-bold text-primary">RATE EXPERIENCE</Text>
                        </TouchableOpacity>
                      )}
                      <Text className="text-lg font-bold" style={{ color: Colors.primary }}>
                      PKR {booking.price.toLocaleString()}
                      </Text>
                    </View>
                </View>
                </TouchableOpacity>
            );
            })}

            <RatingModal
              isVisible={isRatingModalVisible}
              onClose={() => setIsRatingModalVisible(false)}
              vendorName={selectedBooking?.vendorName || ''}
              onConfirm={onRatingSubmit}
            />

            {getFilteredBookings().length === 0 && (
            <View className="items-center justify-center py-20">
                <Calendar size={48} color="#D1D5DB" />
                <Text className="text-gray-400 text-base mt-4 font-bold">No bookings found</Text>
                <Text className="text-gray-400 text-sm mt-2">
                Try changing the filter or book a service
                </Text>
            </View>
            )}
        </ScrollView>
      )}
    </View>
  );
}

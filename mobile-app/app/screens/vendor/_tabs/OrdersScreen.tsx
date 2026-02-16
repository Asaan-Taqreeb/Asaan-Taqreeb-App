import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Filter } from 'lucide-react-native';
import { Colors } from '@/app/_constants/theme';
import { mockOrders, getOrdersByStatus } from '../_mockData/OrdersData';
import OrderCard from '../Component/OrderCard';

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, pending, accepted, rejected

  const getFilteredOrders = () => {
    if (selectedFilter === 'all') {
      return mockOrders;
    }
    return getOrdersByStatus(selectedFilter);
  };

  const filteredOrders = getFilteredOrders();

  const FilterButton = ({ label, value, count }: {
    label: string;
    value: string;
    count?: number;
  }) => {
    const isActive = selectedFilter === value;
    return (
      <TouchableOpacity
        onPress={() => setSelectedFilter(value)}
        className="px-4 py-2 rounded-full mr-2"
        style={{
          backgroundColor: isActive ? Colors.vendor : '#F3F4F6',
        }}
      >
        <Text
          className="text-sm font-semibold"
          style={{
            color: isActive ? '#FFFFFF' : '#6B7280',
          }}
        >
          {label} {count !== undefined && `(${count})`}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View className="bg-white px-5 py-5 border-b border-gray-100">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold" style={{ color: Colors.textPrimary }}>
              Orders
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              Manage your bookings
            </Text>
          </View>
          <TouchableOpacity
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{ backgroundColor: Colors.vendor + '15' }}
            onPress={() => {
              // Additional filter options
            }}
          >
            <Filter size={22} color={Colors.vendor} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4"
          contentContainerStyle={{ paddingRight: 20 }}
        >
          <FilterButton label="All" value="all" count={mockOrders.length} />
          <FilterButton
            label="Pending"
            value="pending"
            count={getOrdersByStatus('pending').length}
          />
          <FilterButton
            label="Accepted"
            value="accepted"
            count={getOrdersByStatus('accepted').length}
          />
          <FilterButton
            label="Rejected"
            value="rejected"
            count={getOrdersByStatus('rejected').length}
          />
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
      >
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => {
                router.push({
                  pathname: '/screens/vendor/Component/OrderDetailScreen',
                  params: { orderId: order.id }
                });
              }}
            />
          ))
        ) : (
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400 text-base" style={{ color: Colors.textPrimary + '50' }}>
              No orders found
            </Text>
            <Text className="text-gray-400 text-sm mt-2" style={{ color: Colors.textPrimary + '40' }}>
              Try changing the filter
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

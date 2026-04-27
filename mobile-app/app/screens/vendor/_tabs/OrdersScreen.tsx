import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Filter } from 'lucide-react-native';
import { Colors } from '@/app/_constants/theme';
import OrderCard from '../Component/OrderCard';
import { getVendorBookings, VendorOrderItem } from '@/app/_utils/bookingsApi';

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, pending, accepted, rejected
  const [orders, setOrders] = useState<VendorOrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadOrders = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await getVendorBookings()
        if (mounted) {
          setOrders(response)
        }
      } catch (apiError: any) {
        if (mounted) {
          setError(apiError?.message || 'Failed to load orders')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadOrders()

    return () => {
      mounted = false
    }
  }, [])

  const getFilteredOrders = () => {
    if (selectedFilter === 'all') {
      return orders;
    }
    return orders.filter((order) => order.status === selectedFilter)
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
          <FilterButton label="All" value="all" count={orders.length} />
          <FilterButton
            label="Pending"
            value="pending"
            count={orders.filter((order) => order.status === 'pending').length}
          />
          <FilterButton
            label="Accepted"
            value="accepted"
            count={orders.filter((order) => order.status === 'accepted').length}
          />
          <FilterButton
            label="Rejected"
            value="rejected"
            count={orders.filter((order) => order.status === 'rejected').length}
          />
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
      >
        {isLoading && (
          <Text className="text-sm mb-4" style={{ color: Colors.textSecondary }}>
            Loading orders...
          </Text>
        )}
        {error && !isLoading && (
          <Text className="text-sm mb-4" style={{ color: Colors.error }}>
            {error}
          </Text>
        )}
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => {
                router.push({
                  pathname: '/screens/vendor/Component/OrderDetailScreen',
                  params: { orderId: order.id, order: JSON.stringify(order) }
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

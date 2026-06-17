import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Filter, RotateCw } from 'lucide-react-native';
import { Colors } from '@/app/_constants/theme';
import OrderCard from '../Component/OrderCard';
import { getVendorBookings, VendorOrderItem } from '@/app/_utils/bookingsApi';
import { useLanguage } from '@/app/_context/LanguageContext';
import VendorHeader from '../Component/VendorHeader';

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, pending, accepted, rejected
  const [orders, setOrders] = useState<VendorOrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true)
      else setIsLoading(true)
      setError(null)
      const response = await getVendorBookings(isRefresh)
      setOrders(response)
    } catch (apiError: any) {
      setError(apiError?.message || 'Failed to load orders')
    } finally {
      if (isRefresh) setIsRefreshing(false)
      else setIsLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadOrders()
    }, [loadOrders])
  )

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
        className="px-4 py-2.5 mr-2"
        style={{
          backgroundColor: isActive ? Colors.primaryLight : Colors.white,
          borderWidth: 1,
          borderColor: isActive ? Colors.primaryLight : Colors.border,
          borderRadius: 12,
        }}
      >
        <Text
          className="text-xs font-bold"
          style={{
            color: isActive ? Colors.white : Colors.textSecondary,
          }}
        >
          {label} {count !== undefined && count > 0 && <Text className="opacity-70">({count})</Text>}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: Colors.background }}>
      {/* Header */}
      <VendorHeader title={t('manageOrders') || 'Manage Orders'} subtitle={t('trackAndManageOrders') || 'Track and update your event bookings'} />

      {/* Filter Tabs Row */}
      <View className="bg-white py-3 flex-row items-center px-4" style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1 mr-2"
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
        <TouchableOpacity
          className="w-10 h-10 rounded-xl items-center justify-center border border-slate-100"
          style={{ backgroundColor: Colors.white }}
        >
          <Filter size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadOrders(true)}
            tintColor={Colors.vendor}
          />
        }
      >
        <View className="px-5">
          {error && !isLoading && (
            <View className="mb-6 p-4 rounded-2xl" style={{backgroundColor: Colors.errorLight + '40', borderWidth: 1, borderColor: Colors.error + '20'}}>
              <Text className="text-sm font-medium mb-3" style={{color: Colors.error}}>
                {error}
              </Text>
              <TouchableOpacity
                className="py-2.5 px-4 rounded-xl self-start"
                style={{backgroundColor: Colors.error}}
                onPress={() => loadOrders()}
              >
                <Text className="text-white font-bold text-xs">Retry Loading</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {isLoading && (
            <Text className="text-sm font-medium mb-4 text-center" style={{ color: Colors.textTertiary }}>
              Updating orders...
            </Text>
          )}

          {!isLoading && filteredOrders.length > 0 ? (
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
          ) : !isLoading && (
            <View className="items-center justify-center py-20 px-10">
              <View className="w-20 h-20 rounded-2xl bg-gray-100 items-center justify-center mb-6">
                <Filter size={32} color={Colors.textTertiary} />
              </View>
              <Text className="text-lg font-bold" style={{ color: Colors.textSecondary }}>
                No Orders Found
              </Text>
              <Text className="text-sm font-medium mt-2 text-center" style={{ color: Colors.textTertiary }}>
                {selectedFilter === 'all' 
                  ? "You don't have any bookings yet" 
                  : `No orders matching "${selectedFilter}" status`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, DollarSign, CheckCircle, XCircle, Clock, ChevronRight, Plus } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';
import { getOrderStats, getRecentOrders } from '../_mockData/OrdersData';
import OrderCard from '../Component/OrderCard';

export default function VendorDashboardHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const stats = getOrderStats();
  const recentOrders = getRecentOrders(3);

  const StatCard = ({ icon: Icon, title, value, color, bgColor }: {
    icon: any;
    title: string;
    value: number;
    color: string;
    bgColor: string;
  }) => (
    <View
      className="bg-white rounded-2xl p-4 flex-1"
      style={{
        ...Shadows.small,
        borderWidth: 1,
        borderColor: '#F3F4F6',
      }}
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center mb-3"
        style={{ backgroundColor: bgColor }}
      >
        <Icon size={24} color={color} />
      </View>
      <Text className="text-2xl font-bold mb-1" style={{ color: Colors.textPrimary }}>
        {value}
      </Text>
      <Text className="text-sm text-gray-600">{title}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View className="bg-white px-5 py-5 border-b border-gray-100">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold" style={{ color: Colors.textPrimary }}>
              Dashboard
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              Welcome back! Here's your overview
            </Text>
          </View>
          <TouchableOpacity
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{ backgroundColor: Colors.vendor + '15' }}
            onPress={() => {
              // Navigate to notifications
            }}
          >
            <Bell size={22} color={Colors.vendor} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Revenue Card */}
        <View className="px-5 mt-5">
          <View
            className="rounded-3xl p-6"
            style={{
              backgroundColor: Colors.vendor,
              ...Shadows.medium,
            }}
          >
            <View className="flex-row items-center mb-2">
              <DollarSign size={24} color="#FFFFFF" />
              <Text className="text-white text-base font-semibold ml-2">
                Total Revenue
              </Text>
            </View>
            <Text className="text-white text-4xl font-bold mt-2">
              PKR {stats.totalRevenue.toLocaleString()}
            </Text>
            <Text className="text-white/80 text-sm mt-2">
              From {stats.acceptedOrders} accepted orders
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="px-5 mt-5">
          <View className="flex-row gap-3 mb-3">
            <StatCard
              icon={CheckCircle}
              title="Accepted"
              value={stats.acceptedOrders}
              color="#10B981"
              bgColor="#D1FAE5"
            />
            <StatCard
              icon={XCircle}
              title="Rejected"
              value={stats.rejectedOrders}
              color="#EF4444"
              bgColor="#FEE2E2"
            />
          </View>
          <View className="flex-row gap-3">
            <StatCard
              icon={Clock}
              title="Pending"
              value={stats.pendingOrders}
              color="#F59E0B"
              bgColor="#FEF3C7"
            />
            <StatCard
              icon={CheckCircle}
              title="Total Orders"
              value={stats.totalOrders}
              color={Colors.vendor}
              bgColor={Colors.vendor + '20'}
            />
          </View>
        </View>

        {/* Recent Orders */}
        <View className="px-5 mt-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold" style={{ color: Colors.textPrimary }}>
              Recent Orders
            </Text>
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => {
                // Navigate to Orders tab
                router.push('/screens/vendor/_tabs/OrdersScreen');
              }}
            >
              <Text className="text-sm font-semibold mr-1" style={{ color: Colors.vendor }}>
                See All
              </Text>
              <ChevronRight size={16} color={Colors.vendor} />
            </TouchableOpacity>
          </View>

          {recentOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => {
                // Navigate to order detail
                router.push({
                  pathname: '/screens/vendor/Component/OrderDetailScreen',
                  params: { orderId: order.id }
                });
              }}
            />
          ))}
        </View>

        {/* Quick Actions */}
        <View className="px-5 mt-6">
          <Text className="text-xl font-bold mb-4" style={{ color: Colors.textPrimary }}>
            Quick Actions
          </Text>
          <View className="flex-row gap-3 mb-3">
            <TouchableOpacity
              className="flex-1 bg-white rounded-2xl p-4 border border-gray-100"
              style={Shadows.small}
              onPress={() => router.push('/screens/vendor/_tabs/OrdersScreen')}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: '#F59E0B20' }}
              >
                <Clock size={20} color="#F59E0B" />
              </View>
              <Text className="text-sm font-semibold" style={{ color: Colors.textPrimary }}>
                View Pending
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                {stats.pendingOrders} orders
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-white rounded-2xl p-4 border border-gray-100"
              style={Shadows.small}
              onPress={() => router.push('/screens/vendor/_tabs/VendorMessagesScreen')}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: Colors.vendor + '20' }}
              >
                <Bell size={20} color={Colors.vendor} />
              </View>
              <Text className="text-sm font-semibold" style={{ color: Colors.textPrimary }}>
                Messages
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                Chat with clients
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Manage Packages Button */}
          <TouchableOpacity
            className="bg-white rounded-2xl p-4 border border-gray-100 flex-row items-center mt-3"
            style={Shadows.small}
            onPress={() => router.push('/screens/vendor/Component/PackageManagementScreen')}
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: Colors.vendor + '20' }}
            >
              <Plus size={24} color={Colors.vendor} />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
                Manage Packages
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                Add, edit, or remove your service packages
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

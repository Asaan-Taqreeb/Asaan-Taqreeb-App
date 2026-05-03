import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, DollarSign, CheckCircle, XCircle, Clock, ChevronRight, Plus, Calendar, Image as ImageIcon, ShoppingBasket, MessageCircle, Star } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';
import { getVendorBookings, type VendorOrderItem } from '@/app/_utils/bookingsApi';
import OrderCard from '../Component/OrderCard';

import NotificationBell from '@/app/_components/NotificationBell'
import { useUser } from '@/app/_context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VendorDashboardHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [orders, setOrders] = React.useState<VendorOrderItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [recentReviews, setRecentReviews] = React.useState<any[]>([])
  const [avgRating, setAvgRating] = React.useState(4.8)

  const loadDashboard = React.useCallback(async () => {
    try {
      const data = await getVendorBookings()
      setOrders(data)
      
      // Load ratings to simulate real-time feedback
      const savedRatings = await AsyncStorage.getItem('client_rated_bookings');
      if (savedRatings) {
        const ratings = JSON.parse(savedRatings);
        const ratingArray = Object.values(ratings);
        if (ratingArray.length > 0) {
          const sum = ratingArray.reduce((acc: number, curr: any) => acc + curr.rating, 0);
          setAvgRating(Number((sum / ratingArray.length).toFixed(1)));
          setRecentReviews(ratingArray.slice(-3).reverse());
        }
      }
    } catch {
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true)
      loadDashboard()
    }, [loadDashboard])
  )

  const sortedOrders = React.useMemo(
    () => [...orders].sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()),
    [orders]
  )

  const stats = React.useMemo(() => {
    const totalOrders = orders.length
    const acceptedOrders = orders.filter((order) => order.status === 'accepted').length
    const rejectedOrders = orders.filter((order) => order.status === 'rejected').length
    const pendingOrders = orders.filter((order) => order.status === 'pending').length
    const totalRevenue = orders
      .filter((order) => order.status === 'accepted')
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)

    return { totalOrders, acceptedOrders, rejectedOrders, pendingOrders, totalRevenue }
  }, [orders])

  const recentOrders = React.useMemo(() => sortedOrders.slice(0, 3), [sortedOrders])

  const StatCard = ({ icon: Icon, title, value, color, bgColor }: {
    icon: any;
    title: string;
    value: number | string;
    color: string;
    bgColor: string;
  }) => (
    <View
      className="bg-white rounded-2xl p-5 flex-1"
      style={Shadows.small}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: bgColor }}
      >
        <Icon size={20} color={color} />
      </View>
      <Text className="text-2xl font-bold mb-0.5" style={{ color: Colors.textPrimary }}>
        {value}
      </Text>
      <Text className="text-xs font-semibold" style={{ color: Colors.textSecondary }}>{title}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: Colors.background }}>
      {/* Header */}
      <View className="bg-white px-5 py-6" style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xl font-black tracking-tight" style={{ color: Colors.textPrimary }}>
              Dashboard
            </Text>
            <Text className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: Colors.textSecondary }}>
              Vendor Control Panel
            </Text>
          </View>
          <NotificationBell userId={user?.id} userRole='vendor' />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Revenue Card */}
        <View className="px-5 mt-6">
          <View
            className="rounded-[32px] p-7"
            style={[
              {
                backgroundColor: Colors.vendor,
              },
              Shadows.large
            ]}
          >
            <View className="flex-row items-center mb-1">
              <View className="w-8 h-8 rounded-lg items-center justify-center bg-white/20 mr-2">
                <DollarSign size={16} color="#FFFFFF" />
              </View>
              <Text className="text-white/60 text-[10px] font-black uppercase tracking-[2px] ml-1">
                Total Revenue
              </Text>
            </View>
            <Text className="text-white text-4xl font-black mt-3">
              PKR {stats.totalRevenue.toLocaleString()}
            </Text>
            <View className="mt-5 pt-5 flex-row justify-between items-center" style={{borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', borderStyle: 'solid'}}>
              <Text className="text-white/70 text-xs font-bold">
                {stats.acceptedOrders} Confirmed Bookings
              </Text>
              <View className="bg-emerald-400 px-3 py-1 rounded-full">
                <Text className="text-emerald-950 text-[9px] font-black tracking-widest">REALTIME</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="px-5 mt-6">
          <View className="flex-row gap-4 mb-4">
            <StatCard
              icon={CheckCircle}
              title="Accepted"
              value={stats.acceptedOrders}
              color={Colors.success}
              bgColor={Colors.successLight}
            />
            <StatCard
              icon={XCircle}
              title="Rejected"
              value={stats.rejectedOrders}
              color={Colors.error}
              bgColor={Colors.errorLight}
            />
          </View>
          <View className="flex-row gap-4">
            <StatCard
              icon={Clock}
              title="Pending"
              value={stats.pendingOrders}
              color={Colors.warning}
              bgColor={Colors.warningLight}
            />
            <StatCard
              icon={Star}
              title="Avg Rating"
              value={`${avgRating}`}
              color="#F59E0B"
              bgColor="#FEF3C7"
            />
          </View>
        </View>

        {/* Recent Orders */}
        <View className="px-5 mt-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold" style={{ color: Colors.textPrimary }}>
              Recent Orders
            </Text>
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => {
                router.push('/screens/vendor/_tabs/OrdersScreen');
              }}
            >
              <Text className="text-xs font-bold mr-1" style={{ color: Colors.vendor }}>
                See All
              </Text>
              <ChevronRight size={12} color={Colors.vendor} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="bg-white rounded-2xl p-6" style={Shadows.small}>
              <Text className="text-sm font-medium text-center" style={{color: Colors.textTertiary}}>Loading recent orders...</Text>
            </View>
          ) : recentOrders.length === 0 ? (
            <View className="bg-white rounded-2xl p-10 items-center justify-center" style={[Shadows.small, {borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed'}]}>
              <Text className="text-sm font-medium" style={{color: Colors.textTertiary}}>No orders yet</Text>
            </View>
          ) : (
            recentOrders.map((order) => (
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
          )}
        </View>

        {/* Recent Reviews */}
        {recentReviews.length > 0 && (
          <View className="px-5 mt-8">
            <Text className="text-lg font-bold mb-4" style={{ color: Colors.textPrimary }}>
              Recent Reviews
            </Text>
            {recentReviews.map((review, index) => (
              <View 
                key={index} 
                className="bg-white rounded-2xl p-4 mb-3" 
                style={Shadows.small}
              >
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        size={12} 
                        color={s <= review.rating ? "#F59E0B" : Colors.border} 
                        fill={s <= review.rating ? "#F59E0B" : "transparent"} 
                      />
                    ))}
                  </View>
                  <Text className="text-[10px] font-bold text-gray-400">
                    JUST NOW
                  </Text>
                </View>
                <Text className="text-sm font-medium italic" style={{ color: Colors.textSecondary }}>
                  "{review.comment || 'No comment provided.'}"
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View className="px-5 mt-8">
          <Text className="text-lg font-bold mb-4" style={{ color: Colors.textPrimary }}>
            Quick Actions
          </Text>
          <View className="flex-row gap-3 mb-3">
            <TouchableOpacity
              className="flex-1 bg-white rounded-2xl p-4"
              style={Shadows.small}
              onPress={() => router.push('/screens/vendor/_tabs/OrdersScreen')}
            >
              <View className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                style={{ backgroundColor: Colors.vendor + '15' }}
              >
                <ShoppingBasket size={20} color={Colors.vendor} />
              </View>
              <Text className="text-sm font-bold" style={{ color: Colors.textPrimary }}>
                Orders
              </Text>
              <Text className="text-[10px] font-bold mt-1" style={{color: Colors.textTertiary}}>
                {stats.pendingOrders} PENDING
              </Text>
            </TouchableOpacity>
 
            <TouchableOpacity
              className="flex-1 bg-white rounded-2xl p-4"
              style={Shadows.small}
              onPress={() => router.push('/screens/vendor/Component/VendorCalendarScreen')}
            >
              <View className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                style={{ backgroundColor: Colors.warningLight }}
              >
                <Calendar size={20} color={Colors.warning} />
              </View>
              <Text className="text-sm font-bold" style={{ color: Colors.textPrimary }}>
                Calendar
              </Text>
              <Text className="text-[10px] font-bold mt-1" style={{color: Colors.textTertiary}}>
                AVAILABILITY
              </Text>
            </TouchableOpacity>
          </View>
 
          <View className="flex-row gap-3 mb-3">
            <TouchableOpacity
              className="flex-1 bg-white rounded-2xl p-4"
              style={Shadows.small}
              onPress={() => router.push('/screens/vendor/_tabs/VendorMessagesScreen')}
            >
              <View className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                style={{ backgroundColor: Colors.infoLight }}
              >
                <MessageCircle size={20} color={Colors.info} />
              </View>
              <Text className="text-sm font-bold" style={{ color: Colors.textPrimary }}>
                Messages
              </Text>
              <Text className="text-[10px] font-bold mt-1" style={{color: Colors.textTertiary}}>
                CLIENT CHATS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-white rounded-2xl p-4"
              style={Shadows.small}
              onPress={() => router.push('/screens/vendor/Component/PackageManagementScreen')}
            >
              <View className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                style={{ backgroundColor: Colors.primaryMuted }}
              >
                <Plus size={20} color={Colors.primary} />
              </View>
              <Text className="text-sm font-bold" style={{ color: Colors.textPrimary }}>
                Packages
              </Text>
              <Text className="text-[10px] font-bold mt-1" style={{color: Colors.textTertiary}}>
                MANAGE OFFERS
              </Text>
            </TouchableOpacity>
          </View>
 
          <TouchableOpacity
            className="bg-white rounded-2xl p-4"
            style={Shadows.small}
            onPress={() => router.push('/screens/vendor/Component/ServiceImageManager')}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: Colors.infoLight }}
              >
                <ImageIcon size={20} color={Colors.info} />
              </View>
              <View>
                <Text className="text-sm font-bold" style={{ color: Colors.textPrimary }}>
                  Service Gallery
                </Text>
                <Text className="text-[10px] font-bold mt-1" style={{color: Colors.textTertiary}}>
                  MANAGE SERVICE PHOTOS
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

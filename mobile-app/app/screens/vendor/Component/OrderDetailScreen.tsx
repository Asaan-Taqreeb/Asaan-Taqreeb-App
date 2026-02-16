import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  MessageCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  Package,
  Plus,
} from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';
import { getOrderById } from '../_mockData/OrdersData';

export default function OrderDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams();
  const order = getOrderById(orderId);
  const [orderStatus, setOrderStatus] = useState(order?.status || 'pending');

  if (!order) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: '#F9FAFB' }} className="items-center justify-center">
        <Text className="text-gray-500">Order not found</Text>
      </View>
    );
  }

  const handleApprove = () => {
    Alert.alert(
      'Approve Order',
      'Are you sure you want to accept this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => {
            setOrderStatus('accepted');
            Alert.alert('Success', 'Order has been approved!');
            // In real app, update backend
          },
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            setOrderStatus('rejected');
            Alert.alert('Order Rejected', 'The customer will be notified.');
            // In real app, update backend
          },
        },
      ]
    );
  };

  const handleChat = () => {
    router.push({
      pathname: '/screens/vendor/_tabs/VendorMessagesScreen',
      params: { customerId: order.customerName }
    });
  };

  const getStatusColor = () => {
    switch (orderStatus) {
      case 'accepted':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (orderStatus) {
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending Approval';
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{ backgroundColor: Colors.vendor + '15' }}
          >
            <ArrowLeft size={22} color={Colors.vendor} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold" style={{ color: Colors.textPrimary }}>Order Details</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: orderStatus === 'pending' ? 220 : 120 }}
      >
        {/* Status Banner */}
        <View
          className="mx-5 mt-5 rounded-2xl p-4"
          style={{ backgroundColor: getStatusColor() + '20' }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: getStatusColor() + '40' }}
              >
                {orderStatus === 'accepted' ? (
                  <CheckCircle size={24} color={getStatusColor()} />
                ) : orderStatus === 'rejected' ? (
                  <XCircle size={24} color={getStatusColor()} />
                ) : (
                  <Clock size={24} color={getStatusColor()} />
                )}
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold" style={{ color: getStatusColor() }}>
                  {getStatusText()}
                </Text>
                <Text className="text-sm text-gray-600 mt-0.5">
                  Order #{order.id}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View className="bg-white mx-5 mt-4 rounded-2xl p-4" style={Shadows.small}>
          <Text className="text-xs font-semibold text-gray-400 mb-3 tracking-wider">
            CUSTOMER
          </Text>
          <View className="flex-row items-center">
            <Image
              source={{ uri: order.customerPhoto }}
              className="w-14 h-14 rounded-full"
            />
            <View className="ml-3 flex-1">
              <Text className="text-lg font-semibold" style={{ color: Colors.textPrimary }}>
                {order.customerName}
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                Ordered on {new Date(order.orderDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Event Details */}
        <View className="bg-white mx-5 mt-4 rounded-2xl p-4" style={Shadows.small}>
          <Text className="text-xs font-semibold text-gray-400 mb-3 tracking-wider">
            EVENT DETAILS
          </Text>
          
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: Colors.vendor + '20' }}
            >
              <Calendar size={20} color={Colors.vendor} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm text-gray-500">Date</Text>
              <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
                {order.eventDate} • {order.eventDay}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: '#F59E0B20' }}
            >
              <Clock size={20} color="#F59E0B" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm text-gray-500">Time</Text>
              <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
                {order.eventTime}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center">
              <Users size={20} color="#10B981" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm text-gray-500">Guest Count</Text>
              <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
                {order.guestCount} guests
              </Text>
            </View>
          </View>
        </View>

        {/* Package Details */}
        <View className="bg-white mx-5 mt-4 rounded-2xl p-4" style={Shadows.small}>
          <Text className="text-xs font-semibold text-gray-400 mb-3 tracking-wider">
            PACKAGE SELECTED
          </Text>
          
          <View className="flex-row items-start mb-3">
            <View className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: Colors.vendor + '20' }}
            >
              <Package size={20} color={Colors.vendor} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
                {order.packageName}
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                {order.serviceType}
              </Text>
              <Text className="text-lg font-bold mt-2" style={{ color: Colors.vendor }}>
                PKR {order.packagePrice.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Optional Items */}
          {order.optionalItems && order.optionalItems.length > 0 && (
            <>
              <View className="h-px bg-gray-200 my-3" />
              <Text className="text-xs font-semibold text-gray-400 mb-2 tracking-wider">
                OPTIONAL ADD-ONS
              </Text>
              {order.optionalItems.map((item, index) => (
                <View key={index} className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1">
                    <Plus size={14} color="#6B7280" />
                    <Text className="text-sm text-gray-700 ml-2">{item.name}</Text>
                  </View>
                  <Text className="text-sm font-semibold" style={{ color: Colors.textPrimary }}>
                    PKR {item.price.toLocaleString()}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Special Requests */}
        {order.specialRequests && (
          <View className="bg-white mx-5 mt-4 rounded-2xl p-4" style={Shadows.small}>
            <Text className="text-xs font-semibold text-gray-400 mb-2 tracking-wider">
              SPECIAL REQUESTS
            </Text>
            <Text className="text-sm text-gray-700 leading-5">
              {order.specialRequests}
            </Text>
          </View>
        )}

        {/* Total Amount */}
        <View
          className="mx-5 mt-4 rounded-2xl p-4"
          style={{ backgroundColor: Colors.vendor }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <DollarSign size={24} color="#FFFFFF" />
              <Text className="text-white text-base font-semibold ml-2">
                Total Amount
              </Text>
            </View>
            <Text className="text-white text-2xl font-bold">
              PKR {order.totalAmount.toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
      {orderStatus === 'pending' && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white px-5 border-t border-gray-200"
          style={[Shadows.medium, { paddingTop: 16, paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <View className="flex-row gap-3 mb-3">
            <TouchableOpacity
              onPress={handleReject}
              className="flex-1 bg-red-500 rounded-2xl py-4 items-center justify-center"
              activeOpacity={0.8}
              style={Shadows.small}
            >
              <View className="flex-row items-center">
                <XCircle size={20} color="#FFFFFF" />
                <Text className="text-white text-base font-semibold ml-2">
                  Reject
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApprove}
              className="flex-1 bg-green-500 rounded-2xl py-4 items-center justify-center"
              activeOpacity={0.8}
              style={Shadows.small}
            >
              <View className="flex-row items-center">
                <CheckCircle size={20} color="#FFFFFF" />
                <Text className="text-white text-base font-semibold ml-2">
                  Approve
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleChat}
            className="rounded-2xl py-4 items-center justify-center border-2"
            activeOpacity={0.8}
            style={{ borderColor: Colors.vendor }}
          >
            <View className="flex-row items-center">
              <MessageCircle size={20} color={Colors.vendor} />
              <Text className="text-base font-semibold ml-2" style={{ color: Colors.vendor }}>
                Chat with Customer
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* If already accepted/rejected, show chat option only */}
      {orderStatus !== 'pending' && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white px-5 border-t border-gray-200"
          style={[Shadows.medium, { paddingTop: 16, paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <TouchableOpacity
            onPress={handleChat}
            className="rounded-2xl py-4 items-center justify-center"
            activeOpacity={0.8}
            style={{ backgroundColor: Colors.vendor }}
          >
            <View className="flex-row items-center">
              <MessageCircle size={20} color="#FFFFFF" />
              <Text className="text-white text-base font-semibold ml-2">
                Chat with Customer
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

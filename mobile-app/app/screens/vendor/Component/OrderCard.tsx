import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Calendar, Clock, Users, DollarSign } from 'lucide-react-native';
import { Colors } from '@/app/_constants/theme';

interface Order {
  id: string;
  customerName: string;
  customerPhoto: string;
  serviceType: string;
  packageName: string;
  totalAmount: number;
  eventDate: string;
  eventDay: string;
  eventTime: string;
  guestCount: number;
  status: string;
}

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

export default function OrderCard({ order, onPress }: OrderCardProps) {
  const getStatusColor = () => {
    switch (order.status) {
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
    switch (order.status) {
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-3"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Header with customer info and status */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center flex-1">
          <Image
            source={{ uri: order.customerPhoto }}
            className="w-12 h-12 rounded-full"
          />
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
              {order.customerName}
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              {order.serviceType}
            </Text>
          </View>
        </View>
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: getStatusColor() + '20' }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: getStatusColor() }}
          >
            {getStatusText()}
          </Text>
        </View>
      </View>

      {/* Order details */}
      <View className="bg-gray-50 rounded-xl p-3 mb-3">
        <Text className="text-sm font-semibold mb-2" style={{ color: Colors.textPrimary }}>
          {order.packageName}
        </Text>
        
        <View className="flex-row items-center mb-1.5">
          <Calendar size={14} color="#6B7280" />
          <Text className="text-xs text-gray-600 ml-2">
            {order.eventDate} • {order.eventDay}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Clock size={14} color="#6B7280" />
          <Text className="text-xs text-gray-600 ml-2">
            {order.eventTime}
          </Text>
        </View>
      </View>

      {/* Footer with amount and guest count */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Users size={16} color="#6B7280" />
          <Text className="text-sm text-gray-600 ml-1.5">
            {order.guestCount} guests
          </Text>
        </View>
        <View className="flex-row items-center">
          <DollarSign size={16} color={Colors.vendor} />
          <Text className="text-base font-bold" style={{ color: Colors.vendor }}>
            PKR {order.totalAmount.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Order ID */}
      <Text className="text-xs text-gray-400 mt-2">
        Order #{order.id}
      </Text>
    </TouchableOpacity>
  );
}

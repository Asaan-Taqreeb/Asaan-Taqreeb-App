import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar, Clock, Users, DollarSign } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';
import Avatar from '@/app/_components/Avatar';

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
        return Colors.success;
      case 'rejected':
        return Colors.error;
      case 'pending':
        return Colors.warning;
      default:
        return Colors.textSecondary;
    }
  };

  const statusColor = getStatusColor();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white rounded-2xl p-4 mb-4"
      style={{
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.small,
      }}
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center flex-1">
          <Avatar name={order.customerName} size="md" />
          <View className="ml-3 flex-1">
            <Text className="text-base font-bold" style={{ color: Colors.textPrimary }} numberOfLines={1}>
              {order.customerName}
            </Text>
            <Text className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: Colors.textTertiary }}>
              {order.serviceType}
            </Text>
          </View>
        </View>
        <View
          className="px-3 py-1 rounded-lg"
          style={{ backgroundColor: statusColor + '20' }}
        >
          <Text
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: statusColor }}
          >
            {order.status}
          </Text>
        </View>
      </View>

      <View className="bg-gray-50 rounded-xl p-3 mb-4" style={{borderWidth: 1, borderColor: Colors.border}}>
        <Text className="text-xs font-bold mb-2.5" style={{ color: Colors.textPrimary }}>
          {order.packageName}
        </Text>
        
        <View className="flex-row items-center mb-1.5">
          <Calendar size={12} color={Colors.textSecondary} />
          <Text className="text-[11px] font-medium ml-2" style={{ color: Colors.textSecondary }}>
            {order.eventDate} • {order.eventDay}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Clock size={12} color={Colors.textSecondary} />
          <Text className="text-[11px] font-medium ml-2" style={{ color: Colors.textSecondary }}>
            {order.eventTime}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center pt-3" style={{borderTopWidth: 1, borderTopColor: Colors.border, borderStyle: 'dashed'}}>
        <View className="flex-row items-center">
          <Users size={14} color={Colors.textTertiary} />
          <Text className="text-xs font-bold ml-1.5" style={{ color: Colors.textTertiary }}>
            {order.guestCount} GUESTS
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-sm font-bold" style={{ color: Colors.vendor }}>
            PKR {order.totalAmount.toLocaleString()}
          </Text>
        </View>
      </View>

      <Text className="text-[9px] font-bold text-gray-300 mt-3 uppercase tracking-widest">
        ORDER #{order.id.slice(-8).toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}


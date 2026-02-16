import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import { Colors } from '@/app/_constants/theme';

export default function VendorMessagesScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: '#F9FAFB' }}>
      <View className="bg-white px-5 py-5 border-b border-gray-100">
        <Text className="text-2xl font-bold" style={{ color: Colors.textPrimary }}>
          Messages
        </Text>
        <Text className="text-sm text-gray-500 mt-1">
          Chat with your clients
        </Text>
      </View>

      <View className="flex-1 items-center justify-center px-5">
        <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
          <MessageCircle size={32} color="#9CA3AF" />
        </View>
        <Text className="text-xl font-semibold text-gray-900 mb-2">
          No Messages Yet
        </Text>
        <Text className="text-sm text-gray-500 text-center">
          When customers message you about orders,{'\n'}they will appear here
        </Text>
      </View>
    </View>
  );
}

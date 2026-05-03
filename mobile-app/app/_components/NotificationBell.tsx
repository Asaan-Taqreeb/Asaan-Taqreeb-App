import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, SafeAreaView, Pressable } from 'react-native';
import { Bell, X, Check, Clock, MessageSquare, Info } from 'lucide-react-native';
import { Colors, Shadows } from '@/app/_constants/theme';
import { useNotifications } from '@/app/_context/NotificationContext';
import { useSocket } from '@/app/_context/SocketContext';
import { markNotificationAsRead } from '@/app/_utils/notificationService';
import type { Notification } from '@/app/_utils/notificationService';

interface NotificationBellProps {
  userId?: string;
  userRole?: 'client' | 'vendor';
}

export default function NotificationBell({ userId, userRole }: NotificationBellProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { notifications, unreadCount: polledCount, refresh, markAsRead, markAllAsRead } = useNotifications(true);
  const { unreadNotificationCount: socketCount, clearNotificationCount } = useSocket();
  
  // Combine counts, ensuring we don't double count if both systems are active
  const displayCount = Math.max(polledCount, socketCount);

  const openNotifications = async () => {
    setModalVisible(true);
    clearNotificationCount(); // reset socket count
    refresh(); // refresh polling count
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Handle navigation based on notification type or actionUrl
    if (notification.actionUrl) {
      // Logic for navigation would go here
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const getNotificationIcon = (type: string) => {
    const size = 16;
    switch (type) {
      case 'booking_request':
        return <Clock size={size} color={Colors.warning} />;
      case 'booking_accepted':
        return <Check size={size} color={Colors.success} />;
      case 'booking_rejected':
        return <X size={size} color={Colors.error} />;
      case 'new_message':
        return <MessageSquare size={size} color={userRole === 'vendor' ? Colors.vendor : Colors.primary} />;
      default:
        return <Info size={size} color={Colors.info} />;
    }
  };

  const getStatusBg = (type: string) => {
    switch (type) {
      case 'booking_request': return Colors.warningLight;
      case 'booking_accepted': return Colors.successLight;
      case 'booking_rejected': return Colors.errorLight;
      default: return Colors.lightGray;
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={openNotifications}
        className="relative p-2 rounded-xl active:bg-gray-100"
        style={{ backgroundColor: Colors.white }}
      >
        <Bell size={20} color={Colors.textPrimary} />
        {displayCount > 0 && (
          <View
            className="absolute top-1 right-1 bg-red-500 rounded-full items-center justify-center border-2 border-white"
            style={{ width: 18, height: 18, backgroundColor: Colors.error }}
          >
            <Text className="text-white font-bold text-[9px]">
              {displayCount > 9 ? '9+' : displayCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <SafeAreaView className="flex-1 mt-20 bg-white rounded-t-[32px]" style={Shadows.medium}>
            {/* Header */}
            <View className="flex-row justify-between items-center px-6 py-6 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-xl font-bold" style={{ color: Colors.textPrimary }}>Notifications</Text>
                <View className="flex-row items-center mt-0.5">
                  <Text className="text-xs font-medium mr-3" style={{ color: Colors.textSecondary }}>
                    {displayCount > 0 ? `${displayCount} unread` : 'All caught up'}
                  </Text>
                  {displayCount > 0 && (
                    <TouchableOpacity onPress={handleMarkAllRead}>
                      <Text className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: userRole === 'vendor' ? Colors.vendor : Colors.primary }}>Mark all as read</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="w-10 h-10 rounded-full items-center justify-center bg-gray-100"
              >
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* List */}
            {notifications.length === 0 ? (
              <View className="flex-1 justify-center items-center px-10">
                <View className="w-20 h-20 rounded-3xl bg-gray-50 items-center justify-center mb-6">
                  <Bell size={32} color={Colors.textTertiary} />
                </View>
                <Text className="text-lg font-bold text-center" style={{ color: Colors.textSecondary }}>No Notifications</Text>
                <Text className="text-sm font-medium mt-2 text-center text-gray-400">
                  We&apos;ll notify you when something important happens!
                </Text>
              </View>
            ) : (
              <ScrollView 
                className="flex-1"
                contentContainerStyle={{ padding: 20 }}
                showsVerticalScrollIndicator={false}
              >
                {notifications.map((notification) => (
                  <Pressable
                    key={notification.id}
                    onPress={() => handleNotificationPress(notification)}
                    className="mb-4 p-4 rounded-2xl flex-row"
                    style={{ 
                      backgroundColor: notification.isRead ? Colors.white : Colors.lightGray + '40',
                      borderWidth: 1,
                      borderColor: notification.isRead ? Colors.border : Colors.border,
                    }}
                  >
                    <View 
                      className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                      style={{ backgroundColor: getStatusBg(notification.type) + '30' }}
                    >
                      {getNotificationIcon(notification.type)}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row justify-between items-start mb-1">
                        <Text 
                          className="text-sm font-bold flex-1 mr-2" 
                          style={{ color: Colors.textPrimary }}
                          numberOfLines={1}
                        >
                          {notification.title}
                        </Text>
                        <Text className="text-[10px] font-bold text-gray-400">
                          {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      
                      <Text 
                        className="text-xs font-medium leading-relaxed" 
                        style={{ color: Colors.textSecondary }}
                        numberOfLines={2}
                      >
                        {notification.message}
                      </Text>

                      {!notification.isRead && (
                        <View className="mt-2 flex-row items-center">
                          <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" style={{backgroundColor: userRole === 'vendor' ? Colors.vendor : Colors.primary}} />
                          <Text className="text-[10px] font-bold uppercase tracking-widest" style={{color: userRole === 'vendor' ? Colors.vendor : Colors.primary}}>New Alert</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            
            <View className="p-6 border-t border-gray-100">
              <TouchableOpacity 
                className="py-4 rounded-2xl items-center justify-center"
                style={{ backgroundColor: Colors.lightGray }}
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-sm font-bold" style={{ color: Colors.textPrimary }}>Close</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}


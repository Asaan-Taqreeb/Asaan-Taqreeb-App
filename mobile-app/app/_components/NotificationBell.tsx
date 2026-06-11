import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert, StyleSheet, Pressable } from 'react-native';
import { Bell, X, Check, Clock, MessageSquare, Info, Trash2, BellOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows } from '@/app/_constants/theme';
import { useNotifications } from '@/app/_context/NotificationContext';
import { useSocket } from '@/app/_context/SocketContext';
import { 
  markNotificationAsRead, 
  clearAllNotifications, 
  deleteNotification, 
  deleteAllNotifications 
} from '@/app/_utils/notificationService';
import { dismissAllTrayNotifications } from '@/app/_utils/pushNotificationService';
import type { Notification } from '@/app/_utils/notificationService';

interface NotificationBellProps {
  userId?: string;
  userRole?: 'client' | 'vendor';
}

export default function NotificationBell({ userId, userRole }: NotificationBellProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

    // Use the central notification handler for consistent navigation
    const { handleNotificationResponse } = require('@/app/_utils/pushNotificationService');
    
    // Construct a response object compatible with handleNotificationResponse
    const dummyResponse = {
        notification: {
            request: {
                content: {
                    data: {
                        ...notification.data,
                        bookingId: notification.bookingId || notification.data?.bookingId,
                        chatId: notification.data?.chatId,
                        vendorId: notification.data?.vendorId,
                        clientId: notification.data?.clientId
                    }
                }
            }
        }
    } as any;
    
    setModalVisible(false);
    handleNotificationResponse(dummyResponse, router, userRole);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to delete all notifications? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive",
          onPress: async () => {
            await deleteAllNotifications();
            await dismissAllTrayNotifications();
            refresh();
          }
        }
      ]
    );
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    refresh();
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const hours = Math.floor(diffMs / 3600000);
      if (hours < 24) return `${hours}h ago`;
      
      const days = Math.floor(hours / 24);
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days}d ago`;
      
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const getNotificationIcon = (type: string) => {
    const size = 16;
    const lowerType = type ? type.toLowerCase() : '';
    switch (lowerType) {
      case 'booking_request':
      case 'booking_update':
        return <Clock size={size} color={Colors.warning} />;
      case 'booking_accepted':
      case 'booking_completed':
      case 'success':
        return <Check size={size} color={Colors.success} />;
      case 'booking_rejected':
      case 'booking_cancelled':
      case 'error':
        return <X size={size} color={Colors.error} />;
      case 'new_message':
        return <MessageSquare size={size} color={userRole === 'vendor' ? Colors.vendor : Colors.primary} />;
      default:
        return <Info size={size} color={Colors.info} />;
    }
  };

  const getStatusBg = (type: string) => {
    const lowerType = type ? type.toLowerCase() : '';
    switch (lowerType) {
      case 'booking_request':
      case 'booking_update':
        return Colors.warningLight;
      case 'booking_accepted':
      case 'booking_completed':
      case 'success':
        return Colors.successLight;
      case 'booking_rejected':
      case 'booking_cancelled':
      case 'error':
        return Colors.errorLight;
      default:
        return Colors.lightGray;
    }
  };

  const primaryColor = userRole === 'vendor' ? Colors.vendor : Colors.primary;

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
            className="absolute top-1 right-1 rounded-full items-center justify-center border-2 border-white"
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
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View 
            style={[
              styles.modalContent, 
              { 
                height: '80%', 
                paddingBottom: Math.max(insets.bottom, 16) 
              }
            ]}
          >
            {/* Bottom Sheet Drag Indicator */}
            <View className="items-center py-3">
              <View className="w-12 h-1.5 rounded-full bg-slate-200" />
            </View>

            {/* Header */}
            <View className="flex-row justify-between items-center px-6 pb-4 border-b border-slate-100">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl font-extrabold" style={{ color: Colors.textPrimary }}>Notifications</Text>
                {displayCount > 0 && (
                  <View className="px-2 py-0.5 rounded-full bg-red-100">
                    <Text className="text-[10px] font-bold text-red-600">{displayCount} new</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="w-8 h-8 rounded-full items-center justify-center bg-slate-100 active:bg-slate-200"
              >
                <X size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Quick Actions Panel */}
            {notifications.length > 0 && (
              <View className="flex-row justify-between items-center px-6 py-3 bg-slate-50 border-b border-slate-100">
                <Text className="text-xs font-semibold text-slate-500">
                  {displayCount > 0 ? `${displayCount} unread` : 'All caught up'}
                </Text>
                <View className="flex-row gap-2">
                  {displayCount > 0 && (
                    <TouchableOpacity 
                      onPress={handleMarkAllRead}
                      className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg active:opacity-80"
                      style={{ backgroundColor: primaryColor + '15' }}
                    >
                      <Check size={12} color={primaryColor} />
                      <Text className="text-[11px] font-bold" style={{ color: primaryColor }}>Mark Read</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    onPress={handleClearAll}
                    className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 active:bg-red-100"
                  >
                    <Trash2 size={12} color={Colors.error} />
                    <Text className="text-[11px] font-bold" style={{ color: Colors.error }}>Clear All</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* List */}
            {notifications.length === 0 ? (
              <View className="flex-1 justify-center items-center px-10 py-12">
                <View 
                  className="w-20 h-20 rounded-full items-center justify-center mb-5"
                  style={{ backgroundColor: primaryColor + '10' }}
                >
                  <View 
                    className="w-14 h-14 rounded-full items-center justify-center"
                    style={{ backgroundColor: primaryColor + '20' }}
                  >
                    <BellOff size={28} color={primaryColor} />
                  </View>
                </View>
                <Text className="text-base font-extrabold text-center" style={{ color: Colors.textPrimary }}>All Caught Up!</Text>
                <Text className="text-xs font-medium mt-2 text-center text-slate-400 leading-relaxed max-w-[240px]">
                  No new alerts here. We'll notify you when you receive a message or booking update.
                </Text>
              </View>
            ) : (
              <ScrollView 
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
              >
                {notifications.map((notification) => {
                  const isRead = notification.isRead;
                  return (
                    <Pressable
                      key={notification.id}
                      onPress={() => handleNotificationPress(notification)}
                      className="mb-3 p-4 rounded-xl flex-row items-start"
                      style={[
                        styles.notificationCard,
                        { 
                          backgroundColor: isRead ? Colors.white : Colors.white,
                          borderWidth: 1,
                          borderColor: isRead ? Colors.border : Colors.border,
                          borderLeftWidth: isRead ? 1 : 4,
                          borderLeftColor: isRead ? Colors.border : primaryColor,
                        }
                      ]}
                    >
                      {/* Left Icon */}
                      <View 
                        className="w-9 h-9 rounded-lg items-center justify-center mr-3"
                        style={{ backgroundColor: getStatusBg(notification.type) + '40' }}
                      >
                        {getNotificationIcon(notification.type)}
                      </View>

                      {/* Content */}
                      <View className="flex-1">
                        <View className="flex-row justify-between items-start mb-0.5">
                          <Text 
                            className="text-xs font-extrabold flex-1 mr-2" 
                            style={{ color: Colors.textPrimary }}
                            numberOfLines={1}
                          >
                            {notification.title}
                          </Text>
                          <Text className="text-[10px] font-bold text-slate-400">
                            {formatRelativeTime(notification.createdAt)}
                          </Text>
                        </View>
                        
                        <Text 
                          className="text-[11px] font-medium leading-normal" 
                          style={{ color: Colors.textSecondary }}
                          numberOfLines={2}
                        >
                          {notification.message}
                        </Text>
                      </View>

                      {/* Delete Action button */}
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="p-1 rounded-lg active:bg-slate-100 ml-2"
                      >
                        <Trash2 size={13} color={Colors.error} opacity={0.6} />
                      </TouchableOpacity>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            
            {/* Footer */}
            <View className="px-6 pt-4 border-t border-slate-100">
              <TouchableOpacity 
                className="py-3.5 rounded-xl items-center justify-center active:opacity-95"
                style={{ backgroundColor: Colors.lightGray }}
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-xs font-bold" style={{ color: Colors.textPrimary }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.4)', 
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    ...Shadows.large,
  },
  notificationCard: {
    ...Shadows.small,
  }
});

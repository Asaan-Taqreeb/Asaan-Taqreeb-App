import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, SafeAreaView } from 'react-native';
import { Bell, X, Check, Clock } from 'lucide-react-native';
import { Colors } from '@/app/_constants/theme';
import { useUnreadNotificationCount } from '@/app/_context/NotificationContext';
import { getNotifications, markNotificationAsRead } from '@/app/_utils/notificationService';
import type { Notification } from '@/app/_utils/notificationService';

interface NotificationBellProps {
  userId?: string;
  userRole?: 'client' | 'vendor';
}

export default function NotificationBell({ userId, userRole }: NotificationBellProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const unreadCount = useUnreadNotificationCount(modalVisible);

  const openNotifications = async () => {
    setModalVisible(true);
    setIsLoading(true);
    try {
      const notifs = await getNotifications(50);
      setNotifications(notifs);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );
    }

    // Handle navigation based on notification type
    if (notification.actionUrl) {
      // TODO: Navigate to the action URL
      console.log('Navigate to:', notification.actionUrl);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_request':
        return <Clock size={16} color={Colors.warning} />;
      case 'booking_accepted':
        return <Check size={16} color={Colors.success} />;
      case 'booking_rejected':
        return <X size={16} color={Colors.error} />;
      default:
        return <Bell size={16} color={Colors.textSecondary} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking_request':
        return '#fff3cd';
      case 'booking_accepted':
        return '#d4edda';
      case 'booking_rejected':
        return '#f8d7da';
      default:
        return '#e9ecef';
    }
  };

  return (
    <>
      {/* Notification Bell Button */}
      <TouchableOpacity
        onPress={openNotifications}
        style={{
          position: 'relative',
          padding: 8,
        }}
      >
        <Bell size={24} color={Colors.textPrimary} />
        {unreadCount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              backgroundColor: Colors.error,
              borderRadius: 10,
              width: 20,
              height: 20,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 12,
                fontWeight: '700',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Notifications Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: Colors.white,
              borderBottomWidth: 1,
              borderBottomColor: Colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: Colors.textPrimary,
              }}
            >
              Notifications
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                padding: 8,
                borderRadius: 20,
                backgroundColor: '#f0f0f0',
              }}
            >
              <X size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Notifications List */}
          {isLoading ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : notifications.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 16,
              }}
            >
              <Bell size={48} color={Colors.border} />
              <Text
                style={{
                  marginTop: 16,
                  fontSize: 16,
                  color: Colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                No notifications yet
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingVertical: 8 }}
              showsVerticalScrollIndicator={false}
            >
              {notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  onPress={() => handleNotificationPress(notification)}
                  style={{
                    marginVertical: 4,
                    marginHorizontal: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    backgroundColor: notification.isRead
                      ? Colors.white
                      : '#f0f7ff',
                    borderRadius: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: getNotificationColor(notification.type),
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                      <Text
                        style={{
                          marginLeft: 8,
                          fontSize: 14,
                          fontWeight: '600',
                          color: Colors.textPrimary,
                          flex: 1,
                        }}
                      >
                        {notification.title}
                      </Text>
                      {!notification.isRead && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: Colors.primary,
                            marginLeft: 8,
                          }}
                        />
                      )}
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        color: Colors.textSecondary,
                        marginBottom: 4,
                      }}
                    >
                      {notification.message}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: Colors.textTertiary,
                      }}
                    >
                      {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                      {new Date(notification.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

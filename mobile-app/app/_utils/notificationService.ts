import { BOOKING_ENDPOINTS } from '@/app/_constants/apiEndpoints';
import { apiFetchJson } from './apiClient';

export type Notification = {
  id: string;
  type: 'booking_request' | 'booking_accepted' | 'booking_rejected' | 'booking_cancelled' | 'message';
  title: string;
  message: string;
  bookingId?: string;
  userId?: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
};

export type NotificationResponse = {
  success: boolean;
  data: Notification[];
  unreadCount?: number;
};

/**
 * Get unread notifications for the current user
 */
export const getNotifications = async (limit: number = 10): Promise<Notification[]> => {
  try {
    const response = await apiFetchJson<any>(
      `${BOOKING_ENDPOINTS.myBookings.split('/')[0]}/../notifications?limit=${limit}`,
      { method: 'GET', auth: true },
      'Failed to load notifications'
    );

    return Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    console.warn('Notification fetch failed, returning empty list');
    return [];
  }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const response = await apiFetchJson<any>(
      `${BOOKING_ENDPOINTS.myBookings.split('/')[0]}/../notifications/unread-count`,
      { method: 'GET', auth: true },
      'Failed to load unread count'
    );

    return response?.data?.unreadCount || 0;
  } catch (error) {
    console.warn('Unread count fetch failed');
    return 0;
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    await apiFetchJson<any>(
      `${BOOKING_ENDPOINTS.myBookings.split('/')[0]}/../notifications/${notificationId}/read`,
      { method: 'POST', auth: true },
      'Failed to mark notification as read'
    );
    return true;
  } catch (error) {
    console.warn('Mark notification as read failed');
    return false;
  }
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async (): Promise<boolean> => {
  try {
    await apiFetchJson<any>(
      `${BOOKING_ENDPOINTS.myBookings.split('/')[0]}/../notifications/clear`,
      { method: 'POST', auth: true },
      'Failed to clear notifications'
    );
    return true;
  } catch (error) {
    console.warn('Clear notifications failed');
    return false;
  }
};

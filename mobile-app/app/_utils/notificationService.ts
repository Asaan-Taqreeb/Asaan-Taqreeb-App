import { NOTIFICATION_ENDPOINTS } from '@/app/_constants/apiEndpoints';
import { apiFetchJson } from './apiClient';

export type Notification = {
  id: string;
  type: 'BOOKING_UPDATE' | 'NEW_MESSAGE' | 'SYSTEM' | string;
  title: string;
  message: string;
  body?: string;
  bookingId?: string;
  userId?: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  data?: Record<string, any>;
};

export type NotificationResponse = {
  success: boolean;
  data: Notification[];
  unreadCount?: number;
};

/**
 * Get notifications for the current user
 */
export const getNotifications = async (limit: number = 20): Promise<Notification[]> => {
  try {
    const response = await apiFetchJson<any>(
      `${NOTIFICATION_ENDPOINTS.getAll}?limit=${limit}`,
      { method: 'GET', auth: true },
      'Failed to load notifications'
    );

    const raw = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : []);
    return raw.map((item: any) => ({
      ...item,
      id: item._id || item.id,
      message: item.body || item.message || '',
    }));
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
      NOTIFICATION_ENDPOINTS.unreadCount,
      { method: 'GET', auth: true },
      'Failed to load unread count'
    );

    return response?.count ?? response?.data?.count ?? 0;
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
      NOTIFICATION_ENDPOINTS.markAsRead(notificationId),
      { method: 'PUT', auth: true },
      'Failed to mark notification as read'
    );
    return true;
  } catch (error) {
    console.warn('Mark notification as read failed');
    return false;
  }
};

/**
 * Mark all notifications as read
 */
export const clearAllNotifications = async (): Promise<boolean> => {
  try {
    await apiFetchJson<any>(
      NOTIFICATION_ENDPOINTS.markAllAsRead,
      { method: 'PUT', auth: true },
      'Failed to mark all as read'
    );
    return true;
  } catch (error) {
    console.warn('Mark all as read failed');
    return false;
  }
};

/**
 * Delete all notifications
 */
export const deleteAllNotifications = async (): Promise<boolean> => {
  try {
    await apiFetchJson<any>(
      NOTIFICATION_ENDPOINTS.deleteAll,
      { method: 'DELETE', auth: true },
      'Failed to delete all notifications'
    );
    return true;
  } catch (error) {
    console.warn('Delete all notifications failed');
    return false;
  }
};

/**
 * Delete a specific notification
 */
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    await apiFetchJson<any>(
      NOTIFICATION_ENDPOINTS.delete(notificationId),
      { method: 'DELETE', auth: true },
      'Failed to delete notification'
    );
    return true;
  } catch (error) {
    console.warn('Delete notification failed');
    return false;
  }
};

export default function NotificationServiceRouteStub() {
  return null;
}

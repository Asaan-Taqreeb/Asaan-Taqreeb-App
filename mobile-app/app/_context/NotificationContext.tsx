import { useEffect, useState, useRef } from 'react';
import { getNotifications, getUnreadNotificationCount } from '../_utils/notificationService';
import type { Notification } from '../_utils/notificationService';

export const useNotifications = (enabled: boolean = true) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const [notifs, count] = await Promise.all([
        getNotifications(20),
        getUnreadNotificationCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start polling when component mounts
  useEffect(() => {
    if (!enabled) return;

    // Fetch immediately
    fetchNotifications();

    // Poll every 10 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [enabled]);

  const refresh = () => fetchNotifications();

  return {
    notifications,
    unreadCount,
    isLoading,
    refresh,
  };
};

/**
 * Hook for single notification count (lighter weight)
 */
export const useUnreadNotificationCount = (enabled: boolean = true) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchCount = async () => {
      try {
        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    // Fetch immediately
    fetchCount();

    // Poll every 10 seconds
    pollIntervalRef.current = setInterval(fetchCount, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [enabled]);

  return unreadCount;
};

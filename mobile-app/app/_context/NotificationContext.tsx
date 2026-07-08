import React, { useState, useEffect, useRef } from 'react';
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead, clearAllNotifications } from '../_utils/notificationService';
import type { Notification } from '../_utils/notificationService';
import { getUserChats } from '../_utils/messagesApi';
import { registerChatListener, unregisterChatListener, triggerChatRefresh } from '../_utils/chatEvents';

export const useNotifications = (enabled: boolean = true) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const pollIntervalRef = useRef<any>(null);

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

  const markAsRead = async (id: string) => {
    const success = await markNotificationAsRead(id);
    if (success) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    return success;
  };

  const markAllAsRead = async () => {
    const success = await clearAllNotifications();
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
    return success;
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
    markAsRead,
    markAllAsRead,
  };
};

/**
 * Hook for single notification count (lighter weight)
 */
export const useUnreadNotificationCount = (enabled: boolean = true) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const pollIntervalRef = useRef<any>(null);

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

export function registerUnreadMessageCountListener(listener: () => void) {
  registerChatListener(listener);
}

export function unregisterUnreadMessageCountListener(listener: () => void) {
  unregisterChatListener(listener);
}

export function triggerUnreadMessageCountRefresh() {
  triggerChatRefresh();
}

/**
 * Hook for single unread chat message count
 */
export const useUnreadMessageCount = (enabled: boolean = true) => {
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const pollIntervalRef = useRef<any>(null);

  const fetchCount = async () => {
    try {
      const chats = await getUserChats();
      const count = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
      setUnreadMessageCount(count);
    } catch (error) {
      console.error('Failed to fetch unread message count:', error);
    }
  };

  const fetchCountRef = useRef(fetchCount);
  fetchCountRef.current = fetchCount;

  useEffect(() => {
    if (!enabled) return;

    // Fetch immediately
    fetchCountRef.current();

    // Poll every 10 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchCountRef.current();
    }, 10000);

    const listener = () => {
      fetchCountRef.current();
    };

    registerChatListener(listener);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      unregisterChatListener(listener);
    };
  }, [enabled]);

  return unreadMessageCount;
};

export default function NotificationContextStub() {
  return null;
}


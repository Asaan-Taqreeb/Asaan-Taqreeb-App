import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from './UserContext';
import { getAccessToken } from '../_utils/authStorage';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadNotificationCount: number;
  clearNotificationCount: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  unreadNotificationCount: 0,
  clearNotificationCount: () => {},
});

export const useSocket = () => useContext(SocketContext);

// Use the live Render backend for socket connections
const SOCKET_URL = 'https://asaantaqreeb.duckdns.org';

// ---------------------------------------------------------------------------
// Booking-refresh listener registry (module-level singleton)
// Screens that display booking data can register a callback here.
// When a BOOKING_UPDATE socket event arrives, all callbacks are invoked.
// ---------------------------------------------------------------------------
type BookingRefreshCallback = () => void;
const bookingRefreshListeners = new Set<BookingRefreshCallback>();

export function registerBookingRefreshListener(cb: BookingRefreshCallback) {
  bookingRefreshListeners.add(cb);
}

export function unregisterBookingRefreshListener(cb: BookingRefreshCallback) {
  bookingRefreshListeners.delete(cb);
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const { user } = useUser();

  useEffect(() => {
    let newSocket: Socket | null = null;

    const connectSocket = async () => {
      if (!user) {
        if (socket) {
          socket.disconnect();
          setSocket(null);
          setIsConnected(false);
          setUnreadNotificationCount(0);
        }
        return;
      }

      console.log('🔌 SocketProvider: Initializing connection to:', SOCKET_URL);

      // Initialize socket with dynamic auth callback (fetches fresh token from AsyncStorage)
      newSocket = io(SOCKET_URL, {
        auth: async (cb) => {
          const token = await getAccessToken();
          cb({ token: token ?? '' });
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 2000,
        timeout: 10000,
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected to backend. ID:', newSocket?.id);
        setIsConnected(true);
        // Join personal room for notifications
        if (user?.id || user?._id) {
          const roomId = user.id || user._id;
          console.log('Socket - joining room:', roomId);
          newSocket?.emit('joinRoom', roomId);
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected, reason:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', async (error) => {
        console.warn('⚠️ Socket connection error:', error.message);
        setIsConnected(false);

        // If the error is related to authentication, fetch a fresh token immediately and reconnect
        if (
          error.message.toLowerCase().includes('auth') || 
          error.message.toLowerCase().includes('token') ||
          error.message.toLowerCase().includes('expired')
        ) {
          console.log('Socket authentication failed. Refreshing token...');
          const freshToken = await getAccessToken();
          if (freshToken && newSocket) {
            newSocket.auth = { token: freshToken };
            newSocket.connect();
          }
        }
      });

      // Listen for real-time notifications
      newSocket.on('newNotification', (notification: any) => {
        setUnreadNotificationCount(prev => prev + 1);

        // If this is a booking update, fire all registered booking listeners
        // so screens like VendorDashboardHome re-fetch data immediately.
        const type = notification?.type;
        if (type === 'BOOKING_UPDATE' || type === 'NEW_BOOKING') {
          bookingRefreshListeners.forEach(cb => {
            try { cb(); } catch (_) {}
          });
        }
      });

      // Listen for new message notifications (when user is NOT in the chat screen)
      newSocket.on('newMessageNotification', () => {
        setUnreadNotificationCount(prev => prev + 1);
      });

      setSocket(newSocket);
    };

    connectSocket();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user]);

  const clearNotificationCount = () => setUnreadNotificationCount(0);

  return (
    <SocketContext.Provider value={{ socket, isConnected, unreadNotificationCount, clearNotificationCount }}>
      {children}
    </SocketContext.Provider>
  );
};

export default function SocketContextRouteStub() {
  return null;
}

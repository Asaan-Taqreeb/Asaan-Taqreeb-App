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
const SOCKET_URL = 'https://asaan-taqreeb-backend.onrender.com';

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

      const token = await getAccessToken();
      if (!token) return;

      newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      newSocket.on('connect', () => {
        console.log('Socket connected to Render backend');
        setIsConnected(true);
        // Join personal room for notifications
        if (user?.id) {
          console.log('Socket - joining room:', user.id);
          newSocket?.emit('joinRoom', user.id);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      // Listen for real-time notifications
      newSocket.on('newNotification', () => {
        setUnreadNotificationCount(prev => prev + 1);
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

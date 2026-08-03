'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getStoredAccessToken, getRefreshedToken, notifyAuthExpired } from '@/src/lib/api.client';
import type { NotificationItem } from '@/src/types/notification.types';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface UseNotificationSocketOptions {
  enabled: boolean;
  onNewNotification: (notification: NotificationItem) => void;
}

export function useNotificationSocket({
  enabled,
  onNewNotification,
}: UseNotificationSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;
    const token = getStoredAccessToken();
    if (!token) return;

    // Use a function to resolve the current token so reconnects get the latest one
    const socket = io(`${WS_URL}/notifications`, {
      auth: (cb) => {
        const t = getStoredAccessToken();
        cb({ token: t });
      },
      transports: ['websocket'],
    });

    socket.on('notification.new', (data: NotificationItem) => {
      onNewNotification(data);
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket Connected to Notifications namespace');
    });

    socket.on('connect_error', async (err) => {
      console.error('❌ WebSocket Connection Error:', err.message);
      // If unauthorized, token might be expired. Try to refresh.
      if (err.message.includes('Unauthorized') || err.message.includes('Authentication')) {
        const refreshedToken = await getRefreshedToken();
        if (refreshedToken) {
          socket.connect();
        } else {
          notifyAuthExpired();
        }
      }
    });

    socketRef.current = socket;
  }, [enabled, onNewNotification]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { disconnect, getSocket: () => socketRef.current };
}

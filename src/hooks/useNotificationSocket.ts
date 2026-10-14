'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { notifyAuthExpired } from '@/src/lib/api.client';
import { useSession } from 'next-auth/react';
import type { NotificationItem, ChatToastPayload } from '@/src/types/notification.types';
import { NotificationType } from '@/src/types/notification.types';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface UseNotificationSocketOptions {
  enabled: boolean;
  onNewNotification: (notification: NotificationItem) => void;
  onNewChatToast?: (toast: ChatToastPayload) => void;
}

export function useNotificationSocket({
  enabled,
  onNewNotification,
  onNewChatToast,
}: UseNotificationSocketOptions) {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;
    const token = session?.accessToken;
    if (!token) return;

    // Use a function to resolve the current token so reconnects get the latest one
    const socket = io(`${WS_URL}/notifications`, {
      auth: (cb) => {
        const t = session?.accessToken;
        cb({ token: t });
      },
      transports: ['websocket'],
    });

    socket.on('notification.new', (data: NotificationItem) => {
      onNewNotification(data);

      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        const baseOptions: NotificationOptions = {
          icon: '/favicon.ico',
          tag: data.conversationId ?? data.id,
        };
        switch (data.type) {
          case NotificationType.AGENT_HANDOFF_REQUEST:
            new Notification('⚠️ Agent Handoff Requested', { ...baseOptions, body: data.message });
            break;
          case NotificationType.CONVERSATION_WAITING:
            new Notification('💬 New Conversation', { ...baseOptions, body: data.message });
            break;
          case NotificationType.CONVERSATION_CLOSED:
            new Notification('✅ Conversation Closed', { ...baseOptions, body: data.message });
            break;
          case NotificationType.NEGATIVE_SENTIMENT:
            new Notification('⚠️ Negative Sentiment Detected', {
              ...baseOptions,
              body: data.message,
            });
            break;
          default:
            break;
        }
      }
    });

    socket.on('chat.toast', (data: ChatToastPayload) => {
      const isChatPage =
        typeof window !== 'undefined' &&
        window.location.pathname.includes(`/live-chats/${data.conversationId}`);

      if (!isChatPage) {
        onNewChatToast?.(data);
        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          new Notification(data.title, {
            body: `New message from ${data.visitorName}`,
            icon: '/favicon.ico',
            tag: data.conversationId,
          });
        }
      }
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket Connected to Notifications namespace');
    });

    socket.on('connect_error', async (err) => {
      console.error('❌ WebSocket Connection Error:', err.message);
      // If unauthorized, token might be expired. Try to refresh.
      if (err.message.includes('Unauthorized') || err.message.includes('Authentication')) {
        notifyAuthExpired();
      }
    });

    socketRef.current = socket;
  }, [enabled, onNewNotification, session?.accessToken]);

  const disconnect = useCallback(() => {
    socketRef.current?.off('chat.toast');
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { disconnect, getSocket: () => socketRef.current };
}

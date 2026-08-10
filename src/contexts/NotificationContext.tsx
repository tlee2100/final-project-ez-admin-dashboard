'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

import { message as antMessage } from 'antd';
import type { NotificationItem, ChatToastPayload } from '@/src/types/notification.types';
import {
  getNotificationsApi,
  markAsReadApi,
  markAllAsReadApi,
  deleteNotificationApi,
  deleteAllNotificationsApi,
} from '@/src/services/notification.service';
import { useAuth } from './AuthContext';
import { useNotificationSocket } from '../hooks/useNotificationSocket';
import { Socket } from 'socket.io-client';

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  getSocket: () => Socket | null;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 10;

  const fetchNotifications = useCallback(
    async (pageNum = 1, append = false) => {
      if (!isAuthenticated) return;
      try {
        setIsLoading(true);
        const res = await getNotificationsApi(undefined, pageNum, LIMIT);
        const fetchedData = res.data;

        setNotifications((prev) => (append ? [...prev, ...fetchedData] : fetchedData));
        setHasMore(fetchedData.length === LIMIT);
        setPage(pageNum);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated],
  );

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await fetchNotifications(page + 1, true);
    }
  }, [isLoading, hasMore, page, fetchNotifications]);

  useEffect(() => {
    if (isAuthenticated) {
      const timeoutId = setTimeout(() => {
        fetchNotifications().catch(console.error);
      }, 1000);
      return () => clearTimeout(timeoutId);
    } else {
      const timeoutId = setTimeout(() => {
        setNotifications([]);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, fetchNotifications]);

  const handleNewNotification = useCallback((notification: NotificationItem) => {
    setNotifications((prev) => [notification, ...prev]);
    window.dispatchEvent(new CustomEvent('new_notification'));
  }, []);

  const handleChatToast = useCallback((toast: ChatToastPayload) => {
    void antMessage.info({
      content: toast.title,
      duration: 5,
    });
  }, []);

  const { getSocket } = useNotificationSocket({
    enabled: isAuthenticated,
    onNewNotification: handleNewNotification,
    onNewChatToast: handleChatToast,
  });

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
        );
        await markAsReadApi(id);
      } catch (error) {
        console.error('Failed to mark notification as read', error);
        fetchNotifications();
      }
    },
    [fetchNotifications],
  );

  const markAllAsRead = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => (!n.readAt ? { ...n, readAt: now } : n)));
      await markAllAsReadApi();
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        await deleteNotificationApi(id);
      } catch (error) {
        console.error('Failed to delete notification', error);
        fetchNotifications();
      }
    },
    [fetchNotifications],
  );

  const deleteAllNotifications = useCallback(async () => {
    try {
      setNotifications([]);
      await deleteAllNotificationsApi();
    } catch (error) {
      console.error('Failed to delete all notifications', error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.readAt).length;
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        hasMore,
        loadMore,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        getSocket,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within <NotificationProvider>');
  }
  return ctx;
}

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import type { NotificationItem } from '@/src/types/notification.types';
import {
  getNotificationsApi,
  markAsReadApi,
  markAllAsReadApi,
  deleteNotificationApi,
  deleteAllNotificationsApi,
} from '@/src/services/notification.service';
import { useAuth } from './AuthContext';
import { useNotificationSocket } from '../hooks/useNotificationSocket';

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
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

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const data = await getNotificationsApi();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

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
  }, []);

  const { getSocket } = useNotificationSocket({
    enabled: isAuthenticated,
    onNewNotification: handleNewNotification,
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

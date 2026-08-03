import { apiRequest } from '@/src/lib/api.client';
import type { NotificationItem } from '@/src/types/notification.types';

export async function getNotificationsApi(isRead?: boolean): Promise<NotificationItem[]> {
  const query = isRead !== undefined ? `?isRead=${isRead}` : '';
  return apiRequest<NotificationItem[]>(`/notifications${query}`, {
    method: 'GET',
    requiresAuth: true,
  });
}

export async function markAsReadApi(id: string): Promise<NotificationItem> {
  return apiRequest<NotificationItem>(`/notifications/${id}/mark-read`, {
    method: 'PATCH',
    requiresAuth: true,
  });
}

export async function markAllAsReadApi(): Promise<void> {
  await apiRequest<void>('/notifications/mark-all-read', {
    method: 'PATCH',
    requiresAuth: true,
  });
}

export async function deleteNotificationApi(id: string): Promise<void> {
  await apiRequest<void>(`/notifications/${id}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
}

export async function deleteAllNotificationsApi(): Promise<void> {
  await apiRequest<void>('/notifications', {
    method: 'DELETE',
    requiresAuth: true,
  });
}

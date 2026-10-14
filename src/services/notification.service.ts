import { apiRequest } from '@/src/lib/api.client';
import type { NotificationItem } from '@/src/types/notification.types';

interface NotificationApiResponse {
  data?: NotificationItem[];
  meta?: { totalItems?: number };
}

export async function getNotificationsApi(
  isRead?: boolean,
  page = 1,
  limit = 10,
): Promise<{ data: NotificationItem[]; totalItems: number }> {
  let query = `?page=${page}&limit=${limit}`;
  if (isRead !== undefined) {
    query += `&isRead=${isRead}`;
  }
  const response = await apiRequest<NotificationApiResponse | NotificationItem[]>(
    `/notifications${query}`,
    {
      method: 'GET',
      requiresAuth: true,
    },
  );
  // Handle both array and paginated { data, meta } formats
  if (Array.isArray(response)) {
    return { data: response, totalItems: response.length };
  }
  return { data: response.data || [], totalItems: response.meta?.totalItems || 0 };
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

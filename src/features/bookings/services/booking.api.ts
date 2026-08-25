import type { Key } from 'react';
import { apiRequest } from '@/src/lib/api.client';
import type {
  AvailableSlot,
  BlockoutRecord,
  BookingConfig,
  BookingRecord,
  CreateBlockoutFormData,
} from '../types/booking.types';

export const bookingApi = {
  /**
   * Fetch available booking slots for a given date range and resource
   */
  async getAvailableSlots(
    siteId: string,
    params: { startDate: string; endDate: string; resourceId?: string },
  ): Promise<AvailableSlot[]> {
    const query = new URLSearchParams();
    query.append('startDate', params.startDate);
    query.append('endDate', params.endDate);
    if (params.resourceId) query.append('resourceId', params.resourceId);

    const data = await apiRequest<{ slots: AvailableSlot[] }>(
      `/admin/bookings/${siteId}/available-slots?${query.toString()}`,
    );
    return data?.slots || [];
  },

  /**
   * Create a new booking
   */
  async createBooking(
    siteId: string,
    payload: {
      startAt?: string;
      endAt?: string;
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      serviceId?: string;
      serviceIds?: string[];
      staffId?: string;
      slots?: Array<{
        resourceId: string;
        date: string;
        timeSlot: string;
        serviceId?: string;
      }>;
      notes?: string;
      timezone: string;
      sessionId: string;
    },
  ): Promise<BookingRecord> {
    return apiRequest<BookingRecord>(`/admin/bookings/${siteId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update the status of a specific booking
   */
  async updateStatus(siteId: string, bookingId: string, status: string): Promise<BookingRecord> {
    return apiRequest<BookingRecord>(`/admin/bookings/${siteId}/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: status.toLowerCase() }),
    });
  },

  /**
   * Cancel multiple bookings at once in a single consolidated request
   */
  async bulkCancel(
    siteId: string,
    bookingIds: Key[],
  ): Promise<{ success: boolean; cancelledCount: number }> {
    return apiRequest<{ success: boolean; cancelledCount: number }>(
      `/admin/bookings/${siteId}/bulk-cancel`,
      {
        method: 'POST',
        body: JSON.stringify({ bookingIds: bookingIds.map(String) }),
      },
    );
  },

  /**
   * Fetch all blockout periods for a site
   */
  async getBlockouts(
    siteId: string,
    params?: { startDate?: string; endDate?: string; resourceId?: string },
  ): Promise<BlockoutRecord[]> {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.resourceId) query.append('resourceId', params.resourceId);

    const queryStr = query.toString();
    const endpoint = `/admin/bookings/${siteId}/blockouts${queryStr ? `?${queryStr}` : ''}`;
    const data = await apiRequest<BlockoutRecord[]>(endpoint);
    return data || [];
  },

  /**
   * Create a new blockout period
   */
  async createBlockout(siteId: string, payload: CreateBlockoutFormData): Promise<BlockoutRecord> {
    return apiRequest<BlockoutRecord>(`/admin/bookings/${siteId}/blockouts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete a blockout period
   */
  async deleteBlockout(siteId: string, blockoutId: string): Promise<void> {
    await apiRequest(`/admin/bookings/${siteId}/blockouts/${blockoutId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Fetch site booking configuration
   */
  async getBookingConfig(siteId: string): Promise<BookingConfig> {
    return apiRequest<BookingConfig>(`/admin/bookings/${siteId}/booking-config`);
  },

  /**
   * Update site booking configuration
   */
  async updateBookingConfig(
    siteId: string,
    payload: Partial<BookingConfig> | Record<string, unknown>,
  ): Promise<BookingConfig> {
    return apiRequest<BookingConfig>(`/admin/bookings/${siteId}/booking-config`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Hold one or multiple slots in a single consolidated request
   */
  async holdSlots(
    siteId: string,
    payload: {
      sessionId: string;
      slots: Array<{
        resourceId: string;
        startAt: string;
        endAt: string;
        serviceId?: string;
      }>;
    },
  ): Promise<{ success: boolean; sessionId?: string }> {
    return apiRequest<{ success: boolean; sessionId?: string }>(`/admin/bookings/${siteId}/hold`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Release held slots in a single consolidated request
   */
  async releaseHolds(
    siteId: string,
    payload: {
      sessionId: string;
      slots?: Array<{
        resourceId: string;
        startAt: string;
        endAt: string;
      }>;
    },
  ): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/admin/bookings/${siteId}/hold`, {
      method: 'DELETE',
      body: JSON.stringify(payload),
    });
  },
};

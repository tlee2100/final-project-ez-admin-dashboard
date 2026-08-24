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
      `/admin/sites/${siteId}/bookings/available-slots?${query.toString()}`,
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
    return apiRequest<BookingRecord>(`/admin/sites/${siteId}/bookings`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update the status of a specific booking
   */
  async updateStatus(siteId: string, bookingId: string, status: string): Promise<BookingRecord> {
    return apiRequest<BookingRecord>(`/admin/sites/${siteId}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: status.toLowerCase() }),
    });
  },

  /**
   * Cancel multiple bookings at once
   */
  async bulkCancel(siteId: string, bookingIds: Key[]): Promise<void> {
    await Promise.all(
      bookingIds.map((id) =>
        apiRequest(`/admin/sites/${siteId}/bookings/${String(id)}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'cancelled' }),
        }),
      ),
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
    const endpoint = `/admin/sites/${siteId}/bookings/blockouts${queryStr ? `?${queryStr}` : ''}`;
    const data = await apiRequest<BlockoutRecord[]>(endpoint);
    return data || [];
  },

  /**
   * Create a new blockout period
   */
  async createBlockout(siteId: string, payload: CreateBlockoutFormData): Promise<BlockoutRecord> {
    return apiRequest<BlockoutRecord>(`/admin/sites/${siteId}/bookings/blockouts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete a blockout period
   */
  async deleteBlockout(siteId: string, blockoutId: string): Promise<void> {
    await apiRequest(`/admin/sites/${siteId}/bookings/blockouts/${blockoutId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Fetch site booking configuration
   */
  async getBookingConfig(siteId: string): Promise<BookingConfig> {
    return apiRequest<BookingConfig>(`/admin/sites/${siteId}/bookings/booking-config`);
  },

  /**
   * Update site booking configuration
   */
  async updateBookingConfig(
    siteId: string,
    payload: Partial<BookingConfig> | Record<string, unknown>,
  ): Promise<BookingConfig> {
    return apiRequest<BookingConfig>(`/admin/sites/${siteId}/bookings/booking-config`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};

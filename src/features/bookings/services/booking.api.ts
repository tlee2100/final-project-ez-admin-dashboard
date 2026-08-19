import type { Key } from 'react';
import { apiRequest } from '@/src/lib/api.client';
import type { BlockoutRecord, BookingRecord, CreateBlockoutFormData } from '../types/booking.types';

export const bookingApi = {
  /**
   * Create a new booking
   */
  async createBooking(
    siteId: string,
    payload: {
      startAt: string;
      endAt: string;
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      serviceId: string;
      staffId: string;
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
};

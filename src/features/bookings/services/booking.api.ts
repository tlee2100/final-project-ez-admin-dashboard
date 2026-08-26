import type { Key } from 'react';
import { apiRequest } from '@/src/lib/api.client';
import type {
  AvailableSlot,
  BlockoutRecord,
  BookingConfig,
  BookingRecord,
  CreateAdminBookingPayload,
  CreateBlockoutFormData,
  HoldSlotsPayload,
  HoldSlotsResponse,
  ReleaseHoldsPayload,
  ReleaseHoldsResponse,
  BulkCancelResponse,
  UpdateBookingConfigPayload,
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
  async createBooking(siteId: string, payload: CreateAdminBookingPayload): Promise<BookingRecord> {
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
  async bulkCancel(siteId: string, bookingIds: Key[]): Promise<BulkCancelResponse> {
    return apiRequest<BulkCancelResponse>(`/admin/bookings/${siteId}/bulk-cancel`, {
      method: 'POST',
      body: JSON.stringify({ bookingIds: bookingIds.map(String) }),
    });
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
    payload: UpdateBookingConfigPayload | Partial<BookingConfig>,
  ): Promise<BookingConfig> {
    return apiRequest<BookingConfig>(`/admin/bookings/${siteId}/booking-config`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Hold one or multiple slots in a single consolidated request
   */
  async holdSlots(siteId: string, payload: HoldSlotsPayload): Promise<HoldSlotsResponse> {
    return apiRequest<HoldSlotsResponse>(`/admin/bookings/${siteId}/hold`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Release held slots in a single consolidated request
   */
  async releaseHolds(siteId: string, payload: ReleaseHoldsPayload): Promise<ReleaseHoldsResponse> {
    return apiRequest<ReleaseHoldsResponse>(`/admin/bookings/${siteId}/hold`, {
      method: 'DELETE',
      body: JSON.stringify(payload),
    });
  },
};

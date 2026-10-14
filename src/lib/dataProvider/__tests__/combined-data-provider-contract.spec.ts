import { describe, it, expect, vi, beforeEach } from 'vitest';
import { combinedDataProvider } from '../combinedDataProvider';
import * as apiClient from '@/src/lib/api.client';

describe('CombinedDataProvider Contract Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should format pagination and sorters correctly for nestjs-paginate standard', async () => {
    const mockApiResponse = {
      data: [{ id: '1', name: 'Site 1' }],
      meta: { totalItems: 1 },
    };

    const spy = vi.spyOn(apiClient, 'apiRequest').mockResolvedValue(mockApiResponse);

    const response = await combinedDataProvider.getList({
      resource: 'sites',
      pagination: { currentPage: 2, pageSize: 20 },
      sorters: [{ field: 'createdAt', order: 'desc' }],
    });

    expect(response).toEqual({
      data: mockApiResponse.data,
      total: 1,
    });

    expect(spy).toHaveBeenCalledWith('/sites?page=2&limit=20&sortBy=createdAt:DESC');
  });

  it('should redirect resource bookings to site-specific endpoint when meta.siteId is provided', async () => {
    const mockApiResponse = {
      data: [{ id: 'b-1', customerName: 'Alice' }],
      meta: { totalItems: 1 },
    };

    const spy = vi.spyOn(apiClient, 'apiRequest').mockResolvedValue(mockApiResponse);

    await combinedDataProvider.getList({
      resource: 'bookings',
      meta: { siteId: 'site-xyz-123' },
    });

    expect(spy).toHaveBeenCalledWith('/admin/bookings/site-xyz-123');
  });

  it('should handle filters for contains, eq, and in operators', async () => {
    const mockApiResponse = {
      data: [],
      meta: { totalItems: 0 },
    };

    const spy = vi.spyOn(apiClient, 'apiRequest').mockResolvedValue(mockApiResponse);

    await combinedDataProvider.getList({
      resource: 'users',
      filters: [
        { field: 'q', operator: 'contains', value: 'john' },
        { field: 'role', operator: 'eq', value: 'ADMIN' },
        { field: 'status', operator: 'in', value: ['ACTIVE', 'PENDING'] },
      ],
    });

    expect(spy).toHaveBeenCalledWith(
      '/users?search=john&filter.role=$eq:ADMIN&filter.status=$in:ACTIVE%2CPENDING',
    );
  });
});

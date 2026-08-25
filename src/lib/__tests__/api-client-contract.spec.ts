import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, ApiError, API_BASE_URL } from '../api.client';

describe('API Client Contract Tests (apiRequest)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should construct correct API base URL', () => {
    expect(API_BASE_URL).toBe('http://localhost:3000/api/v1');
  });

  it('should successfully return parsed JSON data on 200 response', async () => {
    const mockData = { id: '123', name: 'Test Tenant' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (header: string) => (header === 'content-type' ? 'application/json' : null),
      },
      json: async () => mockData,
    });

    const result = await apiRequest<typeof mockData>('/sites/123', { requiresAuth: false });
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/sites/123',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('should format error message correctly when API returns array of messages', async () => {
    const errorResponse = {
      statusCode: 400,
      message: ['Email is invalid', 'Password is too short'],
      error: 'Bad Request',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: {
        get: (header: string) => (header === 'content-type' ? 'application/json' : null),
      },
      json: async () => errorResponse,
    });

    await expect(apiRequest('/auth/login', { requiresAuth: false })).rejects.toThrow(
      'Email is invalid, Password is too short',
    );
  });

  it('should wrap 503 error on network connection failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error: ECONNREFUSED'));

    try {
      await apiRequest('/health', { requiresAuth: false });
      expect.unreachable('Should have thrown ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.statusCode).toBe(503);
      expect(apiErr.message).toContain('Cannot connect to the API server');
    }
  });
});

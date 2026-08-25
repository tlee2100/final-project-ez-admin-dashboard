import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '@/src/lib/api.client';
import { getMeApi, activateAccountApi, type UserProfileResponse } from '../auth.service';

describe('Auth Service Contract Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should call /users/me with requiresAuth = true in getMeApi', async () => {
    const mockUser: UserProfileResponse = {
      id: 'user-001',
      email: 'admin@ezchatbot.com',
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
    };

    const spy = vi.spyOn(apiClient, 'apiRequest').mockResolvedValue(mockUser);

    const result = await getMeApi();
    expect(result).toEqual(mockUser);
    expect(spy).toHaveBeenCalledWith('/users/me', {
      method: 'GET',
      requiresAuth: true,
    });
  });

  it('should call /auth/activate-account with payload in activateAccountApi', async () => {
    const payload = {
      token: 'invitation-jwt-token-123',
      newPassword: 'SecurePassword123!',
    };
    const mockResponse = { message: 'Account successfully activated' };

    const spy = vi.spyOn(apiClient, 'apiRequest').mockResolvedValue(mockResponse);

    const result = await activateAccountApi(payload);
    expect(result).toEqual(mockResponse);
    expect(spy).toHaveBeenCalledWith('/auth/activate-account', {
      method: 'POST',
      body: JSON.stringify(payload),
      requiresAuth: false,
    });
  });
});

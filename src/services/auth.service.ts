import { apiRequest, setStoredAccessToken } from '@/src/lib/api.client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  fullName?: string;
  name?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'superadmin' | 'admin' | 'agent';
  avatarUrl?: string;
  avatar?: string;
  organizationId?: string | null;
}

export interface LogoutResponse {
  message?: string;
}

export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
  const data = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    requiresAuth: false,
  });

  if (data.accessToken) {
    setStoredAccessToken(data.accessToken);
  }

  return data;
}

export async function getMeApi(): Promise<UserProfileResponse> {
  return apiRequest<UserProfileResponse>('/users/me', {
    method: 'GET',
    requiresAuth: true,
  });
}

export async function refreshTokenApi(): Promise<LoginResponse> {
  const data = await apiRequest<LoginResponse>('/auth/refresh', {
    method: 'POST',
    requiresAuth: false,
  });

  if (data.accessToken) {
    setStoredAccessToken(data.accessToken);
  }

  return data;
}

export async function logoutApi(): Promise<void> {
  try {
    await apiRequest<LogoutResponse>('/auth/logout', {
      method: 'POST',
      requiresAuth: true,
    });
  } catch {
    // Ignore logout network errors
  } finally {
    setStoredAccessToken(null);
  }
}

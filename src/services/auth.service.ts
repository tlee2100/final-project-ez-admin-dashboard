import { apiRequest } from '@/src/lib/api.client';

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

export async function getMeApi(): Promise<UserProfileResponse> {
  return apiRequest<UserProfileResponse>('/users/me', {
    method: 'GET',
    requiresAuth: true,
  });
}

export interface ActivateAccountPayload {
  token: string;
  newPassword: string;
  confirmNewPassword?: string;
}

export async function activateAccountApi(
  payload: ActivateAccountPayload,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/activate-account', {
    method: 'POST',
    body: JSON.stringify(payload),
    requiresAuth: false,
  });
}

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

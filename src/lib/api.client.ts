const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!rawApiBaseUrl) {
  throw new Error('NEXT_PUBLIC_API_URL is required');
}

export const API_BASE_URL: string = rawApiBaseUrl;

import { getSession, signOut } from 'next-auth/react';
import type { Session } from 'next-auth';

export interface ApiErrorResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

/** Dispatched when the session is unrecoverable (refresh failed). */
export const AUTH_EXPIRED_EVENT = 'ez:auth-expired';

export function notifyAuthExpired(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    signOut({ callbackUrl: '/login' });
  }
}

let sessionPromise: Promise<Session | null> | null = null;
let sessionPromiseTime = 0;

async function getCachedSession(): Promise<Session | null> {
  const now = Date.now();
  // Cache the session promise for 5 seconds to deduplicate parallel requests
  if (sessionPromise && now - sessionPromiseTime < 5000) {
    return sessionPromise;
  }
  sessionPromise = getSession();
  sessionPromiseTime = now;
  return sessionPromise;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = true, headers: customHeaders, ...restOptions } = options;
  const isFormData = typeof FormData !== 'undefined' && restOptions.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (requiresAuth) {
    // next-auth session handles token rotation internally
    const session = await getCachedSession();
    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (response.status === 401 && requiresAuth) {
      notifyAuthExpired();
    }

    if (!response.ok) {
      let errorMessage = 'An error occurred while calling the API server';
      if (data) {
        if (Array.isArray(data.message)) {
          errorMessage = data.message.join(', ');
        } else if (typeof data.message === 'string') {
          errorMessage = data.message;
        } else if (typeof data.error === 'string') {
          errorMessage = data.error;
        }
      }
      throw new ApiError(errorMessage, response.status);
    }

    return data as T;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request cancelled', 499);
    }
    throw new ApiError(
      'Cannot connect to the API server (Backend). Please verify the server connection!',
      503,
    );
  }
}

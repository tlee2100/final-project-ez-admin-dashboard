const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!rawApiBaseUrl) {
  throw new Error('NEXT_PUBLIC_API_URL is required');
}

export const API_BASE_URL: string = rawApiBaseUrl;

const TOKEN_KEY = 'ez_chatbot_access_token';
const REFRESH_SESSION_KEY = 'ez_chatbot_has_refresh_session';

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAccessToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function hasRefreshSession(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(REFRESH_SESSION_KEY) === '1';
}

export function setHasRefreshSession(hasSession: boolean): void {
  if (typeof window === 'undefined') return;
  if (hasSession) {
    localStorage.setItem(REFRESH_SESSION_KEY, '1');
  } else {
    localStorage.removeItem(REFRESH_SESSION_KEY);
  }
}

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

// ── Access-token refresh & expiry (401 retry) ────────────────────────────────
// The refresh handler is injected by AuthProvider so this client has no static
// circular dependency on the auth service. The backend rotates (single-use)
// refresh tokens, so concurrent 401s must share one in-flight refresh —
// otherwise the second refresh invalidates the first.
type RefreshHandler = () => Promise<string | null>;

let refreshHandler: RefreshHandler | null = null;
let inflightRefresh: Promise<string | null> | null = null;

export function setRefreshHandler(handler: RefreshHandler | null): void {
  refreshHandler = handler;
  inflightRefresh = null;
}

export async function getRefreshedToken(): Promise<string | null> {
  const handler = refreshHandler;
  if (!handler) return null;
  if (!inflightRefresh) {
    inflightRefresh = handler().finally(() => {
      inflightRefresh = null;
    });
  }
  return inflightRefresh;
}

/** Dispatched when the session is unrecoverable (refresh failed). */
export const AUTH_EXPIRED_EVENT = 'ez:auth-expired';

export function notifyAuthExpired(): void {
  setStoredAccessToken(null);
  setHasRefreshSession(false);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  return doApiRequest<T>(endpoint, options, false);
}

async function doApiRequest<T>(
  endpoint: string,
  options: RequestOptions,
  isRetry: boolean,
): Promise<T> {
  const { requiresAuth = true, headers: customHeaders, ...restOptions } = options;
  const isFormData = typeof FormData !== 'undefined' && restOptions.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (requiresAuth) {
    const token = getStoredAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers,
      credentials: 'include',
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    // Expired access token on an authenticated request: refresh once and
    // retry the original request. If refresh fails (or the retried request
    // still 401s), the session is unrecoverable — clear local auth state so
    // the auth layer can redirect to login. Never retried more than once.
    // The retry reuses `options.body`, so callers must pass a re-usable body
    // (string or FormData); single-consumption streams are unsupported.
    if (response.status === 401 && requiresAuth) {
      if (!isRetry) {
        const refreshedToken = await getRefreshedToken();
        if (refreshedToken) {
          return doApiRequest<T>(endpoint, options, true);
        }
      }
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

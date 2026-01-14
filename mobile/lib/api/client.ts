import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import { API_URL, APP_CONFIG, ERROR_MESSAGES, getTenantApiUrl } from '../constants';
import { decodeJwtPayload } from '../utils/base64';
import { secureStorage } from '../utils/secure-storage';

import type { ApiErrorResponse, ApiResponse } from '@/types/api';

// Request queue for handling token refresh
interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

let isRefreshing = false;
let requestQueue: QueuedRequest[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  requestQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  requestQueue = [];
};

// Create axios instance with unified API gateway
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_URL,  // All requests go through the unified API gateway
    timeout: APP_CONFIG.API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Get tenant info for dynamic URL and headers
      const tenantInfo = await getTenantInfo();

      // Dynamically set baseURL based on tenant slug
      // This ensures each request goes to the correct tenant-specific API
      if (tenantInfo.slug) {
        const tenantApiUrl = getTenantApiUrl(tenantInfo.slug);
        config.baseURL = tenantApiUrl;
        console.log(`[API] Request to ${tenantApiUrl}${config.url} (tenant: ${tenantInfo.slug})`);
      } else {
        console.log(`[API] Request to ${config.baseURL}${config.url} (no tenant slug)`);
      }

      // Add auth token
      const accessToken = await secureStorage.getItem('tesseract_access_token');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;

        // Extract user ID from JWT token and add as X-User-ID header
        // This is required by the tenant service for user-specific endpoints
        try {
          const payload = decodeJwtPayload(accessToken);
          if (payload) {
            const userId = payload.sub || payload.user_id || payload.userId;
            if (userId) {
              config.headers['X-User-ID'] = userId;
            }
          }
        } catch (e) {
          console.log('[API] Failed to extract user ID from token');
        }
      }

      // Add tenant ID headers (both for compatibility with different services)
      if (tenantInfo.id) {
        config.headers['X-Tenant-ID'] = tenantInfo.id;
        config.headers['X-Vendor-ID'] = tenantInfo.id;
      }

      // Add request ID for tracking
      config.headers['X-Request-ID'] = generateRequestId();

      // Add device type for mobile tracking
      config.headers['X-Device-Type'] = 'mobile';

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorResponse>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Skip token refresh for auth endpoints (login, register, etc.)
      const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                            originalRequest.url?.includes('/auth/register') ||
                            originalRequest.url?.includes('/auth/refresh') ||
                            originalRequest.url?.includes('/auth/forgot-password');

      // Handle 401 Unauthorized - Token refresh (but not for auth endpoints)
      if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        if (isRefreshing) {
          // Wait for token refresh
          return new Promise((resolve, reject) => {
            requestQueue.push({
              resolve: (token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(client(originalRequest));
              },
              reject: (err: Error) => {
                reject(err);
              },
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await refreshAccessToken();
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError as Error, null);
          // Clear auth state and redirect to login
          await handleAuthFailure();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Transform error for consistent handling
      const apiError = transformError(error);
      return Promise.reject(apiError);
    }
  );

  return client;
};

// Refresh access token
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = await secureStorage.getItem('tesseract_refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  // Get tenant-specific API URL for refresh
  const tenantInfo = await getTenantInfo();
  const apiUrl = getTenantApiUrl(tenantInfo.slug);

  const response = await axios.post(`${apiUrl}/api/v1/auth/refresh`, {
    refresh_token: refreshToken,
  });

  // Auth API returns flat response: { access_token, refresh_token, expires_in }
  const { access_token, refresh_token: newRefreshToken } = response.data;

  await secureStorage.setItem('tesseract_access_token', access_token);
  await secureStorage.setItem('tesseract_refresh_token', newRefreshToken);

  return access_token;
};

// Get current tenant info (id and slug)
interface TenantInfo {
  id: string | null;
  slug: string | null;
}

const getTenantInfo = async (): Promise<TenantInfo> => {
  try {
    const tenant = await secureStorage.getItem('tesseract_current_tenant');
    if (tenant) {
      const parsed = JSON.parse(tenant);
      return {
        id: parsed.id || null,
        slug: parsed.slug || null,
      };
    }
    return { id: null, slug: null };
  } catch {
    return { id: null, slug: null };
  }
};

// Get current tenant ID (legacy helper)
const getTenantId = async (): Promise<string | null> => {
  const info = await getTenantInfo();
  return info.id;
};

// Handle auth failure
const handleAuthFailure = async (): Promise<void> => {
  await secureStorage.removeItem('tesseract_access_token');
  await secureStorage.removeItem('tesseract_refresh_token');
  await secureStorage.removeItem('tesseract_user');
  // Navigation to login will be handled by auth state listener
};

// Transform axios error to consistent format
const transformError = (error: AxiosError<ApiErrorResponse>): Error => {
  if (!error.response) {
    // Network error
    return new ApiError(ERROR_MESSAGES.NETWORK_ERROR, 0, 'NETWORK_ERROR');
  }

  const { status, data } = error.response;
  let message = data?.error || ERROR_MESSAGES.SERVER_ERROR;

  switch (status) {
    case 400:
      message = data?.error || ERROR_MESSAGES.VALIDATION_ERROR;
      break;
    case 401:
      message = ERROR_MESSAGES.UNAUTHORIZED;
      break;
    case 403:
      message = ERROR_MESSAGES.FORBIDDEN;
      break;
    case 404:
      message = ERROR_MESSAGES.NOT_FOUND;
      break;
    case 429:
      message = ERROR_MESSAGES.RATE_LIMITED;
      break;
    case 500:
    case 502:
    case 503:
      message = ERROR_MESSAGES.SERVER_ERROR;
      break;
  }

  return new ApiError(message, status, data?.errors?.[0]?.code, data?.errors);
};

// Custom API Error class
export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Array<{ code: string; message: string; field?: string }>;

  constructor(
    message: string,
    status: number,
    code?: string,
    errors?: Array<{ code: string; message: string; field?: string }>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }

  isNetworkError(): boolean {
    return this.status === 0;
  }

  isAuthError(): boolean {
    return this.status === 401;
  }

  isValidationError(): boolean {
    return this.status === 400;
  }

  getFieldError(field: string): string | undefined {
    return this.errors?.find((e) => e.field === field)?.message;
  }
}

// Generate unique request ID
const generateRequestId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// Export singleton instance
export const api = createApiClient();
export const apiClient = api; // Alias for convenience

// Typed API helpers
export const apiGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  const response = await api.get<ApiResponse<T>>(url, config);
  return response.data;
};

export const apiPost = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await api.post<ApiResponse<T>>(url, data, config);
  return response.data;
};

export const apiPut = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await api.put<ApiResponse<T>>(url, data, config);
  return response.data;
};

export const apiPatch = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await api.patch<ApiResponse<T>>(url, data, config);
  return response.data;
};

export const apiDelete = async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  const response = await api.delete<ApiResponse<T>>(url, config);
  return response.data;
};

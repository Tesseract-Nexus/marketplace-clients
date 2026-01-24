/**
 * Enhanced API Client with interceptors, retry logic, and error handling
 */

import { API_CONFIG } from '../config/api';
import { ApiException, ERROR_CODES, parseApiError, isRetryableError } from '../utils/api-error';
import { getCsrfTokenFromCookie, fetchCsrfToken, getCsrfHeaderName, requiresCsrfProtection } from '../utils/csrf-client';

type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
type ErrorInterceptor = (error: any) => any;

export class EnhancedApiClient {
  private baseUrl: string;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private authToken: string | null = null;
  private tenantId: string | null = null;
  private vendorId: string | null = null; // Vendor ID for marketplace isolation (Tenant -> Vendor -> Staff)
  private userId: string | null = null;
  private userName: string | null = null;
  private userRole: string | null = null;
  private userEmail: string | null = null;

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
    this.setupDefaultInterceptors();
  }

  /**
   * Setup default interceptors
   */
  private setupDefaultInterceptors() {
    // Add auth and tenant headers for multi-tenant isolation
    this.addRequestInterceptor(async (config) => {
      // Convert Headers object or plain object to a plain object
      // This ensures consistent behavior with fetch()
      const existingHeaders: Record<string, string> = {};
      if (config.headers) {
        if (config.headers instanceof Headers) {
          config.headers.forEach((value, key) => {
            existingHeaders[key] = value;
          });
        } else if (typeof config.headers === 'object') {
          Object.assign(existingHeaders, config.headers);
        }
      }

      if (this.authToken) {
        existingHeaders['Authorization'] = `Bearer ${this.authToken}`;
      }

      // Add tenant ID header for multi-tenant isolation
      // Backend services expect x-jwt-claim-tenant-id header
      if (this.tenantId) {
        existingHeaders['x-jwt-claim-tenant-id'] = this.tenantId;
      }

      // Add vendor ID header for marketplace isolation
      // This is critical for vendor-service to find the correct storefronts
      if (this.vendorId) {
        existingHeaders['x-jwt-claim-vendor-id'] = this.vendorId;
      }

      return { ...config, headers: existingHeaders };
    });

    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      this.addRequestInterceptor(async (config) => {
        console.log('[API Request]', config.method || 'GET', config);
        return config;
      });

      this.addResponseInterceptor(async (response) => {
        console.log('[API Response]', response.status, response.statusText);
        return response;
      });
    }
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  /**
   * Get authentication token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Set tenant ID for multi-tenant isolation
   */
  setTenantId(tenantId: string | null) {
    this.tenantId = tenantId;
  }

  /**
   * Get current tenant ID
   */
  getTenantId(): string | null {
    return this.tenantId;
  }

  /**
   * Set vendor ID for marketplace isolation
   * Used in Tenant -> Vendor -> Staff hierarchy
   * Vendors can only see their own data (products, orders, etc.)
   */
  setVendorId(vendorId: string | null) {
    this.vendorId = vendorId;
  }

  /**
   * Get current vendor ID
   */
  getVendorId(): string | null {
    return this.vendorId;
  }

  /**
   * Set user info for multi-tenant and attribution
   */
  setUserInfo(userId: string | null, userName: string | null, userRole: string | null = 'admin', userEmail: string | null = null) {
    this.userId = userId;
    this.userName = userName;
    this.userRole = userRole;
    this.userEmail = userEmail;
  }

  /**
   * Get current user info
   */
  getUserInfo(): { userId: string | null; userName: string | null; userRole: string | null; userEmail: string | null } {
    return { userId: this.userId, userName: this.userName, userRole: this.userRole, userEmail: this.userEmail };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor) {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Execute request interceptors
   */
  private async executeRequestInterceptors(config: RequestInit): Promise<RequestInit> {
    let modifiedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      modifiedConfig = await interceptor(modifiedConfig);
    }
    return modifiedConfig;
  }

  /**
   * Execute response interceptors
   */
  private async executeResponseInterceptors(response: Response): Promise<Response> {
    let modifiedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      modifiedResponse = await interceptor(modifiedResponse);
    }
    return modifiedResponse;
  }

  /**
   * Execute error interceptors
   */
  private async executeErrorInterceptors(error: any): Promise<any> {
    let modifiedError = error;
    for (const interceptor of this.errorInterceptors) {
      modifiedError = await interceptor(modifiedError);
    }
    return modifiedError;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = API_CONFIG.RETRY_ATTEMPTS
  ): Promise<T> {
    try {
      return await this.request<T>(endpoint, options);
    } catch (error) {
      const apiError = parseApiError(error);

      // Check if error is retryable and we have retries left
      if (retries > 0 && isRetryableError(apiError)) {
        await new Promise((resolve) => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
        const remainingRetries = retries - 1;
        return this.requestWithRetry<T>(endpoint, options, remainingRetries);
      }

      throw new ApiException(apiError);
    }
  }

  /**
   * Core request method
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';

    // Build headers - directly add auth and tenant headers for reliability
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth token if set
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // CRITICAL: Add tenant ID header for multi-tenant isolation
    if (this.tenantId) {
      headers['x-jwt-claim-tenant-id'] = this.tenantId;
    }

    // Add vendor ID header for marketplace isolation (Tenant -> Vendor -> Staff)
    if (this.vendorId) {
      headers['x-jwt-claim-vendor-id'] = this.vendorId;
    }

    // Add user info headers for proper attribution
    if (this.userId) {
      headers['x-jwt-claim-sub'] = this.userId;
    }
    if (this.userName) {
      headers['x-jwt-claim-preferred-username'] = this.userName;
    }
    // Note: User role should come from Istio JWT validation, not client headers
    if (this.userEmail) {
      headers['x-jwt-claim-email'] = this.userEmail;
    }

    // CSRF Protection: Add token for state-changing requests
    if (requiresCsrfProtection(method)) {
      let csrfToken = getCsrfTokenFromCookie();
      if (!csrfToken) {
        // Token not in cookie, fetch a new one
        csrfToken = await fetchCsrfToken();
      }
      if (csrfToken) {
        headers[getCsrfHeaderName()] = csrfToken;
      }
    }

    // Merge with any additional headers from options
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (typeof options.headers === 'object') {
        Object.assign(headers, options.headers);
      }
    }

    // Build config
    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      // Execute request interceptors (for logging, etc.)
      const interceptedConfig = await this.executeRequestInterceptors(config);

      // Make fetch request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        ...interceptedConfig,
        signal: controller.signal,
        credentials: 'include', // Include cookies for BFF session auth
        cache: 'no-store', // Disable Next.js fetch caching to ensure fresh data
      });

      clearTimeout(timeoutId);

      // Execute response interceptors
      const interceptedResponse = await this.executeResponseInterceptors(response);

      // Handle non-OK responses
      if (!interceptedResponse.ok) {
        const errorData = await interceptedResponse.json().catch(() => ({
          error: { message: interceptedResponse.statusText },
        }));

        throw new ApiException({
          code: this.getErrorCodeFromStatus(interceptedResponse.status),
          message: errorData.error?.message || interceptedResponse.statusText,
          details: errorData.error?.details,
          statusCode: interceptedResponse.status,
        });
      }

      // Handle 204 No Content (common for DELETE operations)
      if (interceptedResponse.status === 204) {
        return { success: true } as T;
      }

      // Parse and return response
      const data = await interceptedResponse.json();
      return data;
    } catch (error: any) {
      // Handle abort/timeout
      if (error.name === 'AbortError') {
        throw new ApiException({
          code: ERROR_CODES.TIMEOUT,
          message: 'Request timed out',
          statusCode: 408,
        });
      }

      // Execute error interceptors
      const interceptedError = await this.executeErrorInterceptors(error);

      // Re-throw if already ApiException
      if (interceptedError instanceof ApiException) {
        throw interceptedError;
      }

      // Parse and throw
      throw new ApiException(parseApiError(interceptedError));
    }
  }

  /**
   * Get error code from HTTP status
   */
  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case 400:
        return ERROR_CODES.BAD_REQUEST;
      case 401:
        return ERROR_CODES.UNAUTHORIZED;
      case 403:
        return ERROR_CODES.FORBIDDEN;
      case 404:
        return ERROR_CODES.NOT_FOUND;
      case 408:
        return ERROR_CODES.TIMEOUT;
      case 422:
        return ERROR_CODES.VALIDATION_ERROR;
      case 500:
        return ERROR_CODES.INTERNAL_SERVER_ERROR;
      case 503:
        return ERROR_CODES.SERVICE_UNAVAILABLE;
      case 504:
        return ERROR_CODES.GATEWAY_TIMEOUT;
      default:
        return ERROR_CODES.UNKNOWN_ERROR;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(this.cleanParams(params)).toString()
      : '';
    return this.requestWithRetry<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, data?: any): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Clean params (remove undefined/null values)
   */
  private cleanParams(params: Record<string, any>): Record<string, string> {
    const cleaned: Record<string, string> = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        cleaned[key] = String(params[key]);
      }
    });
    return cleaned;
  }
}

// Export singleton instance
export const enhancedApiClient = new EnhancedApiClient();

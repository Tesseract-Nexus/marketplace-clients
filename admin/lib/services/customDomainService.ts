/**
 * Custom Domain Service
 * Handles custom domain management for storefronts via custom-domain-service API
 */

// Types for Custom Domain Management
export interface CustomDomain {
  id: string;
  tenantId: string;
  storefrontId?: string;
  domain: string;
  domainType: 'apex' | 'subdomain' | 'wildcard';
  targetType: 'storefront' | 'admin' | 'api';

  // Verification
  verificationMethod: 'cname' | 'txt';
  verificationToken: string;
  verificationRecord: string;
  dnsVerified: boolean;
  dnsVerifiedAt?: string;
  dnsLastCheckedAt?: string;

  // SSL/TLS
  sslStatus: 'pending' | 'provisioning' | 'active' | 'failed' | 'expiring';
  sslProvider?: string;
  sslExpiresAt?: string;
  sslCertSecretName?: string;

  // Routing
  routingStatus: 'pending' | 'configuring' | 'active' | 'failed';
  virtualServiceName?: string;

  // Keycloak
  keycloakStatus: 'pending' | 'configuring' | 'active' | 'failed' | 'not_required';

  // Overall Status
  status: 'pending' | 'verifying' | 'provisioning' | 'active' | 'inactive' | 'failed' | 'expired';
  statusMessage?: string;
  activatedAt?: string;

  // Settings
  redirectWWW: boolean;
  forceHTTPS: boolean;
  isPrimary: boolean;

  // Cloudflare Tunnel (if enabled)
  tunnelCNAMETarget?: string;
  cloudflareTunnelConfigured?: boolean;
  cloudflareDNSConfigured?: boolean;

  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface DNSRecord {
  recordType: 'CNAME' | 'TXT' | 'A';
  host: string;
  value: string;
  ttl: number;
  purpose: 'domain_verification' | 'ssl_challenge' | 'domain_routing';
  isVerified: boolean;
  verifiedAt?: string;
}

export interface DNSStatus {
  domain: string;
  records: DNSRecord[];
  allVerified: boolean;
  lastChecked: string;
  propagationStatus: 'pending' | 'partial' | 'complete';
}

export interface SSLStatus {
  domain: string;
  status: 'pending' | 'provisioning' | 'active' | 'failed' | 'expiring' | 'expired';
  provider: string;
  expiresAt?: string;
  issuedAt?: string;
  renewalScheduled?: boolean;
  error?: string;
}

export interface DomainHealth {
  domain: string;
  isHealthy: boolean;
  httpStatus?: number;
  responseTime?: number;
  sslValid: boolean;
  lastChecked: string;
  error?: string;
}

export interface DomainStats {
  totalDomains: number;
  activeDomains: number;
  pendingDomains: number;
  failedDomains: number;
  expiringCertificates: number;
}

export interface CreateDomainRequest {
  domain: string;
  storefrontId?: string;
  targetType?: 'storefront' | 'admin' | 'api';
  redirectWWW?: boolean;
  forceHTTPS?: boolean;
  isPrimary?: boolean;
}

export interface UpdateDomainRequest {
  redirectWWW?: boolean;
  forceHTTPS?: boolean;
  isPrimary?: boolean;
}

export interface DomainActivity {
  id: string;
  domainId: string;
  action: string;
  status: string;
  message?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
}

// API Response types
interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get base URL from environment
const getBaseUrl = (): string => {
  // In browser, use relative URL to proxy through Next.js API
  if (typeof window !== 'undefined') {
    return '/api/domains';
  }
  // Server-side, use the service URL directly
  return process.env.CUSTOM_DOMAIN_SERVICE_URL || 'http://custom-domain-service.global.svc.cluster.local:8093';
};

// API client for custom domain service
class CustomDomainServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getBaseUrl();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  // Domain CRUD operations
  async listDomains(page = 1, limit = 10): Promise<PaginatedResponse<CustomDomain>> {
    return this.request(`?page=${page}&limit=${limit}`);
  }

  async getDomain(id: string): Promise<ApiResponse<CustomDomain>> {
    return this.request(`/${id}`);
  }

  async createDomain(data: CreateDomainRequest): Promise<ApiResponse<CustomDomain>> {
    return this.request('', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDomain(id: string, data: UpdateDomainRequest): Promise<ApiResponse<CustomDomain>> {
    return this.request(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDomain(id: string): Promise<void> {
    await this.request(`/${id}`, {
      method: 'DELETE',
    });
  }

  // Domain verification
  async verifyDomain(id: string): Promise<ApiResponse<CustomDomain>> {
    return this.request(`/${id}/verify`, {
      method: 'POST',
    });
  }

  async getDNSStatus(id: string): Promise<ApiResponse<DNSStatus>> {
    return this.request(`/${id}/dns`);
  }

  // SSL operations
  async getSSLStatus(id: string): Promise<ApiResponse<SSLStatus>> {
    return this.request(`/${id}/ssl`);
  }

  // Health check
  async checkDomainHealth(id: string): Promise<ApiResponse<DomainHealth>> {
    return this.request(`/${id}/health`);
  }

  // Domain activities
  async getDomainActivities(id: string, limit = 20): Promise<ApiResponse<DomainActivity[]>> {
    return this.request(`/${id}/activities?limit=${limit}`);
  }

  // Statistics
  async getStats(): Promise<ApiResponse<DomainStats>> {
    return this.request('/stats');
  }
}

// Export singleton instance
export const customDomainService = new CustomDomainServiceClient();

// Export class for testing
export { CustomDomainServiceClient };

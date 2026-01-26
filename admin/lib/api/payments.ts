import { apiClient } from './client';
import { ApiResponse, ApiListResponse } from './types';

// Types
export type GatewayType =
  | 'STRIPE'
  | 'PAYPAL'
  | 'RAZORPAY'
  | 'PHONEPE'
  | 'BHARATPAY'
  | 'AFTERPAY'
  | 'ZIP'
  | 'LINKT';

export type PaymentMethodType =
  | 'CARD'
  | 'UPI'
  | 'NET_BANKING'
  | 'WALLET'
  | 'EMI'
  | 'PAY_LATER'
  | 'BANK_ACCOUNT'
  | 'PAYPAL'
  | 'APPLE_PAY'
  | 'GOOGLE_PAY';

export type FeePayer = 'merchant' | 'customer' | 'split';
export type LedgerStatus = 'pending' | 'collected' | 'refunded' | 'failed';
export type LedgerEntryType = 'collection' | 'refund' | 'adjustment';

export interface PaymentGatewayConfig {
  id: string;
  tenantId: string;
  gatewayType: GatewayType;
  displayName: string;
  isEnabled: boolean;
  isTestMode: boolean;
  apiKeyPublic: string;
  apiKeySecret: string;
  webhookSecret?: string;
  merchantAccountId?: string;
  platformAccountId?: string;
  priority: number;
  supportedCountries: string[];
  supportedPaymentMethods: PaymentMethodType[];
  supportsPlatformSplit: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentGatewayTemplate {
  id: string;
  gatewayType: GatewayType;
  displayName: string;
  description?: string;
  logoUrl?: string;
  supportedCountries: string[];
  supportedPaymentMethods: PaymentMethodType[];
  requiredCredentials: string[];
  setupInstructions?: string;
  supportsPlatformSplit: boolean;
  isActive: boolean;
}

export interface PaymentGatewayRegion {
  id: string;
  gatewayConfigId: string;
  countryCode: string;
  isPrimary: boolean;
  priority: number;
  createdAt: string;
}

export interface PaymentSettings {
  id?: string;
  tenantId: string;
  platformFeeEnabled: boolean;
  platformFeePercent: number;
  minimumPlatformFee?: number;
  maximumPlatformFee?: number;
  platformAccountId?: string;
  feePayer: FeePayer;
  collectFeesOnRefund: boolean;
}

export interface FeeCalculation {
  grossAmount: number;
  platformFee: number;
  platformPercent: number;
  gatewayFee: number;
  taxAmount: number;
  netAmount: number;
}

export interface FeeLedgerEntry {
  id: string;
  tenantId: string;
  paymentTransactionId?: string;
  refundTransactionId?: string;
  entryType: LedgerEntryType;
  amount: number;
  currency: string;
  status: LedgerStatus;
  gatewayTransferId?: string;
  gatewayType?: GatewayType;
  errorCode?: string;
  errorMessage?: string;
  settledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeSummary {
  totalCollected: number;
  collectionCount: number;
  totalRefunded: number;
  refundCount: number;
  totalPending: number;
  pendingCount: number;
  netFees: number;
}

export interface GatewayOption {
  gatewayType: GatewayType;
  displayName: string;
  isEnabled: boolean;
  isTestMode: boolean;
  isPrimary: boolean;
  priority: number;
  paymentMethods: PaymentMethodInfo[];
}

export interface PaymentMethodInfo {
  type: PaymentMethodType;
  displayName: string;
  icon: string;
  gatewayType: GatewayType;
}

// ==================== Payment Methods Configuration ====================

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  description: string;
  provider: string;
  type: 'card' | 'wallet' | 'bnpl' | 'upi' | 'netbanking' | 'gateway' | 'cod' | 'bank';
  supportedRegions: string[];
  supportedCurrencies: string[];
  iconUrl: string;
  transactionFeePercent: number;
  transactionFeeFixed: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodResponse extends PaymentMethod {
  isConfigured: boolean;
  isEnabled: boolean;
  isTestMode: boolean;
  enabledRegions?: string[]; // Regions tenant has enabled for this method
  lastTestAt?: string;
  lastTestSuccess?: boolean;
  configId?: string;
}

export interface PaymentConfigSettings {
  displayName?: string;
  customIconUrl?: string;
  checkoutMessage?: string;
  minOrderAmount?: number;
  maxOrderAmount?: number;
  webhookUrl?: string;
  merchantName?: string;
  merchantCategory?: string;
}

export interface PaymentCredentials {
  // Stripe
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  // PayPal
  paypalClientId?: string;
  paypalClientSecret?: string;
  // Razorpay
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  razorpayWebhookSecret?: string;
  // Afterpay
  afterpayMerchantId?: string;
  afterpaySecretKey?: string;
  // Zip
  zipMerchantId?: string;
  zipApiKey?: string;
}

export interface TenantPaymentConfig {
  id: string;
  tenantId: string;
  paymentMethodCode: string;
  isEnabled: boolean;
  isTestMode: boolean;
  displayOrder: number;
  enabledRegions?: string[]; // Regions enabled for this method
  settings: PaymentConfigSettings;
  lastTestAt?: string;
  lastTestSuccess?: boolean;
  lastTestMessage?: string;
  createdAt: string;
  updatedAt: string;
  paymentMethod?: PaymentMethod;
}

export interface UpdatePaymentConfigRequest {
  isEnabled?: boolean;
  isTestMode?: boolean;
  displayOrder?: number;
  enabledRegions?: string[]; // Regions to enable for this method
  credentials?: PaymentCredentials;
  settings?: PaymentConfigSettings;
}

export interface TestPaymentConnectionResponse {
  success: boolean;
  message: string;
  testedAt: string;
  provider: string;
  isTestMode: boolean;
}

export interface EnabledPaymentMethod {
  code: string;
  name: string;
  description?: string;
  provider: string;
  type: string;
  iconUrl?: string;
  displayOrder: number;
  installmentInfo?: string;
}

export interface CreateGatewayFromTemplateRequest {
  credentials: Record<string, string>;
  isTestMode: boolean;
}

export interface CreateGatewayRegionRequest {
  countryCode: string;
  isPrimary: boolean;
  priority: number;
}

export interface ValidateCredentialsRequest {
  gatewayType: GatewayType;
  credentials: Record<string, string>;
  isTestMode: boolean;
}

export class PaymentsService {
  private baseUrl = '/payments';

  // ==================== Gateway Configs ====================

  /**
   * List all gateway configurations for the tenant
   */
  async getGatewayConfigs(): Promise<PaymentGatewayConfig[]> {
    const response = await apiClient.get<PaymentGatewayConfig[]>(`${this.baseUrl}/gateway-configs`);
    return response as PaymentGatewayConfig[];
  }

  /**
   * Get a single gateway configuration
   */
  async getGatewayConfig(id: string): Promise<PaymentGatewayConfig> {
    const response = await apiClient.get<PaymentGatewayConfig>(`${this.baseUrl}/gateway-configs/${id}`);
    return response as PaymentGatewayConfig;
  }

  /**
   * Create a new gateway configuration
   */
  async createGatewayConfig(config: Partial<PaymentGatewayConfig>): Promise<PaymentGatewayConfig> {
    const response = await apiClient.post<PaymentGatewayConfig>(`${this.baseUrl}/gateway-configs`, config);
    return response as PaymentGatewayConfig;
  }

  /**
   * Update a gateway configuration
   */
  async updateGatewayConfig(id: string, config: Partial<PaymentGatewayConfig>): Promise<PaymentGatewayConfig> {
    const response = await apiClient.put<PaymentGatewayConfig>(`${this.baseUrl}/gateway-configs/${id}`, config);
    return response as PaymentGatewayConfig;
  }

  /**
   * Delete a gateway configuration
   */
  async deleteGatewayConfig(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`${this.baseUrl}/gateway-configs/${id}`);
    return response as { message: string };
  }

  // ==================== Gateway Templates ====================

  /**
   * Get all available gateway templates
   */
  async getGatewayTemplates(): Promise<PaymentGatewayTemplate[]> {
    const response = await apiClient.get<PaymentGatewayTemplate[]>(`${this.baseUrl}/gateway-configs/templates`);
    return response as PaymentGatewayTemplate[];
  }

  /**
   * Create gateway from template
   */
  async createGatewayFromTemplate(
    gatewayType: GatewayType,
    request: CreateGatewayFromTemplateRequest
  ): Promise<PaymentGatewayConfig> {
    const response = await apiClient.post<PaymentGatewayConfig>(
      `${this.baseUrl}/gateway-configs/from-template/${gatewayType}`,
      request
    );
    return response as PaymentGatewayConfig;
  }

  /**
   * Validate gateway credentials
   */
  async validateCredentials(request: ValidateCredentialsRequest): Promise<{ valid: boolean; message: string }> {
    const response = await apiClient.post<{ valid: boolean; message: string }>(
      `${this.baseUrl}/gateway-configs/validate`,
      request
    );
    return response as { valid: boolean; message: string };
  }

  // ==================== Gateway Regions ====================

  /**
   * Get regions for a gateway
   */
  async getGatewayRegions(configId: string): Promise<PaymentGatewayRegion[]> {
    const response = await apiClient.get<PaymentGatewayRegion[]>(`${this.baseUrl}/gateway-configs/${configId}/regions`);
    return response as PaymentGatewayRegion[];
  }

  /**
   * Create a region mapping for a gateway
   */
  async createGatewayRegion(configId: string, request: CreateGatewayRegionRequest): Promise<PaymentGatewayRegion> {
    const response = await apiClient.post<PaymentGatewayRegion>(
      `${this.baseUrl}/gateway-configs/${configId}/regions`,
      request
    );
    return response as PaymentGatewayRegion;
  }

  /**
   * Delete a region mapping
   */
  async deleteGatewayRegion(regionId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`${this.baseUrl}/gateway-regions/${regionId}`);
    return response as { message: string };
  }

  /**
   * Set primary gateway for a country
   */
  async setPrimaryGateway(configId: string, countryCode: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `${this.baseUrl}/gateways/${configId}/set-primary`,
      { countryCode }
    );
    return response as { message: string };
  }

  // ==================== Gateway Selection ====================

  /**
   * Get available gateways for a country
   */
  async getAvailableGateways(countryCode?: string): Promise<{ countryCode: string; gateways: GatewayOption[] }> {
    const params = countryCode ? `?country=${countryCode}` : '';
    const response = await apiClient.get<{ countryCode: string; gateways: GatewayOption[] }>(
      `${this.baseUrl}/gateways/available${params}`
    );
    return response as { countryCode: string; gateways: GatewayOption[] };
  }

  /**
   * Get country-gateway matrix
   */
  async getCountryGatewayMatrix(): Promise<{ matrix: Record<string, GatewayOption[]> }> {
    const response = await apiClient.get<{ matrix: Record<string, GatewayOption[]> }>(
      `${this.baseUrl}/gateways/country-matrix`
    );
    return response as { matrix: Record<string, GatewayOption[]> };
  }

  /**
   * Get payment methods for a country
   */
  async getPaymentMethodsByCountry(countryCode: string): Promise<{ countryCode: string; paymentMethods: PaymentMethodInfo[] }> {
    const response = await apiClient.get<{ countryCode: string; paymentMethods: PaymentMethodInfo[] }>(
      `${this.baseUrl}/payment-methods/by-country/${countryCode}`
    );
    return response as { countryCode: string; paymentMethods: PaymentMethodInfo[] };
  }

  // ==================== Platform Fees ====================

  /**
   * Calculate fees for an amount
   */
  async calculateFees(amount: number, currency?: string, gatewayType?: GatewayType): Promise<FeeCalculation> {
    const params = new URLSearchParams({ amount: amount.toString() });
    if (currency) params.append('currency', currency);
    if (gatewayType) params.append('gateway', gatewayType);

    const response = await apiClient.get<FeeCalculation>(`${this.baseUrl}/platform-fees/calculate?${params}`);
    return response as FeeCalculation;
  }

  /**
   * Get fee ledger entries
   */
  async getFeeLedger(filters?: {
    status?: LedgerStatus;
    entryType?: LedgerEntryType;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: FeeLedgerEntry[]; total: number; limit: number; offset: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.entryType) params.append('entryType', filters.entryType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get<{ entries: FeeLedgerEntry[]; total: number; limit: number; offset: number }>(
      `${this.baseUrl}/platform-fees/ledger?${params}`
    );
    return response as { entries: FeeLedgerEntry[]; total: number; limit: number; offset: number };
  }

  /**
   * Get fee summary
   */
  async getFeeSummary(startDate?: string, endDate?: string): Promise<{ summary: FeeSummary; startDate: string; endDate: string }> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<{ summary: FeeSummary; startDate: string; endDate: string }>(
      `${this.baseUrl}/platform-fees/summary?${params}`
    );
    return response as { summary: FeeSummary; startDate: string; endDate: string };
  }

  // ==================== Payment Settings ====================

  /**
   * Get payment settings
   */
  async getPaymentSettings(): Promise<PaymentSettings> {
    const response = await apiClient.get<PaymentSettings>(`${this.baseUrl}/payment-settings`);
    return response as PaymentSettings;
  }

  /**
   * Update payment settings
   */
  async updatePaymentSettings(settings: Partial<PaymentSettings>): Promise<PaymentSettings> {
    const response = await apiClient.put<PaymentSettings>(`${this.baseUrl}/payment-settings`, settings);
    return response as PaymentSettings;
  }

  // ==================== Payment Methods Configuration ====================

  /**
   * Get available payment methods with tenant configuration status
   * @param region Optional region filter (e.g., 'AU', 'IN', 'US')
   */
  async getPaymentMethods(region?: string): Promise<{ paymentMethods: PaymentMethodResponse[]; region: string }> {
    const params = region ? `?region=${region}` : '';
    const response = await apiClient.get<{ data: { paymentMethods: PaymentMethodResponse[]; region: string } }>(
      `${this.baseUrl}/methods${params}`
    );
    return (response as { data: { paymentMethods: PaymentMethodResponse[]; region: string } }).data;
  }

  /**
   * Get all payment configurations for the tenant
   */
  async getPaymentConfigs(): Promise<PaymentMethodResponse[]> {
    const response = await apiClient.get<{ data: { paymentConfigs: PaymentMethodResponse[] } }>(
      `${this.baseUrl}/configs`
    );
    return (response as { data: { paymentConfigs: PaymentMethodResponse[] } }).data.paymentConfigs;
  }

  /**
   * Get a specific payment method configuration
   */
  async getPaymentConfig(code: string): Promise<TenantPaymentConfig> {
    const response = await apiClient.get<{ data: TenantPaymentConfig }>(
      `${this.baseUrl}/configs/${code}`
    );
    return (response as { data: TenantPaymentConfig }).data;
  }

  /**
   * Update a payment method configuration
   * Requires: payments:methods:config permission (Owner only)
   */
  async updatePaymentConfig(code: string, config: UpdatePaymentConfigRequest): Promise<TenantPaymentConfig> {
    const response = await apiClient.put<{ data: TenantPaymentConfig }>(
      `${this.baseUrl}/configs/${code}`,
      config
    );
    return (response as { data: TenantPaymentConfig }).data;
  }

  /**
   * Enable or disable a payment method
   * Requires: payments:methods:enable permission (Owner + Admin)
   */
  async enablePaymentMethod(code: string, enabled: boolean): Promise<TenantPaymentConfig> {
    const response = await apiClient.post<{ data: TenantPaymentConfig }>(
      `${this.baseUrl}/configs/${code}/enable`,
      { enabled }
    );
    return (response as { data: TenantPaymentConfig }).data;
  }

  /**
   * Test connection to a payment provider
   * Requires: payments:methods:test permission (Owner + Admin)
   */
  async testPaymentConnection(code: string): Promise<TestPaymentConnectionResponse> {
    const response = await apiClient.post<{ data: TestPaymentConnectionResponse }>(
      `${this.baseUrl}/configs/${code}/test`,
      {}
    );
    return (response as { data: TestPaymentConnectionResponse }).data;
  }

  /**
   * Get enabled payment methods for checkout
   * @param region Optional region filter
   */
  async getEnabledPaymentMethods(region?: string): Promise<EnabledPaymentMethod[]> {
    const params = region ? `?region=${region}` : '';
    const response = await apiClient.get<{ data: { paymentMethods: EnabledPaymentMethod[] } }>(
      `${this.baseUrl}/configs/enabled${params}`
    );
    return (response as { data: { paymentMethods: EnabledPaymentMethod[] } }).data.paymentMethods;
  }
}

export const paymentsService = new PaymentsService();

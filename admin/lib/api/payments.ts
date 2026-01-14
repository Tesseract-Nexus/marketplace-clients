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
}

export const paymentsService = new PaymentsService();

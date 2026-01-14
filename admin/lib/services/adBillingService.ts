import { apiClient } from '../api/client';
import type {
  AdCommissionTier,
  AdCampaignPayment,
  AdVendorBalance,
  AdRevenueLedger,
  CommissionCalculation,
  AdPaymentIntentResponse,
  CalculateCommissionRequest,
  CreateAdPaymentRequest,
  ProcessAdPaymentRequest,
  CreateCommissionTierRequest,
  UpdateCommissionTierRequest,
  ApiResponse,
  ApiListResponse,
  PaginationInfo,
} from '../api/types';

const BILLING_API_BASE = '/api/ads/billing';

// ========================================
// Response Types
// ========================================

interface VendorBillingResponse {
  success: boolean;
  data: AdCampaignPayment[];
  pagination: PaginationInfo;
}

interface VendorLedgerResponse {
  success: boolean;
  data: AdRevenueLedger[];
  pagination: PaginationInfo;
}

interface RevenueResponse {
  success: boolean;
  data: {
    revenue: Record<string, number>;
    startDate: string;
    endDate: string;
  };
}

// ========================================
// Ad Billing Service
// ========================================

class AdBillingService {
  // === Commission Tiers ===

  /**
   * Get all commission tiers for the current tenant
   */
  async getCommissionTiers(): Promise<ApiResponse<AdCommissionTier[]>> {
    return apiClient.get<ApiResponse<AdCommissionTier[]>>(`${BILLING_API_BASE}/commission-tiers`);
  }

  /**
   * Calculate commission for a sponsored campaign
   */
  async calculateCommission(data: CalculateCommissionRequest): Promise<ApiResponse<CommissionCalculation>> {
    return apiClient.post<ApiResponse<CommissionCalculation>>(`${BILLING_API_BASE}/calculate-commission`, data);
  }

  /**
   * Create a new commission tier (admin only)
   */
  async createCommissionTier(data: CreateCommissionTierRequest): Promise<ApiResponse<AdCommissionTier>> {
    return apiClient.post<ApiResponse<AdCommissionTier>>(`${BILLING_API_BASE}/commission-tiers`, data);
  }

  /**
   * Update a commission tier (admin only)
   */
  async updateCommissionTier(id: string, data: UpdateCommissionTierRequest): Promise<ApiResponse<void>> {
    return apiClient.put<ApiResponse<void>>(`${BILLING_API_BASE}/commission-tiers/${id}`, data);
  }

  // === Ad Payments ===

  /**
   * Create a direct payment (full budget upfront)
   */
  async createDirectPayment(data: CreateAdPaymentRequest): Promise<ApiResponse<AdCampaignPayment>> {
    return apiClient.post<ApiResponse<AdCampaignPayment>>(`${BILLING_API_BASE}/payments/direct`, data);
  }

  /**
   * Create a sponsored payment (commission-based)
   */
  async createSponsoredPayment(data: CreateAdPaymentRequest): Promise<ApiResponse<AdCampaignPayment>> {
    return apiClient.post<ApiResponse<AdCampaignPayment>>(`${BILLING_API_BASE}/payments/sponsored`, data);
  }

  /**
   * Get payment details
   */
  async getPayment(id: string): Promise<ApiResponse<AdCampaignPayment>> {
    return apiClient.get<ApiResponse<AdCampaignPayment>>(`${BILLING_API_BASE}/payments/${id}`);
  }

  /**
   * Get payment by campaign ID
   */
  async getPaymentByCampaign(campaignId: string): Promise<ApiResponse<AdCampaignPayment>> {
    return apiClient.get<ApiResponse<AdCampaignPayment>>(`${BILLING_API_BASE}/campaigns/${campaignId}/payment`);
  }

  /**
   * Process payment via gateway (Stripe/Razorpay)
   */
  async processPayment(paymentId: string, data: ProcessAdPaymentRequest): Promise<ApiResponse<AdPaymentIntentResponse>> {
    return apiClient.post<ApiResponse<AdPaymentIntentResponse>>(`${BILLING_API_BASE}/payments/${paymentId}/process`, data);
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, reason: string): Promise<ApiResponse<void>> {
    return apiClient.post<ApiResponse<void>>(`${BILLING_API_BASE}/payments/${paymentId}/refund`, { reason });
  }

  // === Vendor Billing ===

  /**
   * Get vendor billing history
   */
  async getVendorBilling(vendorId: string, params?: { page?: number; limit?: number }): Promise<VendorBillingResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();
    return apiClient.get<VendorBillingResponse>(`${BILLING_API_BASE}/vendors/${vendorId}/billing${query ? `?${query}` : ''}`);
  }

  /**
   * Get vendor balance
   */
  async getVendorBalance(vendorId: string): Promise<ApiResponse<AdVendorBalance>> {
    return apiClient.get<ApiResponse<AdVendorBalance>>(`${BILLING_API_BASE}/vendors/${vendorId}/balance`);
  }

  /**
   * Get vendor ledger entries
   */
  async getVendorLedger(vendorId: string, params?: { page?: number; limit?: number }): Promise<VendorLedgerResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();
    return apiClient.get<VendorLedgerResponse>(`${BILLING_API_BASE}/vendors/${vendorId}/ledger${query ? `?${query}` : ''}`);
  }

  // === Revenue Reporting ===

  /**
   * Get tenant ad revenue for a date range
   */
  async getAdRevenue(params?: { startDate?: string; endDate?: string }): Promise<RevenueResponse> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    const query = queryParams.toString();
    return apiClient.get<RevenueResponse>(`${BILLING_API_BASE}/revenue${query ? `?${query}` : ''}`);
  }

  // === Helper Methods ===

  /**
   * Format commission rate as percentage string
   */
  formatCommissionRate(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`;
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Get tier name based on campaign days
   */
  getTierDescription(days: number): string {
    if (days <= 6) return 'Express (1-6 days)';
    if (days <= 29) return 'Short-term (7-29 days)';
    if (days <= 89) return 'Medium-term (30-89 days)';
    return 'Long-term (90+ days)';
  }

  /**
   * Calculate campaign days between two dates
   */
  calculateCampaignDays(startDate: string | Date, endDate: string | Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays); // Minimum 1 day
  }

  /**
   * Determine the appropriate gateway type based on country
   */
  getGatewayType(countryCode: string): 'STRIPE' | 'RAZORPAY' {
    // Razorpay is preferred for India
    if (countryCode === 'IN') {
      return 'RAZORPAY';
    }
    // Stripe for all other countries
    return 'STRIPE';
  }
}

// Export singleton instance
export const adBillingService = new AdBillingService();

import { apiClient } from './client';

// Types
export type CarrierType =
  | 'SHIPROCKET'
  | 'DELHIVERY'
  | 'BLUEDART'
  | 'DTDC'
  | 'SHIPPO'
  | 'SHIPENGINE'
  | 'FEDEX'
  | 'UPS'
  | 'DHL';

export interface ShippingCarrierConfig {
  id: string;
  tenantId: string;
  carrierType: CarrierType;
  displayName: string;
  isEnabled: boolean;
  isTestMode: boolean;
  hasCredentials: boolean;
  supportsRates: boolean;
  supportsTracking: boolean;
  supportsLabels: boolean;
  supportsReturns: boolean;
  supportsPickup: boolean;
  supportedCountries: string[];
  supportedServices: string[];
  priority: number;
  description?: string;
  logoUrl?: string;
  config?: Record<string, unknown>;
  regions?: ShippingCarrierRegion[];
  createdAt: string;
  updatedAt: string;
}

export interface ShippingCarrierTemplate {
  id: string;
  carrierType: CarrierType;
  displayName: string;
  description?: string;
  logoUrl?: string;
  supportsRates: boolean;
  supportsTracking: boolean;
  supportsLabels: boolean;
  supportsReturns: boolean;
  supportsPickup: boolean;
  supportedCountries: string[];
  supportedServices: string[];
  requiredCredentials: string[];
  defaultConfig?: Record<string, unknown>;
  setupInstructions?: string;
  documentationUrl?: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingCarrierRegion {
  id: string;
  carrierConfigId: string;
  countryCode: string;
  isPrimary: boolean;
  priority: number;
  enabled: boolean;
  supportedServices?: string[];
  defaultService?: string;
  handlingFee: number;
  handlingFeePercent: number;
  freeShippingMinimum?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseAddress {
  name: string;
  company?: string;
  phone: string;
  email: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ShippingSettings {
  id?: string;
  tenantId: string;
  defaultWarehouseId?: string;
  warehouse?: WarehouseAddress;
  autoSelectCarrier: boolean;
  preferredCarrierType?: string;
  fallbackCarrierType?: string;
  selectionStrategy: 'priority' | 'cheapest' | 'fastest';
  // General shipping options
  enableLocalDelivery?: boolean;
  enableStorePickup?: boolean;
  enableInternational?: boolean;
  // Pricing
  freeShippingEnabled: boolean;
  freeShippingMinimum?: number;
  handlingFee: number;
  handlingFeePercent: number;
  defaultWeightUnit: string;
  defaultDimensionUnit: string;
  defaultPackageWeight: number;
  insuranceEnabled: boolean;
  insuranceMinValue?: number;
  insurancePercentage: number;
  autoInsureAboveValue?: number;
  sendShipmentNotifications: boolean;
  sendDeliveryNotifications: boolean;
  sendTrackingUpdates: boolean;
  returnsEnabled: boolean;
  returnWindowDays: number;
  freeReturnsEnabled: boolean;
  returnLabelMode: 'on_request' | 'with_shipment';
  cacheRates: boolean;
  rateCacheDuration: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CarrierOption {
  carrierType: CarrierType;
  displayName: string;
  isEnabled: boolean;
  isTestMode: boolean;
  isPrimary: boolean;
  priority: number;
  supportsRates: boolean;
  supportsTracking: boolean;
  supportsLabels: boolean;
  supportsReturns: boolean;
  supportsPickup: boolean;
  services?: string[];
}

export interface CreateCarrierConfigRequest {
  carrierType: CarrierType;
  displayName: string;
  isEnabled?: boolean;
  isTestMode?: boolean;
  apiKeyPublic?: string;
  apiKeySecret?: string;
  webhookSecret?: string;
  baseUrl?: string;
  credentials?: Record<string, string>;
  config?: Record<string, unknown>;
  supportedCountries?: string[];
  supportedServices?: string[];
  priority?: number;
  description?: string;
}

export interface UpdateCarrierConfigRequest {
  displayName?: string;
  isEnabled?: boolean;
  isTestMode?: boolean;
  apiKeyPublic?: string;
  apiKeySecret?: string;
  webhookSecret?: string;
  baseUrl?: string;
  credentials?: Record<string, string>;
  config?: Record<string, unknown>;
  supportedCountries?: string[];
  supportedServices?: string[];
  priority?: number;
  description?: string;
}

export interface CreateCarrierFromTemplateRequest {
  displayName?: string;
  isTestMode?: boolean;
  apiKeyPublic?: string;
  apiKeySecret?: string;
  webhookSecret?: string;
  baseUrl?: string;
  credentials?: Record<string, string>;
}

export interface CreateCarrierRegionRequest {
  countryCode: string;
  isPrimary?: boolean;
  priority?: number;
  enabled?: boolean;
  supportedServices?: string[];
  defaultService?: string;
  handlingFee?: number;
  handlingFeePercent?: number;
  freeShippingMinimum?: number;
}

export interface UpdateCarrierRegionRequest {
  isPrimary?: boolean;
  priority?: number;
  enabled?: boolean;
  supportedServices?: string[];
  defaultService?: string;
  handlingFee?: number;
  handlingFeePercent?: number;
  freeShippingMinimum?: number;
}

export interface ValidateCredentialsRequest {
  carrierType: CarrierType;
  isTestMode?: boolean;
  apiKeyPublic?: string;
  apiKeySecret?: string;
  baseUrl?: string;
  credentials?: Record<string, string>;
}

export interface ValidateCredentialsResponse {
  valid: boolean;
  message?: string;
  details?: Record<string, unknown>;
}

export class ShippingCarriersService {
  private baseUrl = '/shipping';

  // ==================== Carrier Configs ====================

  /**
   * List all carrier configurations for the tenant
   */
  async getCarrierConfigs(): Promise<ShippingCarrierConfig[]> {
    const response = await apiClient.get<ShippingCarrierConfig[]>(`${this.baseUrl}/carrier-configs`);
    return response as ShippingCarrierConfig[];
  }

  /**
   * Get a single carrier configuration
   */
  async getCarrierConfig(id: string): Promise<ShippingCarrierConfig> {
    const response = await apiClient.get<ShippingCarrierConfig>(`${this.baseUrl}/carrier-configs/${id}`);
    return response as ShippingCarrierConfig;
  }

  /**
   * Create a new carrier configuration
   */
  async createCarrierConfig(config: CreateCarrierConfigRequest): Promise<ShippingCarrierConfig> {
    const response = await apiClient.post<ShippingCarrierConfig>(`${this.baseUrl}/carrier-configs`, config);
    return response as ShippingCarrierConfig;
  }

  /**
   * Update a carrier configuration
   */
  async updateCarrierConfig(id: string, config: UpdateCarrierConfigRequest): Promise<ShippingCarrierConfig> {
    const response = await apiClient.put<ShippingCarrierConfig>(`${this.baseUrl}/carrier-configs/${id}`, config);
    return response as ShippingCarrierConfig;
  }

  /**
   * Delete a carrier configuration
   */
  async deleteCarrierConfig(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`${this.baseUrl}/carrier-configs/${id}`);
    return response as { message: string };
  }

  // ==================== Carrier Templates ====================

  /**
   * Get all available carrier templates
   */
  async getCarrierTemplates(): Promise<ShippingCarrierTemplate[]> {
    const response = await apiClient.get<ShippingCarrierTemplate[]>(`${this.baseUrl}/carrier-configs/templates`);
    return response as ShippingCarrierTemplate[];
  }

  /**
   * Create carrier from template
   */
  async createCarrierFromTemplate(
    carrierType: CarrierType,
    request: CreateCarrierFromTemplateRequest
  ): Promise<ShippingCarrierConfig> {
    const response = await apiClient.post<ShippingCarrierConfig>(
      `${this.baseUrl}/carrier-configs/from-template/${carrierType}`,
      request
    );
    return response as ShippingCarrierConfig;
  }

  /**
   * Validate carrier credentials
   */
  async validateCredentials(request: ValidateCredentialsRequest): Promise<ValidateCredentialsResponse> {
    const response = await apiClient.post<ValidateCredentialsResponse>(
      `${this.baseUrl}/carrier-configs/validate`,
      request
    );
    return response as ValidateCredentialsResponse;
  }

  /**
   * Test connection for an existing carrier configuration
   */
  async testConnection(configId: string): Promise<ValidateCredentialsResponse> {
    const response = await apiClient.post<ValidateCredentialsResponse>(
      `${this.baseUrl}/carrier-configs/${configId}/test-connection`,
      {}
    );
    return response as ValidateCredentialsResponse;
  }

  // ==================== Carrier Regions ====================

  /**
   * Get regions for a carrier
   */
  async getCarrierRegions(configId: string): Promise<ShippingCarrierRegion[]> {
    const response = await apiClient.get<ShippingCarrierRegion[]>(
      `${this.baseUrl}/carrier-configs/${configId}/regions`
    );
    return response as ShippingCarrierRegion[];
  }

  /**
   * Create a region mapping for a carrier
   */
  async createCarrierRegion(configId: string, request: CreateCarrierRegionRequest): Promise<ShippingCarrierRegion> {
    const response = await apiClient.post<ShippingCarrierRegion>(
      `${this.baseUrl}/carrier-configs/${configId}/regions`,
      request
    );
    return response as ShippingCarrierRegion;
  }

  /**
   * Update a region mapping
   */
  async updateCarrierRegion(regionId: string, request: UpdateCarrierRegionRequest): Promise<ShippingCarrierRegion> {
    const response = await apiClient.put<ShippingCarrierRegion>(
      `${this.baseUrl}/carrier-regions/${regionId}`,
      request
    );
    return response as ShippingCarrierRegion;
  }

  /**
   * Delete a region mapping
   */
  async deleteCarrierRegion(regionId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`${this.baseUrl}/carrier-regions/${regionId}`);
    return response as { message: string };
  }

  /**
   * Set primary carrier for a country
   */
  async setPrimaryCarrier(configId: string, countryCode: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `${this.baseUrl}/carriers/${configId}/set-primary`,
      { countryCode }
    );
    return response as { message: string };
  }

  // ==================== Carrier Selection ====================

  /**
   * Get available carriers for a country
   */
  async getAvailableCarriers(countryCode?: string): Promise<CarrierOption[]> {
    const params = countryCode ? `?country=${countryCode}` : '';
    const response = await apiClient.get<CarrierOption[]>(`${this.baseUrl}/carriers/available${params}`);
    return response as CarrierOption[];
  }

  /**
   * Get country-carrier matrix
   */
  async getCountryCarrierMatrix(): Promise<Record<string, CarrierOption[]>> {
    const response = await apiClient.get<Record<string, CarrierOption[]>>(
      `${this.baseUrl}/carriers/country-matrix`
    );
    return response as Record<string, CarrierOption[]>;
  }

  // ==================== Shipping Settings ====================

  /**
   * Get shipping settings
   */
  async getShippingSettings(): Promise<ShippingSettings> {
    const response = await apiClient.get<ShippingSettings>(`${this.baseUrl}/shipping-settings`);
    return response as ShippingSettings;
  }

  /**
   * Update shipping settings
   */
  async updateShippingSettings(settings: Partial<ShippingSettings>): Promise<ShippingSettings> {
    const response = await apiClient.put<ShippingSettings>(`${this.baseUrl}/shipping-settings`, settings);
    return response as ShippingSettings;
  }
}

export const shippingCarriersService = new ShippingCarriersService();

// Helper functions

/**
 * Get display name for a carrier type
 */
export function getCarrierDisplayName(carrierType: CarrierType): string {
  const names: Record<CarrierType, string> = {
    SHIPROCKET: 'Shiprocket',
    DELHIVERY: 'Delhivery',
    BLUEDART: 'BlueDart',
    DTDC: 'DTDC',
    SHIPPO: 'Shippo',
    SHIPENGINE: 'ShipEngine',
    FEDEX: 'FedEx',
    UPS: 'UPS',
    DHL: 'DHL Express',
  };
  return names[carrierType] || carrierType;
}

/**
 * Get icon name for a carrier type
 */
export function getCarrierIcon(carrierType: CarrierType): string {
  // Return lucide icon names
  const icons: Record<CarrierType, string> = {
    SHIPROCKET: 'rocket',
    DELHIVERY: 'truck',
    BLUEDART: 'package',
    DTDC: 'package',
    SHIPPO: 'ship',
    SHIPENGINE: 'settings',
    FEDEX: 'package',
    UPS: 'package',
    DHL: 'package',
  };
  return icons[carrierType] || 'package';
}

/**
 * Get region label from country code
 */
export function getRegionLabel(countryCode: string): string {
  const regions: Record<string, string> = {
    IN: 'India',
    US: 'United States',
    CA: 'Canada',
    GB: 'United Kingdom',
    AU: 'Australia',
    DE: 'Germany',
    FR: 'France',
    NL: 'Netherlands',
    ES: 'Spain',
    IT: 'Italy',
    JP: 'Japan',
    CN: 'China',
    SG: 'Singapore',
    HK: 'Hong Kong',
    MX: 'Mexico',
    BR: 'Brazil',
  };
  return regions[countryCode] || countryCode;
}

/**
 * Check if carrier is for India region
 */
export function isIndiaCarrier(carrierType: CarrierType): boolean {
  return ['SHIPROCKET', 'DELHIVERY', 'BLUEDART', 'DTDC'].includes(carrierType);
}

/**
 * Check if carrier is global
 */
export function isGlobalCarrier(carrierType: CarrierType): boolean {
  return ['SHIPPO', 'SHIPENGINE', 'FEDEX', 'UPS', 'DHL'].includes(carrierType);
}

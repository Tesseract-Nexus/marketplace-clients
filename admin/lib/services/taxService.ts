/**
 * Tax Service Client
 * Provides methods to interact with the tax-service backend via the API proxy
 */

import { API_CONFIG } from '../config/api';

// Types
export type JurisdictionType = 'COUNTRY' | 'STATE' | 'COUNTY' | 'CITY' | 'ZIP';

export type TaxType =
  | 'SALES'
  | 'VAT'
  | 'GST'
  | 'CGST'
  | 'SGST'
  | 'IGST'
  | 'UTGST'
  | 'CESS'
  | 'HST'
  | 'PST'
  | 'QST'
  | 'CITY'
  | 'COUNTY'
  | 'STATE'
  | 'SPECIAL';

export type CertificateType = 'RESALE' | 'GOVERNMENT' | 'NON_PROFIT' | 'DIPLOMATIC';
export type CertificateStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'PENDING';

export interface TaxJurisdiction {
  id: string;
  tenantId: string;
  name: string;
  type: JurisdictionType;
  code: string;
  stateCode?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: TaxJurisdiction;
  children?: TaxJurisdiction[];
  taxRates?: TaxRate[];
}

export interface TaxRate {
  id: string;
  tenantId: string;
  jurisdictionId: string;
  name: string;
  rate: number;
  taxType: TaxType;
  priority: number;
  isCompound: boolean;
  appliesToShipping: boolean;
  appliesToProducts: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  jurisdiction?: TaxJurisdiction;
}

export interface ProductTaxCategory {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  taxCode?: string;
  hsnCode?: string;
  sacCode?: string;
  gstSlab?: number;
  isTaxExempt: boolean;
  isNilRated: boolean;
  isZeroRated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxExemptionCertificate {
  id: string;
  tenantId: string;
  customerId: string;
  certificateNumber: string;
  certificateType: CertificateType;
  jurisdictionId?: string;
  appliesToAllJurisdictions: boolean;
  issuedDate: string;
  expiryDate?: string;
  documentUrl?: string;
  status: CertificateStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
  jurisdiction?: TaxJurisdiction;
}

export interface CreateJurisdictionRequest {
  name: string;
  type: JurisdictionType;
  code: string;
  stateCode?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface UpdateJurisdictionRequest extends Partial<CreateJurisdictionRequest> {}

export interface CreateTaxRateRequest {
  jurisdictionId: string;
  name: string;
  rate: number;
  taxType: TaxType;
  priority?: number;
  isCompound?: boolean;
  appliesToShipping?: boolean;
  appliesToProducts?: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive?: boolean;
}

export interface UpdateTaxRateRequest extends Partial<CreateTaxRateRequest> {}

export interface CreateProductTaxCategoryRequest {
  name: string;
  description?: string;
  taxCode?: string;
  hsnCode?: string;
  sacCode?: string;
  gstSlab?: number;
  isTaxExempt?: boolean;
  isNilRated?: boolean;
  isZeroRated?: boolean;
}

export interface UpdateProductTaxCategoryRequest extends Partial<CreateProductTaxCategoryRequest> {}

export interface CreateExemptionCertificateRequest {
  customerId: string;
  certificateNumber: string;
  certificateType: CertificateType;
  jurisdictionId?: string;
  appliesToAllJurisdictions?: boolean;
  issuedDate: string;
  expiryDate?: string;
  documentUrl?: string;
  status?: CertificateStatus;
}

export interface UpdateExemptionCertificateRequest extends Partial<CreateExemptionCertificateRequest> {}

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}/tax${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Tax Service API Client
 */
export const taxService = {
  // Quick Setup Methods
  setup: {
    /**
     * Get current tax setup status
     */
    getStatus: async (): Promise<{
      jurisdictionsCount: number;
      ratesCount: number;
      exemptionsCount: number;
      jurisdictions: TaxJurisdiction[];
      hasCountryJurisdiction: boolean;
      countryCode: string | null;
    }> => {
      try {
        const [jurisdictions, exemptions] = await Promise.all([
          taxService.jurisdictions.list(),
          taxService.exemptions.list(),
        ]);

        // Count rates from jurisdictions
        let ratesCount = 0;
        jurisdictions.forEach(j => {
          ratesCount += j.taxRates?.length || 0;
        });

        // Find country jurisdiction
        const countryJurisdiction = jurisdictions.find(j => j.type === 'COUNTRY');

        return {
          jurisdictionsCount: jurisdictions.length,
          ratesCount,
          exemptionsCount: exemptions.length,
          jurisdictions,
          hasCountryJurisdiction: !!countryJurisdiction,
          countryCode: countryJurisdiction?.code || null,
        };
      } catch (error) {
        console.error('Failed to get tax setup status:', error);
        return {
          jurisdictionsCount: 0,
          ratesCount: 0,
          exemptionsCount: 0,
          jurisdictions: [],
          hasCountryJurisdiction: false,
          countryCode: null,
        };
      }
    },

    /**
     * Setup India GST with all jurisdictions and rates
     */
    setupIndiaGST: async (options: {
      gstin?: string;
      businessState: string;
      gstSlabs: number[];
      onProgress?: (step: string, progress: number) => void;
    }): Promise<{ success: boolean; error?: string; created: { jurisdictions: number; rates: number } }> => {
      const { gstin, businessState, gstSlabs, onProgress } = options;
      const created = { jurisdictions: 0, rates: 0 };

      try {
        onProgress?.('Creating India jurisdiction...', 5);

        // 1. Create India country jurisdiction
        let indiaJurisdiction: TaxJurisdiction;
        try {
          indiaJurisdiction = await taxService.jurisdictions.create({
            name: 'India',
            type: 'COUNTRY',
            code: 'IN',
            isActive: true,
          });
          created.jurisdictions++;
        } catch (e: any) {
          // Might already exist, try to find it
          const existing = await taxService.jurisdictions.list({ type: 'COUNTRY' });
          const found = existing.find(j => j.code === 'IN');
          if (found) {
            indiaJurisdiction = found;
          } else {
            throw new Error('Failed to create India jurisdiction: ' + e.message);
          }
        }

        onProgress?.('Creating IGST rates...', 15);

        // 2. Create IGST rates at country level (for interstate)
        const today = new Date().toISOString().split('T')[0];
        for (const slab of gstSlabs) {
          try {
            await taxService.rates.create({
              jurisdictionId: indiaJurisdiction.id,
              name: `IGST ${slab}%`,
              rate: slab,
              taxType: 'IGST',
              priority: 1,
              isCompound: false,
              appliesToShipping: true,
              appliesToProducts: true,
              effectiveFrom: today,
              isActive: true,
            });
            created.rates++;
          } catch (e) {
            console.warn(`Failed to create IGST ${slab}%:`, e);
          }
        }

        onProgress?.('Creating state jurisdictions...', 25);

        // 3. Create state jurisdictions (all 36 states/UTs)
        const INDIA_STATES = [
          { name: 'Andhra Pradesh', code: 'AP', stateCode: '37' },
          { name: 'Arunachal Pradesh', code: 'AR', stateCode: '12' },
          { name: 'Assam', code: 'AS', stateCode: '18' },
          { name: 'Bihar', code: 'BR', stateCode: '10' },
          { name: 'Chhattisgarh', code: 'CG', stateCode: '22' },
          { name: 'Goa', code: 'GA', stateCode: '30' },
          { name: 'Gujarat', code: 'GJ', stateCode: '24' },
          { name: 'Haryana', code: 'HR', stateCode: '06' },
          { name: 'Himachal Pradesh', code: 'HP', stateCode: '02' },
          { name: 'Jharkhand', code: 'JH', stateCode: '20' },
          { name: 'Karnataka', code: 'KA', stateCode: '29' },
          { name: 'Kerala', code: 'KL', stateCode: '32' },
          { name: 'Madhya Pradesh', code: 'MP', stateCode: '23' },
          { name: 'Maharashtra', code: 'MH', stateCode: '27' },
          { name: 'Manipur', code: 'MN', stateCode: '14' },
          { name: 'Meghalaya', code: 'ML', stateCode: '17' },
          { name: 'Mizoram', code: 'MZ', stateCode: '15' },
          { name: 'Nagaland', code: 'NL', stateCode: '13' },
          { name: 'Odisha', code: 'OD', stateCode: '21' },
          { name: 'Punjab', code: 'PB', stateCode: '03' },
          { name: 'Rajasthan', code: 'RJ', stateCode: '08' },
          { name: 'Sikkim', code: 'SK', stateCode: '11' },
          { name: 'Tamil Nadu', code: 'TN', stateCode: '33' },
          { name: 'Telangana', code: 'TS', stateCode: '36' },
          { name: 'Tripura', code: 'TR', stateCode: '16' },
          { name: 'Uttar Pradesh', code: 'UP', stateCode: '09' },
          { name: 'Uttarakhand', code: 'UK', stateCode: '05' },
          { name: 'West Bengal', code: 'WB', stateCode: '19' },
          { name: 'Andaman and Nicobar Islands', code: 'AN', stateCode: '35' },
          { name: 'Chandigarh', code: 'CH', stateCode: '04' },
          { name: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DD', stateCode: '26' },
          { name: 'Delhi', code: 'DL', stateCode: '07' },
          { name: 'Jammu and Kashmir', code: 'JK', stateCode: '01' },
          { name: 'Ladakh', code: 'LA', stateCode: '38' },
          { name: 'Lakshadweep', code: 'LD', stateCode: '31' },
          { name: 'Puducherry', code: 'PY', stateCode: '34' },
        ];

        const stateJurisdictions: Map<string, TaxJurisdiction> = new Map();

        for (let i = 0; i < INDIA_STATES.length; i++) {
          const state = INDIA_STATES[i];
          const progress = 25 + ((i / INDIA_STATES.length) * 35);
          onProgress?.(`Creating ${state.name}...`, progress);

          try {
            const stateJurisdiction = await taxService.jurisdictions.create({
              name: state.name,
              type: 'STATE',
              code: state.code,
              stateCode: state.stateCode,
              parentId: indiaJurisdiction.id,
              isActive: true,
            });
            stateJurisdictions.set(state.code, stateJurisdiction);
            created.jurisdictions++;
          } catch (e) {
            console.warn(`Failed to create state ${state.name}:`, e);
          }
        }

        onProgress?.('Creating CGST/SGST rates...', 65);

        // 4. Create CGST+SGST rates for business state
        const businessStateJurisdiction = stateJurisdictions.get(businessState);
        if (businessStateJurisdiction) {
          for (const slab of gstSlabs) {
            const halfRate = slab / 2;
            try {
              // CGST
              await taxService.rates.create({
                jurisdictionId: businessStateJurisdiction.id,
                name: `CGST ${halfRate}%`,
                rate: halfRate,
                taxType: 'CGST',
                priority: 1,
                isCompound: false,
                appliesToShipping: true,
                appliesToProducts: true,
                effectiveFrom: today,
                isActive: true,
              });
              created.rates++;

              // SGST
              await taxService.rates.create({
                jurisdictionId: businessStateJurisdiction.id,
                name: `SGST ${halfRate}%`,
                rate: halfRate,
                taxType: 'SGST',
                priority: 2,
                isCompound: false,
                appliesToShipping: true,
                appliesToProducts: true,
                effectiveFrom: today,
                isActive: true,
              });
              created.rates++;
            } catch (e) {
              console.warn(`Failed to create CGST/SGST ${halfRate}%:`, e);
            }
          }
        }

        onProgress?.('Setup complete!', 100);

        return { success: true, created };
      } catch (error: any) {
        console.error('India GST setup failed:', error);
        return {
          success: false,
          error: error.message || 'Failed to set up India GST',
          created,
        };
      }
    },

    /**
     * Setup US Sales Tax with state jurisdictions
     */
    setupUSSalesTax: async (options: {
      businessState: string;
      nexusStates: string[];
      onProgress?: (step: string, progress: number) => void;
    }): Promise<{ success: boolean; error?: string; created: { jurisdictions: number; rates: number } }> => {
      const { businessState, nexusStates, onProgress } = options;
      const created = { jurisdictions: 0, rates: 0 };

      const US_STATES = [
        { name: 'Alabama', code: 'AL', rate: 4 },
        { name: 'Alaska', code: 'AK', rate: 0 },
        { name: 'Arizona', code: 'AZ', rate: 5.6 },
        { name: 'Arkansas', code: 'AR', rate: 6.5 },
        { name: 'California', code: 'CA', rate: 7.25 },
        { name: 'Colorado', code: 'CO', rate: 2.9 },
        { name: 'Connecticut', code: 'CT', rate: 6.35 },
        { name: 'Delaware', code: 'DE', rate: 0 },
        { name: 'Florida', code: 'FL', rate: 6 },
        { name: 'Georgia', code: 'GA', rate: 4 },
        { name: 'Hawaii', code: 'HI', rate: 4 },
        { name: 'Idaho', code: 'ID', rate: 6 },
        { name: 'Illinois', code: 'IL', rate: 6.25 },
        { name: 'Indiana', code: 'IN', rate: 7 },
        { name: 'Iowa', code: 'IA', rate: 6 },
        { name: 'Kansas', code: 'KS', rate: 6.5 },
        { name: 'Kentucky', code: 'KY', rate: 6 },
        { name: 'Louisiana', code: 'LA', rate: 4.45 },
        { name: 'Maine', code: 'ME', rate: 5.5 },
        { name: 'Maryland', code: 'MD', rate: 6 },
        { name: 'Massachusetts', code: 'MA', rate: 6.25 },
        { name: 'Michigan', code: 'MI', rate: 6 },
        { name: 'Minnesota', code: 'MN', rate: 6.875 },
        { name: 'Mississippi', code: 'MS', rate: 7 },
        { name: 'Missouri', code: 'MO', rate: 4.225 },
        { name: 'Montana', code: 'MT', rate: 0 },
        { name: 'Nebraska', code: 'NE', rate: 5.5 },
        { name: 'Nevada', code: 'NV', rate: 6.85 },
        { name: 'New Hampshire', code: 'NH', rate: 0 },
        { name: 'New Jersey', code: 'NJ', rate: 6.625 },
        { name: 'New Mexico', code: 'NM', rate: 5.125 },
        { name: 'New York', code: 'NY', rate: 4 },
        { name: 'North Carolina', code: 'NC', rate: 4.75 },
        { name: 'North Dakota', code: 'ND', rate: 5 },
        { name: 'Ohio', code: 'OH', rate: 5.75 },
        { name: 'Oklahoma', code: 'OK', rate: 4.5 },
        { name: 'Oregon', code: 'OR', rate: 0 },
        { name: 'Pennsylvania', code: 'PA', rate: 6 },
        { name: 'Rhode Island', code: 'RI', rate: 7 },
        { name: 'South Carolina', code: 'SC', rate: 6 },
        { name: 'South Dakota', code: 'SD', rate: 4.5 },
        { name: 'Tennessee', code: 'TN', rate: 7 },
        { name: 'Texas', code: 'TX', rate: 6.25 },
        { name: 'Utah', code: 'UT', rate: 6.1 },
        { name: 'Vermont', code: 'VT', rate: 6 },
        { name: 'Virginia', code: 'VA', rate: 5.3 },
        { name: 'Washington', code: 'WA', rate: 6.5 },
        { name: 'West Virginia', code: 'WV', rate: 6 },
        { name: 'Wisconsin', code: 'WI', rate: 5 },
        { name: 'Wyoming', code: 'WY', rate: 4 },
      ];

      try {
        onProgress?.('Creating USA jurisdiction...', 5);

        // Create USA country jurisdiction
        let usaJurisdiction: TaxJurisdiction;
        try {
          usaJurisdiction = await taxService.jurisdictions.create({
            name: 'United States',
            type: 'COUNTRY',
            code: 'US',
            isActive: true,
          });
          created.jurisdictions++;
        } catch (e: any) {
          const existing = await taxService.jurisdictions.list({ type: 'COUNTRY' });
          const found = existing.find(j => j.code === 'US');
          if (found) {
            usaJurisdiction = found;
          } else {
            throw new Error('Failed to create USA jurisdiction: ' + e.message);
          }
        }

        // Create state jurisdictions with tax rates for nexus states
        const statesToCreate = nexusStates.length > 0 ? nexusStates : [businessState];
        const today = new Date().toISOString().split('T')[0];

        for (let i = 0; i < statesToCreate.length; i++) {
          const stateCode = statesToCreate[i];
          const stateData = US_STATES.find(s => s.code === stateCode);
          if (!stateData) continue;

          const progress = 10 + ((i / statesToCreate.length) * 80);
          onProgress?.(`Creating ${stateData.name}...`, progress);

          try {
            const stateJurisdiction = await taxService.jurisdictions.create({
              name: stateData.name,
              type: 'STATE',
              code: stateData.code,
              parentId: usaJurisdiction.id,
              isActive: true,
            });
            created.jurisdictions++;

            // Create sales tax rate if rate > 0
            if (stateData.rate > 0) {
              await taxService.rates.create({
                jurisdictionId: stateJurisdiction.id,
                name: `${stateData.name} Sales Tax`,
                rate: stateData.rate,
                taxType: 'SALES',
                priority: 1,
                isCompound: false,
                appliesToShipping: false,
                appliesToProducts: true,
                effectiveFrom: today,
                isActive: true,
              });
              created.rates++;
            }
          } catch (e) {
            console.warn(`Failed to create state ${stateData.name}:`, e);
          }
        }

        onProgress?.('Setup complete!', 100);
        return { success: true, created };
      } catch (error: any) {
        console.error('US Sales Tax setup failed:', error);
        return { success: false, error: error.message || 'Failed to set up US Sales Tax', created };
      }
    },

    /**
     * Setup UK VAT
     */
    setupUKVAT: async (options: {
      vatNumber?: string;
      onProgress?: (step: string, progress: number) => void;
    }): Promise<{ success: boolean; error?: string; created: { jurisdictions: number; rates: number } }> => {
      const { onProgress } = options;
      const created = { jurisdictions: 0, rates: 0 };

      try {
        onProgress?.('Creating UK jurisdiction...', 10);

        // Create UK country jurisdiction
        let ukJurisdiction: TaxJurisdiction;
        try {
          ukJurisdiction = await taxService.jurisdictions.create({
            name: 'United Kingdom',
            type: 'COUNTRY',
            code: 'GB',
            isActive: true,
          });
          created.jurisdictions++;
        } catch (e: any) {
          const existing = await taxService.jurisdictions.list({ type: 'COUNTRY' });
          const found = existing.find(j => j.code === 'GB');
          if (found) {
            ukJurisdiction = found;
          } else {
            throw new Error('Failed to create UK jurisdiction: ' + e.message);
          }
        }

        onProgress?.('Creating VAT rates...', 50);

        const today = new Date().toISOString().split('T')[0];

        // Standard VAT 20%
        try {
          await taxService.rates.create({
            jurisdictionId: ukJurisdiction.id,
            name: 'Standard VAT',
            rate: 20,
            taxType: 'VAT',
            priority: 1,
            isCompound: false,
            appliesToShipping: true,
            appliesToProducts: true,
            effectiveFrom: today,
            isActive: true,
          });
          created.rates++;
        } catch (e) {
          console.warn('Failed to create Standard VAT:', e);
        }

        // Reduced VAT 5%
        try {
          await taxService.rates.create({
            jurisdictionId: ukJurisdiction.id,
            name: 'Reduced VAT',
            rate: 5,
            taxType: 'VAT',
            priority: 2,
            isCompound: false,
            appliesToShipping: false,
            appliesToProducts: true,
            effectiveFrom: today,
            isActive: true,
          });
          created.rates++;
        } catch (e) {
          console.warn('Failed to create Reduced VAT:', e);
        }

        onProgress?.('Setup complete!', 100);
        return { success: true, created };
      } catch (error: any) {
        console.error('UK VAT setup failed:', error);
        return { success: false, error: error.message || 'Failed to set up UK VAT', created };
      }
    },

    /**
     * Setup Australia GST
     */
    setupAustraliaGST: async (options: {
      abn?: string;
      onProgress?: (step: string, progress: number) => void;
    }): Promise<{ success: boolean; error?: string; created: { jurisdictions: number; rates: number } }> => {
      const { onProgress } = options;
      const created = { jurisdictions: 0, rates: 0 };

      try {
        onProgress?.('Creating Australia jurisdiction...', 10);

        // Create Australia country jurisdiction
        let auJurisdiction: TaxJurisdiction;
        try {
          auJurisdiction = await taxService.jurisdictions.create({
            name: 'Australia',
            type: 'COUNTRY',
            code: 'AU',
            isActive: true,
          });
          created.jurisdictions++;
        } catch (e: any) {
          const existing = await taxService.jurisdictions.list({ type: 'COUNTRY' });
          const found = existing.find(j => j.code === 'AU');
          if (found) {
            auJurisdiction = found;
          } else {
            throw new Error('Failed to create Australia jurisdiction: ' + e.message);
          }
        }

        onProgress?.('Creating GST rate...', 50);

        const today = new Date().toISOString().split('T')[0];

        // GST 10%
        try {
          await taxService.rates.create({
            jurisdictionId: auJurisdiction.id,
            name: 'GST',
            rate: 10,
            taxType: 'GST',
            priority: 1,
            isCompound: false,
            appliesToShipping: true,
            appliesToProducts: true,
            effectiveFrom: today,
            isActive: true,
          });
          created.rates++;
        } catch (e) {
          console.warn('Failed to create GST:', e);
        }

        onProgress?.('Setup complete!', 100);
        return { success: true, created };
      } catch (error: any) {
        console.error('Australia GST setup failed:', error);
        return { success: false, error: error.message || 'Failed to set up Australia GST', created };
      }
    },

    /**
     * Setup Canada GST/HST/PST
     */
    setupCanadaTax: async (options: {
      businessNumber?: string;
      businessProvince: string;
      onProgress?: (step: string, progress: number) => void;
    }): Promise<{ success: boolean; error?: string; created: { jurisdictions: number; rates: number } }> => {
      const { businessProvince, onProgress } = options;
      const created = { jurisdictions: 0, rates: 0 };

      const CANADA_PROVINCES = [
        { name: 'Ontario', code: 'ON', taxType: 'HST', rate: 13 },
        { name: 'Nova Scotia', code: 'NS', taxType: 'HST', rate: 15 },
        { name: 'New Brunswick', code: 'NB', taxType: 'HST', rate: 15 },
        { name: 'Prince Edward Island', code: 'PE', taxType: 'HST', rate: 15 },
        { name: 'Newfoundland and Labrador', code: 'NL', taxType: 'HST', rate: 15 },
        { name: 'British Columbia', code: 'BC', taxType: 'PST', rate: 7, gst: 5 },
        { name: 'Saskatchewan', code: 'SK', taxType: 'PST', rate: 6, gst: 5 },
        { name: 'Manitoba', code: 'MB', taxType: 'PST', rate: 7, gst: 5 },
        { name: 'Quebec', code: 'QC', taxType: 'QST', rate: 9.975, gst: 5 },
        { name: 'Alberta', code: 'AB', taxType: 'GST', rate: 0, gst: 5 },
        { name: 'Northwest Territories', code: 'NT', taxType: 'GST', rate: 0, gst: 5 },
        { name: 'Nunavut', code: 'NU', taxType: 'GST', rate: 0, gst: 5 },
        { name: 'Yukon', code: 'YT', taxType: 'GST', rate: 0, gst: 5 },
      ];

      try {
        onProgress?.('Creating Canada jurisdiction...', 5);

        // Create Canada country jurisdiction
        let caJurisdiction: TaxJurisdiction;
        try {
          caJurisdiction = await taxService.jurisdictions.create({
            name: 'Canada',
            type: 'COUNTRY',
            code: 'CA',
            isActive: true,
          });
          created.jurisdictions++;
        } catch (e: any) {
          const existing = await taxService.jurisdictions.list({ type: 'COUNTRY' });
          const found = existing.find(j => j.code === 'CA');
          if (found) {
            caJurisdiction = found;
          } else {
            throw new Error('Failed to create Canada jurisdiction: ' + e.message);
          }
        }

        onProgress?.('Creating Federal GST...', 15);

        const today = new Date().toISOString().split('T')[0];

        // Federal GST 5%
        try {
          await taxService.rates.create({
            jurisdictionId: caJurisdiction.id,
            name: 'Federal GST',
            rate: 5,
            taxType: 'GST',
            priority: 1,
            isCompound: false,
            appliesToShipping: true,
            appliesToProducts: true,
            effectiveFrom: today,
            isActive: true,
          });
          created.rates++;
        } catch (e) {
          console.warn('Failed to create Federal GST:', e);
        }

        // Create business province jurisdiction and rates
        const provinceData = CANADA_PROVINCES.find(p => p.code === businessProvince);
        if (provinceData) {
          onProgress?.(`Creating ${provinceData.name}...`, 50);

          try {
            const provinceJurisdiction = await taxService.jurisdictions.create({
              name: provinceData.name,
              type: 'STATE',
              code: provinceData.code,
              parentId: caJurisdiction.id,
              isActive: true,
            });
            created.jurisdictions++;

            // Create provincial tax rate
            if (provinceData.rate > 0) {
              const taxType = provinceData.taxType as TaxType;
              await taxService.rates.create({
                jurisdictionId: provinceJurisdiction.id,
                name: `${provinceData.name} ${provinceData.taxType}`,
                rate: provinceData.rate,
                taxType: taxType === 'QST' ? 'QST' : taxType === 'PST' ? 'PST' : 'HST',
                priority: 2,
                isCompound: provinceData.taxType === 'QST', // QST is compound (tax on GST)
                appliesToShipping: true,
                appliesToProducts: true,
                effectiveFrom: today,
                isActive: true,
              });
              created.rates++;
            }
          } catch (e) {
            console.warn(`Failed to create province ${provinceData.name}:`, e);
          }
        }

        onProgress?.('Setup complete!', 100);
        return { success: true, created };
      } catch (error: any) {
        console.error('Canada tax setup failed:', error);
        return { success: false, error: error.message || 'Failed to set up Canada tax', created };
      }
    },
  },

  // Jurisdictions
  jurisdictions: {
    list: async (params?: { type?: JurisdictionType }): Promise<TaxJurisdiction[]> => {
      const searchParams = new URLSearchParams();
      if (params?.type) searchParams.set('type', params.type);
      const query = searchParams.toString();
      return apiRequest<TaxJurisdiction[]>(`/jurisdictions${query ? `?${query}` : ''}`);
    },

    get: async (id: string): Promise<TaxJurisdiction> => {
      return apiRequest<TaxJurisdiction>(`/jurisdictions/${id}`);
    },

    create: async (data: CreateJurisdictionRequest): Promise<TaxJurisdiction> => {
      return apiRequest<TaxJurisdiction>('/jurisdictions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: UpdateJurisdictionRequest): Promise<TaxJurisdiction> => {
      return apiRequest<TaxJurisdiction>(`/jurisdictions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      await apiRequest<void>(`/jurisdictions/${id}`, {
        method: 'DELETE',
      });
    },

    getRates: async (jurisdictionId: string): Promise<TaxRate[]> => {
      return apiRequest<TaxRate[]>(`/jurisdictions/${jurisdictionId}/rates`);
    },
  },

  // Tax Rates
  rates: {
    create: async (data: CreateTaxRateRequest): Promise<TaxRate> => {
      return apiRequest<TaxRate>('/rates', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: UpdateTaxRateRequest): Promise<TaxRate> => {
      return apiRequest<TaxRate>(`/rates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      await apiRequest<void>(`/rates/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Product Tax Categories
  categories: {
    list: async (): Promise<ProductTaxCategory[]> => {
      return apiRequest<ProductTaxCategory[]>('/categories');
    },

    get: async (id: string): Promise<ProductTaxCategory> => {
      return apiRequest<ProductTaxCategory>(`/categories/${id}`);
    },

    create: async (data: CreateProductTaxCategoryRequest): Promise<ProductTaxCategory> => {
      return apiRequest<ProductTaxCategory>('/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: UpdateProductTaxCategoryRequest): Promise<ProductTaxCategory> => {
      return apiRequest<ProductTaxCategory>(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      await apiRequest<void>(`/categories/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Tax Exemption Certificates
  exemptions: {
    list: async (customerId?: string): Promise<TaxExemptionCertificate[]> => {
      const searchParams = new URLSearchParams();
      if (customerId) searchParams.set('customerId', customerId);
      const query = searchParams.toString();
      return apiRequest<TaxExemptionCertificate[]>(`/exemptions${query ? `?${query}` : ''}`);
    },

    get: async (id: string): Promise<TaxExemptionCertificate> => {
      return apiRequest<TaxExemptionCertificate>(`/exemptions/${id}`);
    },

    create: async (data: CreateExemptionCertificateRequest): Promise<TaxExemptionCertificate> => {
      return apiRequest<TaxExemptionCertificate>('/exemptions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: UpdateExemptionCertificateRequest): Promise<TaxExemptionCertificate> => {
      return apiRequest<TaxExemptionCertificate>(`/exemptions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      await apiRequest<void>(`/exemptions/${id}`, {
        method: 'DELETE',
      });
    },
  },
};

export default taxService;

import { tenantFetch } from '../api/tenantFetch';

// ========================================
// Types
// ========================================

export interface FeatureFlag {
  key: string;
  defaultValue: boolean | string | number | Record<string, unknown>;
  rules?: FeatureRule[];
  source?: string;
}

export interface FeatureRule {
  condition?: Record<string, unknown>;
  force?: boolean | string | number | Record<string, unknown>;
  variations?: unknown[];
  weights?: number[];
}

export interface FeatureEvaluation {
  key: string;
  value: boolean | string | number | Record<string, unknown>;
  source: string;
  ruleId?: string;
  experiment?: {
    key: string;
    variationId: string;
  };
}

export interface FeaturesResponse {
  features: Record<string, FeatureFlag>;
  dateUpdated?: string;
  encryptedSDK?: boolean;
}

export interface Experiment {
  id: string;
  key: string;
  name: string;
  status: 'draft' | 'running' | 'stopped';
  variations: ExperimentVariation[];
  targetingConditions?: Record<string, unknown>;
  startDate?: string;
  endDate?: string;
}

export interface ExperimentVariation {
  id: string;
  key: string;
  name: string;
  weight: number;
}

export interface SDKConfig {
  apiHost: string;
  clientKey: string;
  enableDevMode?: boolean;
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
}

// ========================================
// Feature Flags Service
// ========================================

const API_BASE = '/api/feature-flags';

class FeatureFlagsService {
  private clientKey: string | null = null;

  /**
   * Set the GrowthBook client key for API calls
   */
  setClientKey(clientKey: string) {
    this.clientKey = clientKey;
  }

  /**
   * Get SDK configuration for the tenant
   */
  async getSDKConfig(tenantId: string): Promise<SDKConfig> {
    const response = await tenantFetch(`${API_BASE}/sdk/config`, {
      tenantId,
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch SDK config');
    }

    // Store the client key for subsequent calls
    if (result.data?.clientKey) {
      this.clientKey = result.data.clientKey;
    }

    return result.data;
  }

  /**
   * List all feature flags for the tenant
   */
  async listFeatures(tenantId: string): Promise<FeaturesResponse> {
    if (!this.clientKey) {
      // Try to get client key first
      await this.getSDKConfig(tenantId);
    }

    const response = await tenantFetch(
      `${API_BASE}/features?client_key=${encodeURIComponent(this.clientKey || '')}`,
      { tenantId }
    );

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch features');
    }

    return result.data;
  }

  /**
   * Evaluate a single feature flag
   */
  async evaluateFeature(
    tenantId: string,
    featureKey: string,
    attributes?: Record<string, unknown>
  ): Promise<FeatureEvaluation> {
    const response = await tenantFetch(`${API_BASE}/features/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_key: this.clientKey,
        feature_key: featureKey,
        attributes: attributes || {},
      }),
      tenantId,
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to evaluate feature');
    }

    return result.data;
  }

  /**
   * Batch evaluate multiple feature flags
   */
  async evaluateFeatures(
    tenantId: string,
    featureKeys: string[],
    attributes?: Record<string, unknown>
  ): Promise<Record<string, FeatureEvaluation>> {
    const response = await tenantFetch(`${API_BASE}/features/evaluate/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_key: this.clientKey,
        feature_keys: featureKeys,
        attributes: attributes || {},
      }),
      tenantId,
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to evaluate features');
    }

    return result.data;
  }

  /**
   * Set a feature override for testing
   */
  async setOverride(
    tenantId: string,
    featureKey: string,
    value: unknown
  ): Promise<void> {
    const response = await tenantFetch(`${API_BASE}/features/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature_key: featureKey,
        value,
      }),
      tenantId,
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to set override');
    }
  }

  /**
   * Clear a feature override
   */
  async clearOverride(tenantId: string, featureKey: string): Promise<void> {
    const response = await tenantFetch(
      `${API_BASE}/features/override/${encodeURIComponent(featureKey)}`,
      {
        method: 'DELETE',
        tenantId,
      }
    );

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to clear override');
    }
  }

  /**
   * List all experiments
   */
  async listExperiments(tenantId: string): Promise<Experiment[]> {
    const response = await tenantFetch(`${API_BASE}/experiments`, {
      tenantId,
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch experiments');
    }

    return result.data || [];
  }

  /**
   * Get a specific experiment
   */
  async getExperiment(tenantId: string, experimentId: string): Promise<Experiment> {
    const response = await tenantFetch(
      `${API_BASE}/experiments/${encodeURIComponent(experimentId)}`,
      { tenantId }
    );

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch experiment');
    }

    return result.data;
  }

  /**
   * Track an experiment event
   */
  async trackExperiment(
    tenantId: string,
    experimentId: string,
    variationId: string,
    userId?: string,
    attributes?: Record<string, unknown>
  ): Promise<void> {
    const response = await tenantFetch(
      `${API_BASE}/experiments/${encodeURIComponent(experimentId)}/track`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variation_id: variationId,
          user_id: userId,
          attributes,
        }),
        tenantId,
      }
    );

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to track experiment');
    }
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
  }

  /**
   * Check service readiness
   */
  async checkReady(): Promise<{ status: string; growthbook: boolean }> {
    const response = await fetch(`${API_BASE}/ready`);
    return response.json();
  }
}

export const featureFlagsService = new FeatureFlagsService();
export default featureFlagsService;

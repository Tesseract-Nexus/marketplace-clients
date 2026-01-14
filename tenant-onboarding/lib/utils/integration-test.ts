// Integration test utilities for tenant-service connection
import { onboardingApi } from '../api/onboarding';
import { locationApi } from '../api/location';
import { config } from '../config/app';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  service: string;
  timestamp: string;
  error?: string;
}

export interface IntegrationTestResult {
  api: HealthCheckResult;
  database: HealthCheckResult;
  overall: 'pass' | 'fail';
}

class TenantServiceIntegration {
  // Test API connectivity
  async testApiConnection(): Promise<HealthCheckResult> {
    try {
      const response = await fetch(`${config.api.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return {
          status: 'healthy',
          service: 'tenant-service-api',
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        service: 'tenant-service-api',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Test database connectivity through API
  async testDatabaseConnection(): Promise<HealthCheckResult> {
    try {
      const response = await fetch(`${config.api.baseUrl}/ready`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return {
          status: 'healthy',
          service: 'tenant-service-database',
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error(`Database readiness check failed with status ${response.status}`);
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        service: 'tenant-service-database',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }

  // Test onboarding flow end-to-end
  async testOnboardingFlow(): Promise<boolean> {
    try {
      // Test starting an onboarding session
      const session = await onboardingApi.startOnboarding('ecommerce');

      // Test business validation
      const businessValidation = await onboardingApi.validateBusinessName('Test Business');

      // Test location services
      const countries = await locationApi.getCountries();

      return !!(session && businessValidation && countries.length > 0);
    } catch (error) {
      console.error('Onboarding flow test failed:', error);
      return false;
    }
  }

  // Run comprehensive integration test
  async runIntegrationTest(): Promise<IntegrationTestResult> {
    console.log('🔍 Running tenant-service integration test...');

    const apiHealth = await this.testApiConnection();
    const dbHealth = await this.testDatabaseConnection();

    const overall = apiHealth.status === 'healthy' && dbHealth.status === 'healthy' ? 'pass' : 'fail';

    const result: IntegrationTestResult = {
      api: apiHealth,
      database: dbHealth,
      overall,
    };

    // Log results
    console.log('📊 Integration Test Results:');
    console.log(`   API: ${apiHealth.status} ${apiHealth.error ? `(${apiHealth.error})` : ''}`);
    console.log(`   Database: ${dbHealth.status} ${dbHealth.error ? `(${dbHealth.error})` : ''}`);
    console.log(`   Overall: ${overall.toUpperCase()}`);

    if (overall === 'pass') {
      console.log('✅ Tenant-service integration test PASSED');

      // Run onboarding flow test if basic connectivity is working
      const flowTest = await this.testOnboardingFlow();
      console.log(`   Onboarding Flow: ${flowTest ? 'PASS' : 'FAIL'}`);
    } else {
      console.log('❌ Tenant-service integration test FAILED');
      console.log('💡 Make sure tenant-service is running on', config.api.baseUrl);
    }

    return result;
  }
}

// Export singleton instance
export const tenantServiceIntegration = new TenantServiceIntegration();

// Development helper to test integration
export const testIntegration = async () => {
  if (config.app.environment === 'development') {
    return await tenantServiceIntegration.runIntegrationTest();
  } else {
    console.warn('Integration tests are only available in development mode');
    return null;
  }
};

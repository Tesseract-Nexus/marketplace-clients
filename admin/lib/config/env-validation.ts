/**
 * Environment Variable Validation
 * SECURITY: Validates required environment variables at startup
 *
 * Call this in instrumentation.ts to fail fast on misconfiguration
 */

import { logger } from '../logger';

// Required environment variables for the admin portal
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_TENANT_SERVICE_URL',
  'NEXT_PUBLIC_AUTH_SERVICE_URL',
] as const;

// Required in production only (unless fetched from GCP Secret Manager)
// Note: CSRF_SECRET is handled by lib/config/secrets.ts - fetched from GCP Secret Manager
// when USE_GCP_SECRET_MANAGER=true, otherwise from CSRF_SECRET env var
const PRODUCTION_REQUIRED_ENV_VARS = [
  // CSRF_SECRET is no longer required as env var - handled by secrets.ts
] as const;

// Secrets that are fetched from GCP Secret Manager (when USE_GCP_SECRET_MANAGER=true)
// or from environment variables (when USE_GCP_SECRET_MANAGER is not set)
const GCP_MANAGED_SECRETS = [
  'CSRF_SECRET',
] as const;

// Optional but recommended environment variables
const RECOMMENDED_ENV_VARS = [
  'NEXT_PUBLIC_API_BASE_URL',
  'CATEGORIES_SERVICE_URL',
  'PRODUCTS_SERVICE_URL',
  'ORDERS_SERVICE_URL',
  'CUSTOMERS_SERVICE_URL',
] as const;

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  localhostInProduction: string[];
  warnings: string[];
}

/**
 * Validates that all required environment variables are set
 * In production, also checks that no URLs contain localhost
 */
export function validateEnv(): EnvValidationResult {
  const result: EnvValidationResult = {
    valid: true,
    missing: [],
    localhostInProduction: [],
    warnings: [],
  };

  const isProduction = process.env.NODE_ENV === 'production';

  // Check required variables
  for (const key of REQUIRED_ENV_VARS) {
    const value = process.env[key];
    if (!value) {
      result.missing.push(key);
      result.valid = false;
    } else if (isProduction && value.includes('localhost')) {
      result.localhostInProduction.push(key);
      result.valid = false;
    }
  }

  // Check production-only required variables
  if (isProduction) {
    for (const key of PRODUCTION_REQUIRED_ENV_VARS) {
      const value = process.env[key];
      if (!value) {
        result.missing.push(key);
        result.valid = false;
      }
    }
  }

  // Check recommended variables (warnings only)
  for (const key of RECOMMENDED_ENV_VARS) {
    const value = process.env[key];
    if (!value) {
      result.warnings.push(`Recommended env var ${key} is not set`);
    } else if (isProduction && value.includes('localhost')) {
      result.warnings.push(`${key} contains localhost in production`);
    }
  }

  return result;
}

/**
 * Validates environment and throws if invalid
 * Use this in instrumentation.ts for fail-fast behavior
 */
export function validateEnvOrThrow(): void {
  const result = validateEnv();

  // Log warnings
  for (const warning of result.warnings) {
    logger.warn(warning);
  }

  if (!result.valid) {
    const errors: string[] = [];

    if (result.missing.length > 0) {
      errors.push(`Missing required environment variables: ${result.missing.join(', ')}`);
    }

    if (result.localhostInProduction.length > 0) {
      errors.push(
        `Production environment has localhost URLs for: ${result.localhostInProduction.join(', ')}. ` +
        'All service URLs must be properly configured for production deployment.'
      );
    }

    const message = `Environment validation failed:\n${errors.join('\n')}`;
    logger.error(message);
    throw new Error(message);
  }

  logger.info('Environment validation passed');
}

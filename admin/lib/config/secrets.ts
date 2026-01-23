/**
 * GCP Secret Manager Client
 *
 * Fetches secrets from GCP Secret Manager using Workload Identity.
 * Used in production when USE_GCP_SECRET_MANAGER=true.
 *
 * Prerequisites:
 * - Running on GKE with Workload Identity enabled
 * - Service account has secretAccessor role for required secrets
 * - Environment variables: GCP_PROJECT_ID, GCP_SECRET_PREFIX, USE_GCP_SECRET_MANAGER
 *
 * @see docs/secrets-management.md
 */

import { logger } from '../logger';

// Cache for secrets (refresh periodically in production)
const secretCache = new Map<string, { value: string; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Lazy-loaded client to avoid import issues during build
let secretManagerClient: import('@google-cloud/secret-manager').SecretManagerServiceClient | null = null;

/**
 * Check if GCP Secret Manager is enabled
 */
export function isGcpSecretManagerEnabled(): boolean {
  return process.env.USE_GCP_SECRET_MANAGER === 'true';
}

/**
 * Get the GCP project ID
 */
function getProjectId(): string {
  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    throw new Error('GCP_PROJECT_ID environment variable is required when using GCP Secret Manager');
  }
  return projectId;
}

/**
 * Get the secret name prefix (environment prefix)
 */
function getSecretPrefix(): string {
  return process.env.GCP_SECRET_PREFIX || 'devtest';
}

/**
 * Get or create the Secret Manager client
 */
async function getClient(): Promise<import('@google-cloud/secret-manager').SecretManagerServiceClient> {
  if (secretManagerClient) {
    return secretManagerClient;
  }

  // Dynamically import to avoid issues during build
  const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
  secretManagerClient = new SecretManagerServiceClient();
  return secretManagerClient;
}

/**
 * Fetch a secret from GCP Secret Manager
 *
 * @param secretId - The secret identifier (without prefix)
 * @returns The secret value
 * @throws Error if secret cannot be accessed
 */
export async function getSecret(secretId: string): Promise<string> {
  const projectId = getProjectId();
  const prefix = getSecretPrefix();
  const fullSecretId = `${prefix}-${secretId}`;

  // Check cache first
  const cached = secretCache.get(fullSecretId);
  if (cached && Date.now() < cached.expiry) {
    return cached.value;
  }

  const name = `projects/${projectId}/secrets/${fullSecretId}/versions/latest`;

  try {
    const client = await getClient();
    const [version] = await client.accessSecretVersion({ name });
    const value = version.payload?.data?.toString() || '';

    // Cache the result
    secretCache.set(fullSecretId, {
      value,
      expiry: Date.now() + CACHE_TTL,
    });

    logger.debug(`Fetched secret ${fullSecretId} from GCP Secret Manager`);
    return value;
  } catch (error) {
    logger.error(`Failed to access secret ${fullSecretId}:`, error);
    throw new Error(`Failed to access secret ${fullSecretId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch a secret and parse it as JSON
 *
 * @param secretId - The secret identifier (without prefix)
 * @returns The parsed JSON object
 */
export async function getSecretJson<T>(secretId: string): Promise<T> {
  const value = await getSecret(secretId);
  return JSON.parse(value) as T;
}

/**
 * Get a secret with fallback to environment variable
 *
 * This function first checks if GCP Secret Manager is enabled and tries to fetch
 * from there. If not available, falls back to environment variable.
 *
 * @param secretId - The secret identifier (e.g., 'csrf-secret')
 * @param envVar - The environment variable name to fall back to
 * @returns The secret value
 */
export async function getSecretWithFallback(secretId: string, envVar: string): Promise<string | undefined> {
  // First, check if GCP Secret Manager is enabled
  if (isGcpSecretManagerEnabled()) {
    try {
      const value = await getSecret(secretId);
      if (value) {
        return value;
      }
    } catch (error) {
      logger.warn(`Failed to get secret ${secretId} from GCP Secret Manager, falling back to env var:`, error);
    }
  }

  // Fallback to environment variable
  return process.env[envVar];
}

/**
 * Clear the secrets cache
 * Call this after secret rotation or when you need fresh values
 */
export function clearSecretCache(): void {
  secretCache.clear();
  logger.info('Secret cache cleared');
}

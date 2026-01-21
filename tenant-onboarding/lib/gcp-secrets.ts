import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Singleton client instance
let client: SecretManagerServiceClient | null = null;

function getClient(): SecretManagerServiceClient {
  if (!client) {
    client = new SecretManagerServiceClient();
  }
  return client;
}

// Cache for secrets to avoid repeated API calls
const secretCache = new Map<string, { value: string; expiry: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches a secret from GCP Secret Manager
 * @param secretName - The name of the secret (without version)
 * @param projectId - GCP project ID (defaults to GCP_PROJECT_ID env var)
 * @returns The secret value or null if not found
 */
export async function getSecret(
  secretName: string,
  projectId?: string
): Promise<string | null> {
  const gcpProjectId = projectId || process.env.GCP_PROJECT_ID;

  if (!gcpProjectId) {
    console.warn('GCP_PROJECT_ID not set, cannot fetch secret');
    return null;
  }

  // Check if GCP Secret Manager is enabled
  if (process.env.USE_GCP_SECRET_MANAGER !== 'true') {
    return null;
  }

  const cacheKey = `${gcpProjectId}/${secretName}`;

  // Check cache first
  const cached = secretCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.value;
  }

  try {
    const secretClient = getClient();
    const name = `projects/${gcpProjectId}/secrets/${secretName}/versions/latest`;

    const [version] = await secretClient.accessSecretVersion({ name });
    const payload = version.payload?.data;

    if (!payload) {
      console.warn(`Secret ${secretName} has no payload`);
      return null;
    }

    const secretValue =
      payload instanceof Uint8Array
        ? new TextDecoder().decode(payload)
        : String(payload);

    // Cache the result
    secretCache.set(cacheKey, {
      value: secretValue,
      expiry: Date.now() + CACHE_TTL_MS,
    });

    return secretValue;
  } catch (error) {
    console.error(`Failed to fetch secret ${secretName}:`, error);
    return null;
  }
}

/**
 * Gets a secret value, with fallback to environment variable
 * @param secretNameEnvVar - Environment variable containing the secret name
 * @param fallbackEnvVar - Environment variable for fallback value (for local dev)
 * @returns The secret value or null
 */
export async function getSecretWithFallback(
  secretNameEnvVar: string,
  fallbackEnvVar: string
): Promise<string | null> {
  const secretName = process.env[secretNameEnvVar];

  // If GCP secret name is provided, try to fetch from Secret Manager
  if (secretName) {
    const secret = await getSecret(secretName);
    if (secret) {
      return secret;
    }
  }

  // Fallback to direct environment variable (for local development)
  return process.env[fallbackEnvVar] || null;
}

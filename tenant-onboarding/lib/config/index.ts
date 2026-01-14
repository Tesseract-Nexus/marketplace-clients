/**
 * Runtime Configuration Service
 *
 * Fetches and caches backend service URLs from the /api/config endpoint.
 * This allows dynamic URL routing based on environment without rebuilding.
 */

export interface ServiceConfig {
  tenant: {
    baseUrl: string;
    draft: {
      save: string;
      get: (sessionId: string) => string;
      heartbeat: string;
      browserClose: string;
    };
    useBFF: boolean;
  };
  location: {
    baseUrl: string;
    useBFF: boolean;
  };
}

export interface AppConfig {
  services: ServiceConfig;
  environment: string;
}

// Singleton config cache
let configCache: AppConfig | null = null;
let configPromise: Promise<AppConfig> | null = null;

/**
 * Fetch runtime configuration from the server
 * Caches the result to avoid repeated fetches
 */
export async function getConfig(): Promise<AppConfig> {
  // Return cached config if available
  if (configCache) {
    return configCache;
  }

  // If a fetch is in progress, wait for it
  if (configPromise) {
    return configPromise;
  }

  // Fetch config from API
  configPromise = fetch('/api/config')
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch config');
      }
      const data = await response.json();

      // Get the pattern string from API response
      const getPattern = data.services.tenant.draft.get as string;

      // Transform the config, converting string pattern to function
      const config: AppConfig = {
        ...data,
        services: {
          ...data.services,
          tenant: {
            ...data.services.tenant,
            draft: {
              save: data.services.tenant.draft.save,
              heartbeat: data.services.tenant.draft.heartbeat,
              browserClose: data.services.tenant.draft.browserClose,
              // Convert string pattern to function
              get: (sessionId: string) => getPattern.replace('{sessionId}', sessionId),
            },
          },
        },
      };

      configCache = config;
      return config;
    })
    .catch((error) => {
      console.error('Failed to load config:', error);
      // Return default config (BFF pattern) on error
      const defaultConfig: AppConfig = {
        services: {
          tenant: {
            baseUrl: '',
            draft: {
              save: '/api/onboarding/draft/save',
              get: (sessionId: string) => `/api/onboarding/draft/${sessionId}`,
              heartbeat: '/api/onboarding/draft/heartbeat',
              browserClose: '/api/onboarding/draft/browser-close',
            },
            useBFF: true,
          },
          location: {
            baseUrl: '',
            useBFF: true,
          },
        },
        environment: 'development',
      };
      configCache = defaultConfig;
      return defaultConfig;
    })
    .finally(() => {
      configPromise = null;
    });

  return configPromise;
}

/**
 * Get the draft API URLs
 * Convenience method for draft operations
 */
export async function getDraftConfig() {
  const config = await getConfig();
  return config.services.tenant.draft;
}

/**
 * Clear the config cache (useful for testing or re-fetching)
 */
export function clearConfigCache() {
  configCache = null;
  configPromise = null;
}

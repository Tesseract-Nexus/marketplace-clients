/**
 * API Client - Re-exports enhanced client for backward compatibility
 *
 * This module maintains backward compatibility with existing code
 * while using the enhanced client under the hood.
 */

import { enhancedApiClient, EnhancedApiClient } from './enhanced-client';

// Export the enhanced client as apiClient for backward compatibility
export const apiClient = enhancedApiClient;

// Export the class for those who want to create custom instances
export { EnhancedApiClient as ApiClient };

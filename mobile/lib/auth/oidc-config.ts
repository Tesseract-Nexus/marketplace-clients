/**
 * OIDC Configuration for Keycloak Authentication
 *
 * This module provides configuration for OpenID Connect authentication
 * using Keycloak as the identity provider. Uses PKCE (Proof Key for Code Exchange)
 * for secure authorization code flow.
 */

import Constants from 'expo-constants';

// Environment-based Keycloak configuration
const KEYCLOAK_CONFIG = {
  development: {
    issuerUrl: 'https://devtest-customer-idp.tesserix.app/realms/tesserix-customer',
    clientId: 'storefront-mobile',
  },
  staging: {
    issuerUrl: 'https://staging-customer-idp.tesserix.app/realms/tesserix-customer',
    clientId: 'storefront-mobile',
  },
  production: {
    issuerUrl: 'https://customer-idp.tesserix.app/realms/tesserix-customer',
    clientId: 'storefront-mobile',
  },
} as const;

type Environment = 'development' | 'staging' | 'production';

const getEnvironment = (): Environment => {
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel as string | undefined;
  if (releaseChannel?.startsWith('prod')) {
    return 'production';
  }
  if (releaseChannel?.startsWith('staging')) {
    return 'staging';
  }
  return 'development';
};

const environment = getEnvironment();
const config = KEYCLOAK_CONFIG[environment];

/**
 * Keycloak OIDC Configuration
 */
export const OIDC_CONFIG = {
  /**
   * Keycloak issuer URL (includes realm)
   */
  issuerUrl: config.issuerUrl,

  /**
   * OAuth2 client ID (public client - no secret)
   */
  clientId: config.clientId,

  /**
   * Scopes to request
   * - openid: Required for OIDC
   * - profile: Access to user profile (name, etc.)
   * - email: Access to email
   * - offline_access: Get refresh tokens
   */
  scopes: ['openid', 'profile', 'email', 'offline_access'],

  /**
   * OIDC Discovery endpoints
   */
  discovery: {
    authorizationEndpoint: `${config.issuerUrl}/protocol/openid-connect/auth`,
    tokenEndpoint: `${config.issuerUrl}/protocol/openid-connect/token`,
    revocationEndpoint: `${config.issuerUrl}/protocol/openid-connect/revoke`,
    endSessionEndpoint: `${config.issuerUrl}/protocol/openid-connect/logout`,
    userInfoEndpoint: `${config.issuerUrl}/protocol/openid-connect/userinfo`,
    jwksUri: `${config.issuerUrl}/protocol/openid-connect/certs`,
    introspectionEndpoint: `${config.issuerUrl}/protocol/openid-connect/token/introspect`,
  },

  /**
   * Redirect URIs for OAuth callback
   */
  redirectUri: 'tesserix://auth/callback',
  postLogoutRedirectUri: 'tesserix://auth/logout',

  /**
   * Use PKCE (Proof Key for Code Exchange) - Required for public clients
   */
  usePKCE: true,

  /**
   * Additional authorization parameters
   */
  extraParams: {
    // Prompt for login every time (can be 'none', 'login', 'consent', 'select_account')
    // prompt: 'login',
  },
} as const;

/**
 * OIDC Discovery Document type
 */
export interface OIDCDiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  revocation_endpoint: string;
  end_session_endpoint: string;
  jwks_uri: string;
  introspection_endpoint: string;
  response_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  scopes_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  claims_supported: string[];
  code_challenge_methods_supported: string[];
  grant_types_supported: string[];
}

/**
 * Token response from Keycloak
 */
export interface OIDCTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  refresh_expires_in?: number;
  id_token?: string;
  scope: string;
  session_state?: string;
}

/**
 * User info response from Keycloak
 */
export interface OIDCUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  tenant_id?: string;
  tenant_slug?: string;
  customer_id?: string;
  loyalty_tier?: string;
  picture?: string;
  locale?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
}

/**
 * Decoded JWT Claims from access token
 */
export interface AccessTokenClaims {
  exp: number;
  iat: number;
  jti: string;
  iss: string;
  aud: string | string[];
  sub: string;
  typ: string;
  azp: string;
  session_state?: string;
  acr?: string;
  scope: string;
  sid?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  tenant_id?: string;
  tenant_slug?: string;
  customer_id?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
}

export default OIDC_CONFIG;

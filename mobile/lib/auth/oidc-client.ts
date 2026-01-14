/**
 * OIDC Client for Keycloak Authentication
 *
 * Implements OAuth 2.0 Authorization Code Flow with PKCE
 * for React Native/Expo mobile apps.
 */

import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import {
  OIDC_CONFIG,
  type OIDCTokenResponse,
  type OIDCUserInfo,
  type AccessTokenClaims,
} from './oidc-config';

// Ensure browser is ready for auth flow
WebBrowser.maybeCompleteAuthSession();

/**
 * PKCE Code Verifier and Challenge
 */
interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * Auth Request State
 */
interface AuthRequestState {
  state: string;
  nonce: string;
  codeVerifier: string;
  returnTo?: string;
}

/**
 * Stored auth state for callback handling
 */
let pendingAuthState: AuthRequestState | null = null;

/**
 * Generate cryptographically secure random string
 */
async function generateRandomString(length: number = 43): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  // Convert to URL-safe base64
  const base64 = btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return base64.substring(0, length);
}

/**
 * Generate PKCE code verifier and challenge
 */
async function generatePKCE(): Promise<PKCEPair> {
  const codeVerifier = await generateRandomString(43);

  // Generate SHA-256 hash of verifier
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );

  // Convert to URL-safe base64
  const codeChallenge = hash
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return { codeVerifier, codeChallenge };
}

/**
 * Generate state parameter for CSRF protection
 */
async function generateState(): Promise<string> {
  return generateRandomString(32);
}

/**
 * Generate nonce for ID token validation
 */
async function generateNonce(): Promise<string> {
  return generateRandomString(32);
}

/**
 * Build authorization URL
 */
function buildAuthorizationUrl(
  codeChallenge: string,
  state: string,
  nonce: string,
  options?: {
    prompt?: 'none' | 'login' | 'consent' | 'select_account';
    loginHint?: string;
    uiLocales?: string;
  }
): string {
  const params = new URLSearchParams({
    client_id: OIDC_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: OIDC_CONFIG.redirectUri,
    scope: OIDC_CONFIG.scopes.join(' '),
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  if (options?.prompt) {
    params.set('prompt', options.prompt);
  }
  if (options?.loginHint) {
    params.set('login_hint', options.loginHint);
  }
  if (options?.uiLocales) {
    params.set('ui_locales', options.uiLocales);
  }

  return `${OIDC_CONFIG.discovery.authorizationEndpoint}?${params.toString()}`;
}

/**
 * Start the authentication flow
 * Opens system browser for Keycloak login
 */
export async function startAuthFlow(options?: {
  prompt?: 'none' | 'login' | 'consent' | 'select_account';
  loginHint?: string;
  returnTo?: string;
}): Promise<OIDCTokenResponse> {
  // Generate PKCE pair
  const { codeVerifier, codeChallenge } = await generatePKCE();

  // Generate state and nonce
  const state = await generateState();
  const nonce = await generateNonce();

  // Store state for callback validation
  pendingAuthState = {
    state,
    nonce,
    codeVerifier,
    returnTo: options?.returnTo,
  };

  // Build authorization URL
  const authUrl = buildAuthorizationUrl(codeChallenge, state, nonce, {
    prompt: options?.prompt,
    loginHint: options?.loginHint,
  });

  // Open browser for authentication
  const result = await WebBrowser.openAuthSessionAsync(
    authUrl,
    OIDC_CONFIG.redirectUri,
    {
      showInRecents: false,
      createTask: true,
    }
  );

  if (result.type === 'cancel') {
    pendingAuthState = null;
    throw new Error('Authentication cancelled by user');
  }

  if (result.type === 'dismiss') {
    pendingAuthState = null;
    throw new Error('Authentication dismissed');
  }

  if (result.type !== 'success' || !result.url) {
    pendingAuthState = null;
    throw new Error('Authentication failed');
  }

  // Parse callback URL
  const callbackUrl = new URL(result.url);
  const code = callbackUrl.searchParams.get('code');
  const returnedState = callbackUrl.searchParams.get('state');
  const error = callbackUrl.searchParams.get('error');
  const errorDescription = callbackUrl.searchParams.get('error_description');

  // Handle error response
  if (error) {
    pendingAuthState = null;
    throw new Error(`OAuth error: ${error} - ${errorDescription || 'Unknown error'}`);
  }

  // Validate state
  if (!returnedState || returnedState !== pendingAuthState.state) {
    pendingAuthState = null;
    throw new Error('Invalid state parameter - possible CSRF attack');
  }

  // Validate code
  if (!code) {
    pendingAuthState = null;
    throw new Error('No authorization code received');
  }

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code, codeVerifier);

  pendingAuthState = null;

  return tokens;
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<OIDCTokenResponse> {
  const response = await fetch(OIDC_CONFIG.discovery.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: OIDC_CONFIG.clientId,
      code,
      redirect_uri: OIDC_CONFIG.redirectUri,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'token_exchange_failed' }));
    throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
  }

  const tokens: OIDCTokenResponse = await response.json();

  return tokens;
}

/**
 * Refresh tokens using refresh token
 */
export async function refreshTokens(refreshToken: string): Promise<OIDCTokenResponse> {
  const response = await fetch(OIDC_CONFIG.discovery.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: OIDC_CONFIG.clientId,
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'refresh_failed' }));
    throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
  }

  const tokens: OIDCTokenResponse = await response.json();

  return tokens;
}

/**
 * Get user info from Keycloak
 */
export async function getUserInfo(accessToken: string): Promise<OIDCUserInfo> {
  const response = await fetch(OIDC_CONFIG.discovery.userInfoEndpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  const userInfo: OIDCUserInfo = await response.json();

  return userInfo;
}

/**
 * Revoke token (logout from Keycloak)
 */
export async function revokeToken(
  token: string,
  tokenTypeHint: 'access_token' | 'refresh_token' = 'refresh_token'
): Promise<void> {
  const response = await fetch(OIDC_CONFIG.discovery.revocationEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: OIDC_CONFIG.clientId,
      token,
      token_type_hint: tokenTypeHint,
    }).toString(),
  });

  // Token revocation may return 200 even if token was already revoked
  if (!response.ok && response.status !== 200) {
    console.warn('Token revocation failed:', response.status);
  }
}

/**
 * Perform full logout (end Keycloak session)
 */
export async function logout(
  idToken?: string,
  refreshToken?: string
): Promise<void> {
  // Revoke refresh token first
  if (refreshToken) {
    try {
      await revokeToken(refreshToken, 'refresh_token');
    } catch (error) {
      console.warn('Failed to revoke refresh token:', error);
    }
  }

  // Build end session URL
  const endSessionParams = new URLSearchParams({
    client_id: OIDC_CONFIG.clientId,
    post_logout_redirect_uri: OIDC_CONFIG.postLogoutRedirectUri,
  });

  if (idToken) {
    endSessionParams.set('id_token_hint', idToken);
  }

  const endSessionUrl = `${OIDC_CONFIG.discovery.endSessionEndpoint}?${endSessionParams.toString()}`;

  // Open browser for Keycloak logout
  try {
    await WebBrowser.openAuthSessionAsync(
      endSessionUrl,
      OIDC_CONFIG.postLogoutRedirectUri,
      {
        showInRecents: false,
      }
    );
  } catch (error) {
    // Logout may fail if session already expired
    console.warn('Keycloak logout error:', error);
  }
}

/**
 * Decode JWT token (without verification - verification done server-side)
 */
export function decodeAccessToken(token: string): AccessTokenClaims {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(decoded);

    return claims as AccessTokenClaims;
  } catch (error) {
    throw new Error('Failed to decode access token');
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiresAt: number, bufferSeconds: number = 60): boolean {
  const now = Math.floor(Date.now() / 1000);
  return expiresAt - bufferSeconds <= now;
}

/**
 * Get token expiration timestamp from token
 */
export function getTokenExpiration(token: string): number {
  const claims = decodeAccessToken(token);
  return claims.exp;
}

export default {
  startAuthFlow,
  refreshTokens,
  getUserInfo,
  revokeToken,
  logout,
  decodeAccessToken,
  isTokenExpired,
  getTokenExpiration,
};

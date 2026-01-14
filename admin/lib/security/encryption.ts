/**
 * Encryption Utilities
 *
 * Provides AES-256 encryption for sensitive PII data as required by:
 * - DPDPA 2023 (India)
 * - Privacy Act 1988 / APPs (Australia)
 * - GDPR (EU)
 * - PCI-DSS (for payment-related data)
 *
 * @see docs/SECURITY_COMPLIANCE.md Section 1.2 - Data Encryption
 */

/**
 * Client-side encryption using Web Crypto API
 * Note: For production, encryption should be done server-side with proper key management
 */

// Encryption algorithm configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 128; // 128 bits for GCM authentication tag

/**
 * Generate a random encryption key
 * Note: In production, keys should come from a Key Management Service (KMS)
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Export a CryptoKey to a base64 string for storage
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Import a base64 string back to a CryptoKey
 */
export async function importKey(base64Key: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a string value using AES-256-GCM
 * Returns: base64(iv + ciphertext + tag)
 */
export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: TAG_LENGTH,
    },
    key,
    data
  );

  // Combine IV + ciphertext for storage
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a value encrypted with encrypt()
 */
export async function decrypt(encryptedBase64: string, key: CryptoKey): Promise<string> {
  // Decode from base64
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

  // Extract IV and ciphertext
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: TAG_LENGTH,
    },
    key,
    ciphertext
  );

  // Decode to string
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Hash a value using SHA-256 (one-way, for lookups)
 */
export async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return btoa(String.fromCharCode(...hashArray));
}

/**
 * Generate a secure random string for tokens, IDs, etc.
 */
export function generateSecureToken(length: number = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Encrypt an object's PII fields
 */
export async function encryptPiiFields<T extends Record<string, unknown>>(
  obj: T,
  key: CryptoKey,
  piiFields: string[]
): Promise<T> {
  const encrypted: Record<string, unknown> = { ...obj };

  for (const field of piiFields) {
    if (field in obj && typeof obj[field] === 'string') {
      encrypted[field] = await encrypt(obj[field] as string, key);
      // Store hash for lookup
      encrypted[`${field}Hash`] = await hashValue(obj[field] as string);
    }
  }

  return encrypted as T;
}

/**
 * Decrypt an object's PII fields
 */
export async function decryptPiiFields<T extends Record<string, unknown>>(
  obj: T,
  key: CryptoKey,
  piiFields: string[]
): Promise<T> {
  const decrypted: Record<string, unknown> = { ...obj };

  for (const field of piiFields) {
    if (field in obj && typeof obj[field] === 'string') {
      try {
        decrypted[field] = await decrypt(obj[field] as string, key);
      } catch (error) {
        // If decryption fails, assume it's not encrypted
        decrypted[field] = obj[field];
      }
    }
  }

  return decrypted as T;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Validate HMAC signature for webhooks
 */
export async function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  return secureCompare(expectedSignature, signature);
}

/**
 * Generate HMAC signature for webhooks
 */
export async function generateHmacSignature(
  payload: string,
  secret: string,
  algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
}

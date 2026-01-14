/**
 * PII Masking Utilities
 *
 * Provides utilities for masking Personally Identifiable Information (PII)
 * in logs, error messages, and other output to comply with:
 * - DPDPA 2023 (India)
 * - Privacy Act 1988 / APPs (Australia)
 * - GDPR (EU)
 *
 * @see docs/SECURITY_COMPLIANCE.md
 */

// PII field patterns to detect and mask
const PII_PATTERNS = {
  // Email addresses
  email: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,

  // Phone numbers (various formats)
  phone: /(\+?\d{1,4}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,

  // Credit card numbers (with or without spaces/dashes)
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,

  // Social Security / Tax File Numbers
  ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,

  // Indian PAN
  pan: /[A-Z]{5}\d{4}[A-Z]/gi,

  // Indian Aadhaar
  aadhaar: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,

  // Australian TFN (Tax File Number)
  tfn: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g,

  // IP addresses (v4)
  ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,

  // JWT tokens
  jwt: /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,

  // API keys (common patterns)
  apiKey: /(?:api[_-]?key|apikey|api_secret|secret_key|access_token|auth_token)['":\s]*[=:]?\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,

  // Bearer tokens
  bearerToken: /Bearer\s+[A-Za-z0-9_-]+\.?[A-Za-z0-9_-]*\.?[A-Za-z0-9_-]*/gi,
};

// Field names that commonly contain PII
const PII_FIELD_NAMES = [
  'email',
  'phone',
  'phoneNumber',
  'mobile',
  'telephone',
  'firstName',
  'first_name',
  'lastName',
  'last_name',
  'fullName',
  'full_name',
  'name',
  'displayName',
  'display_name',
  'address',
  'streetAddress',
  'street_address',
  'addressLine1',
  'address_line_1',
  'addressLine2',
  'address_line_2',
  'city',
  'state',
  'zipCode',
  'zip_code',
  'postalCode',
  'postal_code',
  'country',
  'ssn',
  'socialSecurityNumber',
  'pan',
  'aadhaar',
  'tfn',
  'taxId',
  'tax_id',
  'dateOfBirth',
  'date_of_birth',
  'dob',
  'birthDate',
  'birth_date',
  'password',
  'passwordHash',
  'password_hash',
  'secret',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'authToken',
  'auth_token',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'cvc',
  'expiryDate',
  'expiry_date',
  'bankAccount',
  'bank_account',
  'accountNumber',
  'account_number',
  'routingNumber',
  'routing_number',
  'ipAddress',
  'ip_address',
  'userAgent',
  'user_agent',
];

/**
 * Mask an email address
 * user@example.com -> u***@e***.com
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***.***';

  const [domainName, tld] = domain.split('.');
  const maskedLocal = local[0] + '***';
  const maskedDomain = domainName?.[0] + '***';

  return `${maskedLocal}@${maskedDomain}.${tld || '***'}`;
}

/**
 * Mask a phone number
 * +1-234-567-8901 -> +1-***-***-8901
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';

  const lastFour = digits.slice(-4);
  const prefix = digits.slice(0, Math.min(2, digits.length - 4));

  return `${prefix}***${lastFour}`;
}

/**
 * Mask a name
 * John Doe -> J*** D***
 */
export function maskName(name: string): string {
  return name
    .split(' ')
    .map(part => part[0] + '***')
    .join(' ');
}

/**
 * Mask a credit card number
 * 4111111111111111 -> ****-****-****-1111
 */
export function maskCreditCard(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 4) return '****';

  const lastFour = digits.slice(-4);
  return `****-****-****-${lastFour}`;
}

/**
 * Mask an IP address
 * 192.168.1.100 -> 192.168.***.***
 */
export function maskIpAddress(ip: string): string {
  const parts = ip.split('.');
  if (parts.length !== 4) return '***.***.***.***';

  return `${parts[0]}.${parts[1]}.***.***`;
}

/**
 * Mask a generic string by showing first and last characters
 */
export function maskString(value: string, visibleChars: number = 2): string {
  if (!value || value.length <= visibleChars * 2) {
    return '***';
  }

  const start = value.slice(0, visibleChars);
  const end = value.slice(-visibleChars);
  return `${start}***${end}`;
}

/**
 * Mask a JWT token
 */
export function maskJwt(token: string): string {
  const parts = token.split('.');
  if (parts.length !== 3) return '[MASKED_TOKEN]';

  return `${parts[0].slice(0, 10)}...[MASKED]...${parts[2].slice(-10)}`;
}

/**
 * Check if a field name indicates PII
 */
export function isPiiFieldName(fieldName: string): boolean {
  const lowerName = fieldName.toLowerCase();
  return PII_FIELD_NAMES.some(pii => lowerName.includes(pii.toLowerCase()));
}

/**
 * Mask a value based on its field name
 */
export function maskValueByFieldName(fieldName: string, value: unknown): unknown {
  if (value === null || value === undefined) return value;

  const stringValue = String(value);
  const lowerName = fieldName.toLowerCase();

  // Determine masking strategy based on field name
  if (lowerName.includes('email')) {
    return maskEmail(stringValue);
  }

  if (lowerName.includes('phone') || lowerName.includes('mobile') || lowerName.includes('telephone')) {
    return maskPhone(stringValue);
  }

  if (lowerName.includes('name') && !lowerName.includes('username')) {
    return maskName(stringValue);
  }

  if (lowerName.includes('card') || lowerName.includes('credit')) {
    return maskCreditCard(stringValue);
  }

  if (lowerName.includes('ip') && lowerName.includes('address')) {
    return maskIpAddress(stringValue);
  }

  if (lowerName.includes('token') || lowerName.includes('secret') || lowerName.includes('key') || lowerName.includes('password')) {
    return '[REDACTED]';
  }

  if (lowerName.includes('address') || lowerName.includes('street')) {
    return maskString(stringValue, 3);
  }

  if (lowerName.includes('ssn') || lowerName.includes('pan') || lowerName.includes('aadhaar') || lowerName.includes('tfn')) {
    return '[REDACTED]';
  }

  // Default masking for other PII fields
  return maskString(stringValue);
}

/**
 * Mask PII patterns in a string
 */
export function maskPiiInString(text: string): string {
  let masked = text;

  // Mask emails
  masked = masked.replace(PII_PATTERNS.email, (match) => maskEmail(match));

  // Mask JWT tokens
  masked = masked.replace(PII_PATTERNS.jwt, '[MASKED_JWT]');

  // Mask bearer tokens
  masked = masked.replace(PII_PATTERNS.bearerToken, 'Bearer [MASKED_TOKEN]');

  // Mask API keys
  masked = masked.replace(PII_PATTERNS.apiKey, (match, key) => {
    const prefix = match.split(/[=:'"]/)[0];
    return `${prefix}=[REDACTED]`;
  });

  // Mask credit cards
  masked = masked.replace(PII_PATTERNS.creditCard, (match) => maskCreditCard(match));

  // Note: We don't mask phone numbers aggressively in strings as they can
  // match other number patterns. Only mask when we know it's a phone field.

  return masked;
}

/**
 * Deep mask PII in an object
 */
export function maskPiiInObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    maxDepth?: number;
    currentDepth?: number;
  } = {}
): T {
  const { maxDepth = 10, currentDepth = 0 } = options;

  if (currentDepth >= maxDepth) {
    return '[MAX_DEPTH_REACHED]' as unknown as T;
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item =>
      typeof item === 'object' && item !== null
        ? maskPiiInObject(item as Record<string, unknown>, { maxDepth, currentDepth: currentDepth + 1 })
        : item
    ) as unknown as T;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isPiiFieldName(key)) {
      masked[key] = maskValueByFieldName(key, value);
    } else if (typeof value === 'string') {
      masked[key] = maskPiiInString(value);
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskPiiInObject(value as Record<string, unknown>, { maxDepth, currentDepth: currentDepth + 1 });
    } else {
      masked[key] = value;
    }
  }

  return masked as T;
}

/**
 * Create a safe log message with PII masked
 */
export function createSafeLogMessage(
  message: string,
  data?: Record<string, unknown>
): { message: string; data?: Record<string, unknown> } {
  const safeMessage = maskPiiInString(message);
  const safeData = data ? maskPiiInObject(data) : undefined;

  return { message: safeMessage, data: safeData };
}

/**
 * Secure logger wrapper that automatically masks PII
 */
export const secureLog = {
  info: (message: string, data?: Record<string, unknown>) => {
    const safe = createSafeLogMessage(message, data);
    if (process.env.NODE_ENV === 'development') {
      console.info(`[INFO] ${safe.message}`, safe.data || '');
    }
  },

  warn: (message: string, data?: Record<string, unknown>) => {
    const safe = createSafeLogMessage(message, data);
    console.warn(`[WARN] ${safe.message}`, safe.data || '');
  },

  error: (message: string, error?: Error | unknown, data?: Record<string, unknown>) => {
    const safe = createSafeLogMessage(message, data);
    const safeError = error instanceof Error
      ? { name: error.name, message: maskPiiInString(error.message), stack: error.stack }
      : error;
    console.error(`[ERROR] ${safe.message}`, safeError, safe.data || '');
  },

  debug: (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      const safe = createSafeLogMessage(message, data);
      console.debug(`[DEBUG] ${safe.message}`, safe.data || '');
    }
  },
};

export default secureLog;

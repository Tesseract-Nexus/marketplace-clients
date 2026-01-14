/**
 * Security Module
 *
 * Centralized security utilities for Tesseract Hub Admin Portal
 *
 * @see docs/SECURITY_COMPLIANCE.md
 */

// PII Masking utilities
export {
  maskEmail,
  maskPhone,
  maskName,
  maskCreditCard,
  maskIpAddress,
  maskString,
  maskJwt,
  isPiiFieldName,
  maskValueByFieldName,
  maskPiiInString,
  maskPiiInObject,
  createSafeLogMessage,
  secureLog,
} from './pii-masking';

// Encryption utilities
export {
  generateEncryptionKey,
  exportKey,
  importKey,
  encrypt,
  decrypt,
  hashValue,
  generateSecureToken,
  encryptPiiFields,
  decryptPiiFields,
  secureCompare,
  verifyHmacSignature,
  generateHmacSignature,
} from './encryption';

// Input sanitization
export { sanitizeInput, sanitizeHtml, validateInput, type SanitizeOptions } from './sanitization';

// Security headers configuration
export { securityHeaders, getSecurityHeadersConfig } from './headers';

// CSRF Protection
export {
  generateCsrfToken,
  validateCsrfToken,
  validateCsrfRequest,
  setCsrfCookie,
  createCsrfProtectedResponse,
  createCsrfErrorResponse,
  requiresCsrfProtection,
  withCsrfProtection,
  handleCsrfTokenRequest,
  type CsrfValidationResult,
} from './csrf';

// Authorization utilities
export {
  extractUserContext,
  hasMinimumRole,
  isAuthorizedForAdminPortal,
  requireAuthentication,
  requireRole,
  requireAdminPortalAccess,
  getAuthorizedHeaders,
  createAuthorizationErrorResponse,
  withAuthorization,
  type UserRole,
  type UserContext,
  type AuthorizationResult,
} from './authorization';

/**
 * Input Sanitization Utilities
 *
 * Provides utilities for sanitizing user input to prevent:
 * - XSS (Cross-Site Scripting)
 * - SQL Injection (when used with parameterized queries)
 * - Command Injection
 * - Path Traversal
 *
 * @see docs/SECURITY_COMPLIANCE.md Part 5 - Input Validation
 */

export interface SanitizeOptions {
  // Allow specific HTML tags
  allowedTags?: string[];
  // Allow specific HTML attributes
  allowedAttributes?: string[];
  // Maximum string length
  maxLength?: number;
  // Trim whitespace
  trim?: boolean;
  // Convert to lowercase
  lowercase?: boolean;
  // Remove null bytes
  removeNullBytes?: boolean;
  // Escape HTML entities
  escapeHtml?: boolean;
}

const DEFAULT_OPTIONS: SanitizeOptions = {
  allowedTags: [],
  allowedAttributes: [],
  maxLength: 10000,
  trim: true,
  lowercase: false,
  removeNullBytes: true,
  escapeHtml: true,
};

// HTML entity map for escaping
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtmlEntities(str: string): string {
  return str.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char] || char);
}

/**
 * Remove HTML tags from a string
 */
export function stripHtmlTags(str: string, allowedTags: string[] = []): string {
  if (allowedTags.length === 0) {
    // Strip all tags
    return str.replace(/<[^>]*>/g, '');
  }

  // Create regex to match tags not in allowed list
  const allowedPattern = allowedTags.map(tag => tag.toLowerCase()).join('|');
  const regex = new RegExp(`<(?!\/?(?:${allowedPattern})\\b)[^>]*>`, 'gi');
  return str.replace(regex, '');
}

/**
 * Remove null bytes (can be used in path traversal attacks)
 */
export function removeNullBytes(str: string): string {
  return str.replace(/\0/g, '');
}

/**
 * Sanitize a string input
 */
export function sanitizeInput(input: string, options: SanitizeOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let sanitized = input;

  // Remove null bytes first
  if (opts.removeNullBytes) {
    sanitized = removeNullBytes(sanitized);
  }

  // Trim whitespace
  if (opts.trim) {
    sanitized = sanitized.trim();
  }

  // Apply max length
  if (opts.maxLength && sanitized.length > opts.maxLength) {
    sanitized = sanitized.slice(0, opts.maxLength);
  }

  // Strip or escape HTML
  if (opts.escapeHtml) {
    sanitized = escapeHtmlEntities(sanitized);
  } else if (opts.allowedTags) {
    sanitized = stripHtmlTags(sanitized, opts.allowedTags);
  }

  // Convert to lowercase
  if (opts.lowercase) {
    sanitized = sanitized.toLowerCase();
  }

  return sanitized;
}

/**
 * Sanitize HTML content (for rich text that needs to preserve some formatting)
 */
export function sanitizeHtml(
  html: string,
  options: {
    allowedTags?: string[];
    allowedAttributes?: string[];
  } = {}
): string {
  const { allowedTags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'span'], allowedAttributes = ['href', 'class'] } = options;

  // First, strip disallowed tags
  let sanitized = stripHtmlTags(html, allowedTags);

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove data: URLs (except safe ones)
  sanitized = sanitized.replace(/data:(?!image\/(png|jpe?g|gif|webp))/gi, '');

  // Remove disallowed attributes (keeping only allowed ones)
  const attrPattern = new RegExp(
    `\\s+(?!(?:${allowedAttributes.join('|')})\\b)[a-z-]+\\s*=\\s*["'][^"']*["']`,
    'gi'
  );
  sanitized = sanitized.replace(attrPattern, '');

  return sanitized;
}

/**
 * Validate and sanitize various input types
 */
export const validateInput = {
  /**
   * Validate and sanitize an email address
   */
  email: (input: string): { valid: boolean; sanitized: string; error?: string } => {
    const sanitized = sanitizeInput(input, { trim: true, lowercase: true });
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(sanitized)) {
      return { valid: false, sanitized, error: 'Invalid email format' };
    }

    return { valid: true, sanitized };
  },

  /**
   * Validate and sanitize a phone number
   */
  phone: (input: string): { valid: boolean; sanitized: string; error?: string } => {
    // Keep only digits, plus sign, and common separators
    const sanitized = input.replace(/[^\d+\-.\s()]/g, '').trim();
    const digitsOnly = sanitized.replace(/\D/g, '');

    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      return { valid: false, sanitized, error: 'Phone number must be between 7 and 15 digits' };
    }

    return { valid: true, sanitized };
  },

  /**
   * Validate and sanitize a URL
   */
  url: (input: string): { valid: boolean; sanitized: string; error?: string } => {
    const sanitized = sanitizeInput(input, { trim: true });

    try {
      const url = new URL(sanitized);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        return { valid: false, sanitized, error: 'URL must use http or https protocol' };
      }
      return { valid: true, sanitized: url.toString() };
    } catch {
      return { valid: false, sanitized, error: 'Invalid URL format' };
    }
  },

  /**
   * Validate and sanitize a slug (URL-safe identifier)
   */
  slug: (input: string): { valid: boolean; sanitized: string; error?: string } => {
    const sanitized = sanitizeInput(input, { trim: true, lowercase: true })
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (sanitized.length < 2) {
      return { valid: false, sanitized, error: 'Slug must be at least 2 characters' };
    }

    if (sanitized.length > 100) {
      return { valid: false, sanitized: sanitized.slice(0, 100), error: 'Slug must be at most 100 characters' };
    }

    return { valid: true, sanitized };
  },

  /**
   * Validate and sanitize a username
   */
  username: (input: string): { valid: boolean; sanitized: string; error?: string } => {
    const sanitized = sanitizeInput(input, { trim: true })
      .replace(/[^a-zA-Z0-9_.-]/g, '');

    if (sanitized.length < 3) {
      return { valid: false, sanitized, error: 'Username must be at least 3 characters' };
    }

    if (sanitized.length > 50) {
      return { valid: false, sanitized: sanitized.slice(0, 50), error: 'Username must be at most 50 characters' };
    }

    return { valid: true, sanitized };
  },

  /**
   * Validate file path to prevent path traversal
   */
  filePath: (input: string): { valid: boolean; sanitized: string; error?: string } => {
    let sanitized = removeNullBytes(input).trim();

    // Remove path traversal sequences
    sanitized = sanitized.replace(/\.\./g, '').replace(/\/\//g, '/');

    // Check for remaining dangerous patterns
    if (sanitized.includes('..') || sanitized.startsWith('/')) {
      return { valid: false, sanitized, error: 'Invalid file path' };
    }

    return { valid: true, sanitized };
  },

  /**
   * Validate numeric input
   */
  number: (
    input: string | number,
    options: { min?: number; max?: number; integer?: boolean } = {}
  ): { valid: boolean; sanitized: number; error?: string } => {
    const { min, max, integer = false } = options;
    const num = typeof input === 'string' ? parseFloat(input) : input;

    if (isNaN(num)) {
      return { valid: false, sanitized: 0, error: 'Invalid number' };
    }

    if (integer && !Number.isInteger(num)) {
      return { valid: false, sanitized: Math.floor(num), error: 'Must be an integer' };
    }

    if (min !== undefined && num < min) {
      return { valid: false, sanitized: num, error: `Number must be at least ${min}` };
    }

    if (max !== undefined && num > max) {
      return { valid: false, sanitized: num, error: `Number must be at most ${max}` };
    }

    return { valid: true, sanitized: num };
  },
};

/**
 * Sanitize SQL-like patterns (for search queries)
 * Note: Always use parameterized queries - this is an additional safety measure
 */
export function sanitizeSqlPattern(input: string): string {
  // Escape SQL wildcards and special characters
  return input
    .replace(/'/g, "''")
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/\[/g, '\\[')
    .replace(/]/g, '\\]');
}

/**
 * Sanitize for use in command-line arguments
 * Note: Avoid shell execution when possible
 */
export function sanitizeForShell(input: string): string {
  // Remove or escape shell special characters
  return input
    .replace(/[;&|`$(){}[\]<>'"\\!#*?~]/g, '')
    .trim();
}

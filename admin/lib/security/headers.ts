/**
 * Security Headers Configuration
 *
 * Implements security headers as required by:
 * - OWASP Security Headers
 * - CSP (Content Security Policy)
 * - HSTS (HTTP Strict Transport Security)
 *
 * @see docs/SECURITY_COMPLIANCE.md Part 5 - Security Headers
 */

interface SecurityHeader {
  key: string;
  value: string;
}

/**
 * Content Security Policy directives
 */
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", `https://${process.env.OPENPANEL_URL || 'dev-analytics.tesserix.app'}`], // Next.js requires these
  'style-src': ["'self'", "'unsafe-inline'"], // For Tailwind and inline styles
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    `https://*.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app'}`,
    `wss://*.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app'}`,
    process.env.NEXT_PUBLIC_API_URL || '',
    'https://api.posthog.com', // Analytics
    'https://www.google-analytics.com',
    'https://api.frankfurter.app', // Currency exchange rates
    'https://storage.googleapis.com', // GCS storage for QR codes
    `https://${process.env.OPENPANEL_URL || 'dev-analytics.tesserix.app'}`, // OpenPanel analytics
  ].filter(Boolean),
  'frame-ancestors': ["'none'"], // Prevent clickjacking
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
  'worker-src': ["'self'", 'blob:'],
  'child-src': ["'self'", 'blob:'],
  'media-src': ["'self'"],
  'manifest-src': ["'self'"],
  'upgrade-insecure-requests': [],
};

/**
 * Build CSP header value from directives
 */
function buildCspHeader(isDevelopment: boolean = false): string {
  const directives = { ...CSP_DIRECTIVES };

  // In development, allow localhost connections
  if (isDevelopment) {
    directives['connect-src'] = [
      ...directives['connect-src'],
      'http://localhost:*',
      'ws://localhost:*',
    ];
  }

  return Object.entries(directives)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive;
      }
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Security headers for Next.js
 */
export const securityHeaders: SecurityHeader[] = [
  // Strict Transport Security - enforce HTTPS
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },

  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },

  // Prevent clickjacking - frame embedding
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },

  // XSS Protection (legacy, but still useful for older browsers)
  // Note: Modern approach is CSP
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },

  // Control referrer information
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },

  // Permissions Policy (formerly Feature-Policy)
  {
    key: 'Permissions-Policy',
    value: [
      'accelerometer=()',
      'camera=()',
      'geolocation=(self)',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=(self)',
      'publickey-credentials-create=(self)',
      'publickey-credentials-get=(self)',
      'usb=()',
    ].join(', '),
  },

  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: buildCspHeader(process.env.NODE_ENV === 'development'),
  },

  // Prevent DNS prefetching
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off',
  },

  // Cross-Origin Embedder Policy
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'credentialless',
  },

  // Cross-Origin Opener Policy
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },

  // Cross-Origin Resource Policy
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin',
  },
];

/**
 * Get security headers configuration for Next.js
 */
export function getSecurityHeadersConfig() {
  return {
    source: '/:path*',
    headers: securityHeaders,
  };
}

/**
 * Export headers as a map for middleware use
 */
export function getSecurityHeadersMap(): Map<string, string> {
  return new Map(securityHeaders.map(h => [h.key, h.value]));
}

/**
 * Apply security headers to a Response object
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  for (const { key, value } of securityHeaders) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

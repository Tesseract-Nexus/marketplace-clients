/**
 * HTML Sanitization Utility
 * SECURITY: Sanitizes HTML content to prevent XSS attacks
 * Uses dompurify for client-side sanitization
 */

// @ts-expect-error - dompurify types may not be fully compatible
import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    // Allow common HTML elements for content pages
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
      'figure', 'figcaption',
      'article', 'section', 'aside', 'header', 'footer',
      'details', 'summary',
    ],
    // Allow common attributes
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'src', 'alt', 'title', 'width', 'height',
      'class', 'id', 'style',
      'colspan', 'rowspan',
    ],
    // Ensure links open safely
    ADD_ATTR: ['target', 'rel'],
    // Force safe link attributes
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    // Remove dangerous tags entirely
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
  });
}

/**
 * Create sanitized HTML props for React's dangerouslySetInnerHTML
 * @param html - The HTML string to sanitize
 * @returns Object with __html property containing sanitized HTML
 */
export function createSanitizedHtml(html: string): { __html: string } {
  return { __html: sanitizeHtml(html) };
}

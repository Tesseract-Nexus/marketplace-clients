'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { CustomHtmlBlockConfig } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

/**
 * CustomHtmlBlock - Renders custom HTML content
 *
 * SECURITY NOTE: This component can optionally sandbox content in an iframe
 * to prevent XSS attacks. When `sandboxed` is true, content is rendered
 * in an isolated iframe with restricted permissions.
 */
export function CustomHtmlBlock({ config }: BlockComponentProps<CustomHtmlBlockConfig>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number | null>(null);

  // Sanitized rendering for non-sandboxed mode
  useEffect(() => {
    if (config.sandboxed || !containerRef.current) return;

    // In production, you'd want to use a library like DOMPurify
    // to sanitize the HTML before rendering
    const sanitizedHtml = sanitizeHtml(config.html, config.allowScripts);
    containerRef.current.innerHTML = sanitizedHtml;

    // Inject custom CSS if provided
    if (config.css) {
      const styleEl = document.createElement('style');
      styleEl.textContent = config.css;
      containerRef.current.appendChild(styleEl);
    }
  }, [config.html, config.css, config.allowScripts, config.sandboxed]);

  // Sandboxed iframe rendering
  useEffect(() => {
    if (!config.sandboxed || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Build complete HTML document
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, sans-serif; }
            ${config.css || ''}
          </style>
        </head>
        <body>
          ${config.html}
        </body>
      </html>
    `;

    doc.open();
    doc.write(fullHtml);
    doc.close();

    // Resize iframe to content
    const resizeObserver = new ResizeObserver(() => {
      const height = doc.body.scrollHeight;
      setIframeHeight(height);
    });

    if (doc.body) {
      resizeObserver.observe(doc.body);
    }

    return () => resizeObserver.disconnect();
  }, [config.html, config.css, config.sandboxed]);

  // Build sandbox permissions
  const sandboxPermissions = config.allowScripts
    ? 'allow-scripts allow-same-origin'
    : '';

  if (config.sandboxed) {
    return (
      <div
        className="custom-html-block"
        style={{
          minHeight: config.minHeight,
          maxHeight: config.maxHeight,
        }}
      >
        <iframe
          ref={iframeRef}
          sandbox={sandboxPermissions}
          className="w-full border-0"
          style={{
            height: iframeHeight ?? config.minHeight ?? 200,
            maxHeight: config.maxHeight,
          }}
          title="Custom content"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('custom-html-block', !config.allowScripts && 'custom-html-safe')}
      style={{
        minHeight: config.minHeight,
        maxHeight: config.maxHeight,
        overflow: config.maxHeight ? 'auto' : undefined,
      }}
    />
  );
}

/**
 * Basic HTML sanitization
 * In production, use a proper library like DOMPurify
 */
function sanitizeHtml(html: string, allowScripts?: boolean): string {
  if (allowScripts) {
    // Warning: This is potentially dangerous
    // Only use when you trust the content source
    return html;
  }

  // Remove script tags and event handlers
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript:/gi, '');

  // Remove potentially dangerous tags
  const dangerousTags = ['iframe', 'object', 'embed', 'form', 'input', 'button'];
  dangerousTags.forEach((tag) => {
    const regex = new RegExp(`<${tag}\\b[^>]*>.*?</${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    // Also handle self-closing
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*/>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
  });

  return sanitized;
}

export default CustomHtmlBlock;

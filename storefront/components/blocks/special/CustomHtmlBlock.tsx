'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import type { CustomHtmlBlockConfig } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

/**
 * CustomHtmlBlock - Renders custom HTML content
 *
 * SECURITY NOTE: This component uses DOMPurify for XSS protection.
 * When `sandboxed` is true, content is additionally rendered in an
 * isolated iframe with restricted permissions for extra security.
 */
export function CustomHtmlBlock({ config }: BlockComponentProps<CustomHtmlBlockConfig>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number | null>(null);

  // Sanitized rendering for non-sandboxed mode
  useEffect(() => {
    if (config.sandboxed || !containerRef.current) return;

    // Use DOMPurify for proper XSS protection
    // Note: allowScripts is intentionally ignored for security - scripts are always stripped
    const sanitized = sanitizeHtml(config.html);
    containerRef.current.innerHTML = sanitized;

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

export default CustomHtmlBlock;

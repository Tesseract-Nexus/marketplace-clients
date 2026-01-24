'use client';

import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';

interface CustomHtmlSectionProps {
  title?: string;
  htmlContent?: string;
  className?: string;
  fullWidth?: boolean;
}

export function CustomHtmlSection({
  title,
  htmlContent,
  className,
  fullWidth = false,
}: CustomHtmlSectionProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState('');

  // Sanitize HTML on client side only (DOMPurify requires DOM)
  useEffect(() => {
    if (htmlContent && typeof window !== 'undefined') {
      const clean = DOMPurify.sanitize(htmlContent, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target'],
        ALLOW_DATA_ATTR: true,
      });
      setSanitizedHtml(clean);
    }
  }, [htmlContent]);

  if (!htmlContent) {
    return null;
  }

  return (
    <section
      className={cn(
        'py-8 md:py-12',
        !fullWidth && 'container-tenant',
        className
      )}
    >
      {title && (
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
          {title}
        </h2>
      )}
      <div
        className="custom-html-content prose prose-sm md:prose-base max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </section>
  );
}

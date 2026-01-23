'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to monitoring service (e.g., Sentry, LogRocket)
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa',
          padding: '1.5rem',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          <div style={{
            maxWidth: '32rem',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e5e7eb',
            padding: '2.5rem',
            textAlign: 'center',
          }}>
            {/* Icon */}
            <div style={{
              width: '5rem',
              height: '5rem',
              backgroundColor: '#fef2f2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '0.75rem',
              margin: '0 0 0.75rem 0',
            }}>
              Critical Error
            </h1>

            <p style={{
              color: '#6b7280',
              marginBottom: '0.5rem',
              lineHeight: '1.6',
              margin: '0 0 0.5rem 0',
            }}>
              A critical error occurred that prevented the page from loading.
            </p>

            {error.digest && (
              <p style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                marginBottom: '1.5rem',
                margin: '0 0 1.5rem 0',
              }}>
                Error ID: {error.digest}
              </p>
            )}

            {/* Suggestions */}
            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'left',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                  What you can try
                </span>
              </div>
              <ul style={{
                margin: 0,
                paddingLeft: '1.25rem',
                fontSize: '0.8rem',
                color: '#6b7280',
                lineHeight: '2',
              }}>
                <li>Refresh the page</li>
                <li>Clear your browser cache and cookies</li>
                <li>Try again in a few moments</li>
                <li>Check your internet connection</li>
              </ul>
            </div>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && error.message && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'left',
              }}>
                <p style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#991b1b',
                  marginBottom: '0.5rem',
                  margin: '0 0 0.5rem 0',
                }}>
                  Developer Info
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  color: '#b91c1c',
                  wordBreak: 'break-all',
                  margin: 0,
                }}>
                  {error.message}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  transition: 'background-color 0.15s',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Try Again
              </button>

              <button
                onClick={() => window.location.href = '/'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  transition: 'background-color 0.15s',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Go to Dashboard
              </button>
            </div>

            <p style={{
              marginTop: '1.5rem',
              fontSize: '0.75rem',
              color: '#9ca3af',
            }}>
              If this problem persists, please contact{' '}
              <a
                href="mailto:support@tesserix.app"
                style={{ color: '#6366f1', textDecoration: 'none' }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                support
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

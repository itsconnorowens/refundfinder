'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#0f172a',
          color: '#f8fafc',
        }}>
          <AlertCircle size={64} color="#ef4444" />
          <h1 style={{
            fontSize: '2rem',
            marginTop: '1rem',
            fontWeight: 'bold',
          }}>
            Something went wrong
          </h1>
          <p style={{
            color: '#94a3b8',
            marginTop: '0.5rem',
            textAlign: 'center',
            maxWidth: '500px',
          }}>
            We've been notified and are looking into it. Please try again or contact support if the problem persists.
          </p>
          {error.digest && (
            <p style={{
              color: '#64748b',
              fontSize: '0.875rem',
              marginTop: '1rem',
              fontFamily: 'monospace',
            }}>
              Error ID: {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#00D9B5',
                color: '#0f172a',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: '#00D9B5',
                border: '1px solid #00D9B5',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

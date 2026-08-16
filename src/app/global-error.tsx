'use client';

import { colors } from '@/styles/colors';
import { fonts } from '@/styles/typography';

// Layout-level error boundary: replaces the root layout on a layout throw, so
// it must render its own <html>/<body> and style inline (the layout's CSS may
// not be present) (IR-B1).
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang='en'>
      <body
        style={{
          margin: 0,
          minHeight: '100svh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.saturn.lightest,
          color: colors.black,
          fontFamily: fonts.alien,
          textAlign: 'center',
        }}
      >
        <div style={{ padding: '1.5rem' }}>
          <h1
            style={{
              fontWeight: 300,
              fontSize: '2.25rem',
              margin: '0 0 1rem',
            }}
          >
            Something Broke
          </h1>
          <p style={{ opacity: 0.55, margin: '0 0 2rem' }}>
            An unexpected error interrupted the mission.
          </p>
          <button
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.75rem 1.5rem',
              minHeight: 44,
              backgroundColor: colors.black,
              color: colors.saturn.lightest,
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              letterSpacing: '0.025em',
              border: 'none',
              borderRadius: 9999,
              cursor: 'pointer',
            }}
          >
            TRY AGAIN
          </button>
        </div>
      </body>
    </html>
  );
}

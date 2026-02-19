import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Raitis Kraslovskis — Full-Stack Developer Portfolio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #f5f1e8 0%, #e8e4db 30%, #d4cfc4 70%, #c0bab0 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            border: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            border: '1px solid rgba(0,0,0,0.04)',
            display: 'flex',
          }}
        />

        {/* Name */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 200,
            color: '#1a1a1a',
            letterSpacing: '-2px',
            lineHeight: 1.1,
            display: 'flex',
          }}
        >
          Raitis Kraslovskis
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '28px',
            fontWeight: 400,
            color: '#6b7280',
            marginTop: '20px',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            display: 'flex',
          }}
        >
          Full-Stack Developer
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '18px',
            fontWeight: 300,
            color: '#9ca3af',
            marginTop: '24px',
            maxWidth: '600px',
            textAlign: 'center',
            display: 'flex',
          }}
        >
          Modern web apps · Interactive experiences · Creative technology
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '16px',
            fontWeight: 400,
            color: '#9ca3af',
            letterSpacing: '2px',
            display: 'flex',
          }}
        >
          raitiskraslovskis.com
        </div>
      </div>
    ),
    { ...size }
  );
}

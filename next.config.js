// Content Security Policy. 'unsafe-eval' is required only by Next.js dev-mode
// tooling (react-refresh evaluates modules); production bundles never eval, so
// it is emitted dev-only. 'unsafe-inline' stays for script-src/style-src: Next
// injects inline bootstrap scripts that would need nonce plumbing to drop it.
const isProd = process.env.NODE_ENV === 'production';
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Railway deployment (Node.js server)
  output: 'standalone',

  // No next/image usage anywhere — disable the optimizer so the standalone
  // server does not expose the /_next/image endpoint (and its sharp/libvips
  // dependency chain) for nothing.
  images: {
    unoptimized: true,
  },

  // Security headers for production
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          // Content Security Policy (built above; 'unsafe-eval' dev-only)
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Prevent embedding in frames
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
        ],
      },
      {
        // Immutable caching for self-hosted fonts (content-stable; rename on change)
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for deployment to static hosting
  output: 'export',
  trailingSlash: true,

  // Image optimization disabled for static export
  images: {
    unoptimized: true,
  },

  // Enhanced TypeScript configuration
  typescript: {
    // Type-check during build
    ignoreBuildErrors: false,
  },

  // Enhanced ESLint configuration
  eslint: {
    // Lint during build
    ignoreDuringBuilds: false,
  },

  // Security headers for production (Note: These won't work with static export)
  // For static hosting, these should be configured at the hosting provider level
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          // Apply security headers to all routes in development
          source: '/(.*)',
          headers: [
            // Strict Content Security Policy
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // TODO: Remove unsafe-* in production
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob:",
                "font-src 'self' data:",
                "connect-src 'self'",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                'upgrade-insecure-requests',
              ].join('; '),
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
            // XSS Protection
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
            // Referrer Policy
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
            // Permissions Policy (Feature Policy)
            {
              key: 'Permissions-Policy',
              value: [
                'camera=()',
                'microphone=()',
                'geolocation=()',
                'payment=()',
                'usb=()',
                'magnetometer=()',
                'accelerometer=()',
                'gyroscope=()',
              ].join(', '),
            },
            // Strict Transport Security (HTTPS only)
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains; preload',
            },
            // Cross-Origin Embedder Policy
            {
              key: 'Cross-Origin-Embedder-Policy',
              value: 'require-corp',
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
          ],
        },
      ];
    }
    return [];
  },

  // Webpack configuration for additional security
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Production client-side optimizations
      config.optimization = {
        ...config.optimization,
        sideEffects: false,
      };
    }

    return config;
  },

  // Environment variables validation
  env: {
    // Ensure critical environment variables are set
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV || 'development',
  },
};

module.exports = nextConfig;

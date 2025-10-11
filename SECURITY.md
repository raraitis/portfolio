# Security Configuration for Static Hosting

Since this portfolio uses Next.js static export (`output: 'export'`), security headers defined in `next.config.js` won't be applied automatically. These must be configured at the hosting provider level.

## Required Security Headers

### Content Security Policy (CSP)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests
```

### Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

### Permissions Policy
```
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()
```

## Platform-Specific Configuration

### Vercel
Create `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### Netlify
Create `_headers` file in `public/`:
```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
```

### GitHub Pages
Unfortunately, GitHub Pages doesn't support custom headers. Consider moving to Vercel or Netlify for better security.

### Cloudflare Pages
Configure in Cloudflare dashboard under Page Rules or Workers.

## Security Checklist

- [ ] Configure security headers at hosting provider
- [ ] Enable HTTPS/SSL certificate
- [ ] Set up proper CSP without `unsafe-inline` in production
- [ ] Regular dependency updates (`npm audit`)
- [ ] Monitor for security vulnerabilities
- [ ] Implement proper error handling
- [ ] Validate all user inputs
- [ ] Use secure random number generation
- [ ] Implement rate limiting for API endpoints (if any)

## Notes

1. The current CSP includes `unsafe-inline` for development. This should be removed in production by:
   - Using nonces for inline scripts
   - Moving inline styles to CSS files
   - Using styled-components with proper CSP configuration

2. For maximum security, consider implementing:
   - Subresource Integrity (SRI) for external resources
   - Content Security Policy reporting
   - Security monitoring and alerting
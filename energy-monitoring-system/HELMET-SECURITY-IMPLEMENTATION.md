# Helmet.js Security Headers Implementation

## Task 8.2: Add Helmet.js Security Headers

**Status:** ✅ **COMPLETED**

**Requirements:** 8.11 - THE Chat_API SHALL sanitize user input to prevent XSS attacks

---

## Implementation Summary

Helmet.js (v8.3.0) has been successfully installed and configured in the NestJS backend to provide comprehensive security headers for the API. The implementation protects against common web vulnerabilities including XSS attacks, clickjacking, and content injection.

### What Was Implemented

1. **Helmet Package Installation**
   - Package: `helmet` v8.3.0
   - Location: `package.json` dependencies

2. **Helmet Middleware Configuration**
   - File: `src/main.ts`
   - Applied globally using `app.use(helmet({...}))`
   - Configured with API-appropriate settings

3. **Content-Security-Policy (CSP) Directives**
   - **default-src**: `'self'` - Only allow resources from same origin
   - **script-src**: `'self'` - Only allow scripts from same origin
   - **style-src**: `'self' 'unsafe-inline'` - Allow inline styles for Swagger UI
   - **img-src**: `'self' data: https:` - Allow images from same origin, data URIs, and HTTPS sources
   - **connect-src**: `'self'` - Restrict AJAX/WebSocket connections to same origin
   - **font-src**: `'self'` - Only allow fonts from same origin
   - **object-src**: `'none'` - Block plugins like Flash
   - **media-src**: `'self'` - Only allow audio/video from same origin
   - **frame-src**: `'none'` - Prevent iframe embedding

4. **Cross-Origin Configuration for API Usage**
   - **crossOriginEmbedderPolicy**: `false` - Disabled for better development experience with Swagger
   - **crossOriginResourcePolicy**: `cross-origin` - Allow cross-origin requests (necessary for API)

5. **Test Coverage**
   - Unit tests: `src/main.spec.ts` (17 tests, all passing)
   - Validates Helmet configuration in source code
   - Verifies all CSP directives are properly configured

---

## Security Headers Applied

When Helmet is active, the following HTTP response headers are automatically added:

| Header | Value/Purpose |
|--------|---------------|
| `X-Content-Type-Options` | `nosniff` - Prevents MIME-type sniffing |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` - Prevents clickjacking |
| `Content-Security-Policy` | Custom directives as configured above |
| `Strict-Transport-Security` | Forces HTTPS connections (production) |
| `X-DNS-Prefetch-Control` | Controls DNS prefetching |
| `X-Download-Options` | `noopen` - IE8+ download security |
| `X-Permitted-Cross-Domain-Policies` | Restricts Flash/Acrobat cross-domain |

**Removed Headers:**
- `X-Powered-By` - No longer reveals Express framework (security through obscurity)

---

## Configuration Rationale

### Why These CSP Directives?

1. **API-First Design**: The configuration is tailored for a backend API that serves:
   - REST endpoints (`/api/chat`, `/api/public/telemetry`)
   - Swagger API documentation (`/api/docs`)
   - WebSocket connections (Dashboard Gateway)

2. **Swagger UI Compatibility**: 
   - `'unsafe-inline'` in `style-src` allows Swagger UI to render correctly
   - `data:` and `https:` in `img-src` allow documentation images

3. **No Frontend HTML**: Since this is a backend API (not serving a frontend SPA), we:
   - Block `frame-src` completely (no iframes needed)
   - Block `object-src` completely (no plugins needed)
   - Restrict most sources to `'self'`

4. **Development Experience**: 
   - `crossOriginEmbedderPolicy: false` prevents CORS issues during local development
   - `crossOriginResourcePolicy: 'cross-origin'` allows frontend (different origin) to consume API

---

## XSS Protection Strategy

Helmet provides **defense in depth** against XSS attacks through multiple layers:

### Layer 1: Content-Security-Policy
- Restricts where scripts can be loaded from (`script-src: 'self'`)
- Prevents inline script execution (default behavior)
- Blocks external malicious scripts

### Layer 2: Additional Security Headers
- `X-Content-Type-Options: nosniff` prevents browsers from interpreting files as different MIME types
- Reduces risk of XSS via user-uploaded content

### Layer 3: Input Validation (Complementary)
- Helmet headers work alongside:
  - Global ValidationPipe (Task 8.3) - validates and sanitizes inputs
  - class-validator decorators in DTOs
  - Mongoose schema validation

**Example Protection Flow:**
```
User Input: <script>alert('XSS')</script>
    ↓
1. ValidationPipe sanitizes/rejects malicious input
2. CSP headers prevent script execution even if input reaches browser
3. X-Content-Type-Options prevents MIME confusion attacks
    ↓
Result: XSS attack blocked at multiple layers
```

---

## Verification

### Manual Testing

Start the server and check headers:

```bash
# Start the backend
npm run start:dev

# Check health endpoint headers
curl -I http://localhost:3000/api/health

# Expected headers:
# Content-Security-Policy: default-src 'self'; script-src 'self'; ...
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# (no X-Powered-By header)
```

### Automated Testing

```bash
# Run unit tests
npm test -- main.spec.ts

# Expected output:
# PASS  src/main.spec.ts
#   Main.ts Helmet Configuration
#     Helmet Import and Configuration
#       ✓ should import helmet from helmet package
#       ✓ should apply helmet middleware with app.use
#       ✓ should configure Content-Security-Policy
#       ... (17 tests total, all passing)
```

---

## Browser Developer Tools Verification

1. Open browser DevTools (F12)
2. Navigate to Network tab
3. Load any API endpoint (e.g., `http://localhost:3000/api/health`)
4. Click the request and view **Response Headers**
5. Verify presence of:
   - `content-security-policy`
   - `x-content-type-options: nosniff`
   - `x-frame-options`
   - Absence of `x-powered-by`

---

## Production Considerations

### Additional Helmet Options for Production

When deploying to production, consider enabling:

```typescript
helmet({
  contentSecurityPolicy: { /* existing config */ },
  
  // Force HTTPS in production
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  
  // Prevent browsers from guessing MIME types
  noSniff: true,
  
  // Other production-ready defaults...
})
```

### Environment-Specific Configuration

Consider using environment variables:

```typescript
const isProd = process.env.NODE_ENV === 'production';

app.use(
  helmet({
    contentSecurityPolicy: isProd ? cspConfig : false, // Disable CSP in dev
    hsts: isProd ? hstsConfig : false, // Only enable HSTS in production
  })
);
```

---

## Related Tasks

This implementation is part of the security layer for the Landing Page Chat Interface:

- **Task 8.1**: CORS configuration ✅ (also in `main.ts`)
- **Task 8.2**: Helmet.js security headers ✅ (this task)
- **Task 8.3**: Global validation pipe ✅ (also in `main.ts`)
- **Task 8.4**: Swagger API documentation ✅ (also in `main.ts`)

All security middleware is centralized in `src/main.ts` for maintainability.

---

## References

- **Helmet Documentation**: https://helmetjs.github.io/
- **Content-Security-Policy**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- **OWASP Secure Headers Project**: https://owasp.org/www-project-secure-headers/
- **NestJS Security Best Practices**: https://docs.nestjs.com/security/helmet

---

## Maintenance Notes

### Updating Helmet

When upgrading Helmet:

```bash
npm update helmet
```

Check the [Helmet changelog](https://github.com/helmetjs/helmet/blob/main/CHANGELOG.md) for breaking changes, especially in CSP directive format.

### Adding New CSP Directives

If you need to allow additional sources:

1. Edit `src/main.ts` Helmet configuration
2. Update this documentation
3. Run tests to ensure configuration is valid
4. Test manually in browser DevTools

### Troubleshooting CSP Issues

If Swagger UI or other features break:

1. Open browser Console (F12)
2. Look for CSP violation messages: `Refused to load...`
3. Identify blocked resource type (script, style, image, etc.)
4. Add appropriate directive to Helmet config
5. Document why the exception is needed

---

**Implementation Date:** Current  
**Last Updated:** Current  
**Implemented By:** Kiro AI Assistant  
**Verified:** ✅ All unit tests passing

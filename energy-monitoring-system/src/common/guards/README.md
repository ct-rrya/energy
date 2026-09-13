# RateLimitGuard

IP-based rate limiting guard for protecting public APIs from abuse.

## Overview

The `RateLimitGuard` extends `@nestjs/throttler`'s `ThrottlerGuard` to provide:
- IP-based rate limiting (supports X-Forwarded-For header for proxied requests)
- Configurable limits per endpoint
- HTTP 429 responses with Retry-After headers
- User-friendly error messages

## Configuration

Rate limits are configured in `app.module.ts`:

```typescript
ThrottlerModule.forRoot([
  {
    name: 'chat',
    ttl: 60000,  // 1 minute in milliseconds
    limit: 10,   // 10 requests per minute
  },
  {
    name: 'telemetry',
    ttl: 60000,  // 1 minute in milliseconds
    limit: 120,  // 120 requests per minute (every 0.5s)
  }
])
```

The guard is applied globally via `APP_GUARD` in `app.module.ts`:

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },
]
```

## Usage

### Controller-Level

Apply to specific controllers:

```typescript
import { UseGuards } from '@nestjs/common';
import { RateLimitGuard } from '@/common/guards';

@Controller('chat')
@UseGuards(RateLimitGuard)
export class ChatController {
  // All routes in this controller are rate-limited
}
```

### Route-Level

Apply to specific routes:

```typescript
@Post()
@UseGuards(RateLimitGuard)
@Throttle({ chat: { limit: 10, ttl: 60000 } })
async sendMessage(@Body() dto: SendMessageDto) {
  // This route has custom rate limit: 10 requests per minute
}
```

### Skip Rate Limiting

Skip rate limiting for specific routes:

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@Get('health')
@SkipThrottle()
healthCheck() {
  // This route is NOT rate-limited
  return { status: 'ok' };
}
```

## IP Extraction

The guard automatically extracts the client IP address:

1. **X-Forwarded-For header**: If present (behind proxy), uses the first IP in the comma-separated list
2. **request.ip**: Direct connection IP
3. **socket.remoteAddress**: Fallback for missing request.ip
4. **'unknown'**: Last resort if no IP available

Example X-Forwarded-For values:
- `"203.0.113.1, 198.51.100.1"` → extracts `"203.0.113.1"`
- `["203.0.113.1", "198.51.100.1"]` → extracts `"203.0.113.1"`

## Error Response

When rate limit is exceeded, the guard returns HTTP 429 with:

```json
{
  "statusCode": 429,
  "message": "Too many requests. Please try again later.",
  "error": "Too Many Requests",
  "retryAfter": 60
}
```

Headers:
```
Retry-After: 60
```

## Testing

Unit tests are located in `rate-limit.guard.spec.ts`.

To run tests:
```bash
npm test -- rate-limit.guard.spec.ts
```

Tests cover:
- IP extraction from various sources
- X-Forwarded-For header handling
- 429 error response formatting
- Retry-After header generation
- IPv4 and IPv6 addresses

## Requirements

This implementation satisfies:
- **Requirement 8.4**: IP-based rate limiting
- **Requirement 13.5**: 10 requests per minute per IP for chat
- **Requirement 13.6**: HTTP 429 with Retry-After header

## Environment Variables

Rate limit configuration can be customized via environment variables:

```env
CHAT_RATE_LIMIT_TTL=60        # TTL in seconds
CHAT_RATE_LIMIT_MAX=10        # Max requests per TTL

PUBLIC_API_RATE_LIMIT_TTL=60  # TTL in seconds
PUBLIC_API_RATE_LIMIT_MAX=120 # Max requests per TTL
```

## Notes

- Rate limits are tracked **per IP address**
- Different endpoints can have different limits (configured via named throttlers)
- In-memory storage is used by default (suitable for single-instance deployments)
- For distributed deployments, consider using Redis storage (via `@nestjs/throttler-storage-redis`)
- The guard respects `@SkipThrottle()` and `@Throttle()` decorators from `@nestjs/throttler`

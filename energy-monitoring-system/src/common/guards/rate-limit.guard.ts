import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * Rate Limiting Guard
 *
 * Protects public APIs from abuse by limiting requests per IP address.
 *
 * Configuration:
 * - chat: 10 requests per minute
 * - telemetry: 120 requests per minute (every 0.5s)
 *
 * Features:
 * - IP-based rate limiting
 * - Extracts real IP from X-Forwarded-For header (if behind proxy)
 * - Returns 429 status with Retry-After header when exceeded
 *
 * Requirements:
 * - 8.4: THE Chat_API SHALL implement rate limiting per IP address
 * - 13.5: THE Chat_API SHALL implement rate limiting of 10 requests per minute per IP
 * - 13.6: WHEN rate limit is exceeded, THE Chat_API SHALL return HTTP 429 with retry-after header
 */
@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  /**
   * Extract the real client IP address safely (resistant to X-Forwarded-For spoofing).
   * Prefers Cloudflare's cf-connecting-ip when present, otherwise Express's req.ip
   * (resolved using `trust proxy` configured in main.ts).
   */
  protected getTracker(req: Request): Promise<string> {
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp) {
      const ip = Array.isArray(cfIp) ? cfIp[0] : cfIp;
      if (ip && ip.trim()) {
        return Promise.resolve(ip.trim());
      }
    }

    // Rely on Express req.ip (respects `trust proxy`) instead of untrusted leftmost X-Forwarded-For
    return Promise.resolve(req.ip || req.socket?.remoteAddress || 'unknown');
  }

  /**
   * Handle throttle exception with proper HTTP 429 response
   * Includes Retry-After header to inform client when to retry
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
  ): Promise<void> {
    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();

    // Determine the rate limit configuration based on the route
    const routePath = request.route?.path || request.path;
    let ttl = 60; // Default TTL in seconds

    // Set TTL based on endpoint (matches ThrottlerModule configuration)
    if (routePath.includes('/chat')) {
      ttl = 60; // chat endpoint: 60 seconds
    } else if (routePath.includes('/telemetry')) {
      ttl = 60; // telemetry endpoint: 60 seconds
    }

    // Set Retry-After header (in seconds)
    response.header('Retry-After', String(ttl));

    // Throw HTTP 429 with user-friendly message
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests. Please try again later.',
        error: 'Too Many Requests',
        retryAfter: ttl,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

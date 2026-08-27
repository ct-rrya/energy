import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * API Key Guard
 * 
 * Custom authentication guard for ESP32 devices.
 * Extracts and validates API key from request headers.
 * 
 * Purpose:
 * - Extract API key from X-API-Key header
 * - Validate API key format (basic check)
 * - Attach API key to request object for controller/service
 * - Block requests without valid API key header
 * 
 * Why not JWT Guard?
 * - ESP32 has limited processing power
 * - JWT parsing is complex and slow on ESP32
 * - Simple API key is faster and more efficient
 * - ESP32 can store key in flash memory easily
 * 
 * Authentication Flow:
 * 1. Guard extracts X-API-Key header
 * 2. Guard validates header exists and has correct format
 * 3. Guard attaches API key to request object
 * 4. Controller/Service validates API key against database
 * 5. If valid, request proceeds; if invalid, 401 Unauthorized
 * 
 * Why split validation?
 * - Guard: Format validation (fast, no database)
 * - Service: Database validation (slower, but necessary)
 * - Separation of concerns
 * - Guard can be reused for other IoT endpoints
 * 
 * Usage:
 * ```typescript
 * @UseGuards(ApiKeyGuard)
 * @Post('readings')
 * async receiveReading(...) { ... }
 * ```
 * 
 * ESP32 Header:
 * ```cpp
 * http.addHeader("X-API-Key", "esp32_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6");
 * ```
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  /**
   * Can Activate
   * 
   * Determines if the request can proceed based on API key presence.
   * 
   * @param context - Execution context with request details
   * @returns true if API key exists and has valid format, throws otherwise
   * @throws UnauthorizedException if API key is missing or invalid format
   * 
   * Process:
   * 1. Extract request from context
   * 2. Get X-API-Key header (case-insensitive)
   * 3. Validate header exists
   * 4. Validate basic format (starts with "esp32_")
   * 5. Attach to request for later use
   * 6. Return true to allow request
   * 
   * Note:
   * - This does NOT validate against database
   * - Database validation happens in service layer
   * - This only checks format to fail fast
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract API key from header (case-insensitive)
    // HTTP headers are case-insensitive, so x-api-key = X-API-Key = X-Api-Key
    const apiKey =
      request.headers['x-api-key'] || request.headers['X-API-Key'];

    // Check if API key header exists
    if (!apiKey) {
      throw new UnauthorizedException('API key is required in X-API-Key header');
    }

    // Convert to string (headers can be string | string[])
    const apiKeyStr = Array.isArray(apiKey) ? apiKey[0] : apiKey;

    // Validate basic format (should start with "esp32_")
    // This is a quick format check before database lookup
    if (!apiKeyStr.startsWith('esp32_')) {
      throw new UnauthorizedException('Invalid API key format');
    }

    // Validate length (esp32_ + 32 hex chars = 38 total)
    if (apiKeyStr.length !== 38) {
      throw new UnauthorizedException('Invalid API key format');
    }

    // Attach API key to request object for controller/service to use
    // This avoids re-extracting the header in controller
    (request as any).apiKey = apiKeyStr;

    // Allow request to proceed
    // Database validation will happen in service layer
    return true;
  }
}

/**
 * Custom Request Interface (TypeScript Type Safety)
 * 
 * Extend Express Request to include apiKey property.
 * This provides type safety when accessing request.apiKey in controller.
 * 
 * Usage in Controller:
 * ```typescript
 * async receiveReading(@Req() request: RequestWithApiKey) {
 *   const apiKey = request.apiKey; // TypeScript knows this exists
 * }
 * ```
 * 
 * Alternative: Use custom decorator instead
 * ```typescript
 * @ApiKey() apiKey: string
 * ```
 */
export interface RequestWithApiKey extends Request {
  apiKey: string;
}

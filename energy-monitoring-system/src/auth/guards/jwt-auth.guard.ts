import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 *
 * Protects routes by requiring valid JWT authentication.
 *
 * How it works:
 * 1. Intercepts incoming request
 * 2. Checks for Authorization header
 * 3. Extracts JWT token
 * 4. Uses JwtStrategy to validate token
 * 5. If valid: attaches user to request and allows access
 * 6. If invalid: throws UnauthorizedException (401)
 *
 * Usage:
 *
 * // Protect single route
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@Req() req) {
 *   return req.user; // User from JWT token
 * }
 *
 * // Protect entire controller
 * @UseGuards(JwtAuthGuard)
 * @Controller('users')
 * export class UsersController {
 *   // All routes in this controller are protected
 * }
 *
 * What happens when protected route is accessed:
 *
 * ✅ Valid token:
 *   - Token is verified
 *   - User is loaded from database
 *   - User attached to request.user
 *   - Route handler executes
 *
 * ❌ No token:
 *   - 401 Unauthorized
 *   - Message: "Unauthorized"
 *
 * ❌ Invalid token:
 *   - 401 Unauthorized
 *   - Message: "Unauthorized"
 *
 * ❌ Expired token:
 *   - 401 Unauthorized
 *   - Message: "Unauthorized"
 *
 * ❌ User not found / inactive:
 *   - 401 Unauthorized
 *   - Message: "User not found" or "Account is inactive"
 *
 * Security:
 * - Validates token signature (prevents tampering)
 * - Checks expiration (prevents replay)
 * - Verifies user exists and is active
 * - Generic error messages (no information leakage)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // AuthGuard('jwt') tells Passport to use the JWT strategy
  // No custom logic needed - default behavior is perfect
}

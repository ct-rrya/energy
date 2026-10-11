import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT Authentication Guard
 *
 * Protects routes by requiring valid JWT authentication.
 * Routes marked with @Public() decorator skip authentication.
 *
 * How it works:
 * 1. Checks if route is marked with @Public() decorator
 * 2. If public: allows access without authentication
 * 3. If protected: intercepts incoming request
 * 4. Checks for Authorization header
 * 5. Extracts JWT token
 * 6. Uses JwtStrategy to validate token
 * 7. If valid: attaches user to request and allows access
 * 8. If invalid: throws UnauthorizedException (401)
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
 * // Make specific route public
 * @UseGuards(JwtAuthGuard)
 * @Controller('energy')
 * export class EnergyController {
 *   @Public() // This route is public
 *   @Get('recent')
 *   getRecentReadings() {
 *     // Accessible without authentication
 *   }
 *
 *   @Get('admin-only')
 *   adminData() {
 *     // Requires authentication
 *   }
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
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Override canActivate to check for @Public() decorator
   */
  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If public, allow access without authentication
    if (isPublic) {
      return true;
    }

    // Otherwise, use default JWT authentication
    return super.canActivate(context);
  }
}

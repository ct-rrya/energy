import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

/**
 * JWT Payload Interface
 * Defines the structure of data inside the JWT token
 */
interface JwtPayload {
  sub: string; // Subject (user ID)
  email: string;
  role: string;
  iat?: number; // Issued at
  exp?: number; // Expires at
}

/**
 * JWT Strategy
 * 
 * Passport strategy for validating JWT tokens.
 * 
 * Flow:
 * 1. Extract token from Authorization header
 * 2. Verify token signature using secret
 * 3. Check token expiration
 * 4. Call validate() method with decoded payload
 * 5. Attach returned user to request.user
 * 
 * Configuration:
 * - jwtFromRequest: Extract token from "Authorization: Bearer <token>" header
 * - ignoreExpiration: false (reject expired tokens)
 * - secretOrKey: JWT secret from environment
 * 
 * Usage:
 * This strategy is automatically used when @UseGuards(JwtAuthGuard) is applied
 * 
 * Security:
 * - Validates token signature (prevents tampering)
 * - Checks expiration (prevents replay attacks)
 * - Verifies user still exists and is active
 * - Database is source of truth (not just token)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      // Extract JWT token from Authorization header
      // Format: Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Reject expired tokens (don't ignore expiration)
      ignoreExpiration: false,

      // Secret key to verify token signature
      secretOrKey: configService.get<string>('jwt.secret') || 'default-secret',
    });
  }

  /**
   * Validate JWT payload
   * 
   * This method is called AFTER token signature and expiration are verified.
   * 
   * @param payload - Decoded JWT payload { sub, email, role }
   * @returns User object (attached to request.user)
   * @throws UnauthorizedException if user not found or inactive
   * 
   * Process:
   * 1. Extract user ID from payload.sub
   * 2. Query database for user
   * 3. Verify user exists
   * 4. Verify user is active
   * 5. Return user object
   * 
   * Why query database?
   * - User might be deleted after token was issued
   * - User might be deactivated
   * - Database is source of truth, not token
   * 
   * Returned object becomes request.user in route handlers:
   * @Get('profile')
   * getProfile(@Req() req) {
   *   const user = req.user; // This is what we return here
   * }
   */
  async validate(payload: JwtPayload) {
    const { sub: userId } = payload;

    // Find user by ID from token payload
    const user = await this.usersService.findById(userId);

    // User not found (might be deleted)
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // User account is inactive (suspended)
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Return user object (will be attached to request.user)
    // Password is already excluded by schema
    return user;
  }
}

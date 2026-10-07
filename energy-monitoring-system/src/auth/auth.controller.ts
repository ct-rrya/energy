import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, AuthResponseDto, AccessCodeLoginDto } from './dto';
import { AuditService } from '../audit/audit.service';

/**
 * Authentication Controller
 *
 * Handles authentication-related HTTP endpoints.
 *
 * Endpoints:
 * - POST /api/auth/login - User login
 *
 * Security:
 * - Login endpoint is public (no authentication required)
 * - Returns JWT token for subsequent requests
 * - Validates credentials before issuing token
 *
 * Error Handling:
 * - 400: Validation errors (invalid email format, missing fields)
 * - 401: Invalid credentials (wrong email/password, inactive account)
 *
 * Validation:
 * - Automatic via LoginDto and ValidationPipe
 * - Email format checked
 * - Password minimum length enforced
 * - Clear error messages for invalid input
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * User Login
   *
   * Authenticates user credentials and returns JWT access token.
   *
   * @param loginDto - Login credentials (email, password)
   * @returns JWT token and user information
   * @throws UnauthorizedException if credentials are invalid
   *
   * Process:
   * 1. Validate request body (automatic via LoginDto)
   * 2. Verify credentials (AuthService)
   * 3. Generate JWT token (AuthService)
   * 4. Update last login timestamp
   * 5. Return token + user data
   *
   * Frontend Usage:
   * 1. Send POST request with email and password
   * 2. Store returned token (localStorage or sessionStorage)
   * 3. Include token in Authorization header for protected routes:
   *    Authorization: Bearer <token>
   *
   * Security:
   * - Password is validated but never returned
   * - Generic error message (doesn't reveal if email exists)
   * - Account status checked (inactive accounts rejected)
   * - JWT token has expiration
   *
   * Example Request:
   * POST /api/auth/login
   * {
   *   "email": "admin@example.com",
   *   "password": "SecurePass123"
   * }
   *
   * Example Success Response (200):
   * {
   *   "success": true,
   *   "message": "Login successful",
   *   "data": {
   *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *     "user": {
   *       "id": "64f9a1b2c3d4e5f6g7h8i9j0",
   *       "email": "admin@example.com",
   *       "name": "Administrator",
   *       "role": "admin",
   *       "isActive": true
   *     }
   *   }
   * }
   *
   * Example Error Response (401):
   * {
   *   "success": false,
   *   "statusCode": 401,
   *   "message": "Invalid email or password",
   *   "timestamp": "2026-07-17T10:30:00.000Z"
   * }
   *
   * Example Validation Error (400):
   * {
   *   "success": false,
   *   "statusCode": 400,
   *   "message": "Validation failed",
   *   "errors": [
   *     "email must be a valid email address",
   *     "password must be at least 6 characters long"
   *   ],
   *   "timestamp": "2026-07-17T10:30:00.000Z"
   * }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK) // Return 200 OK instead of 201 Created
  @Throttle({ auth: { limit: 10, ttl: 900000 } }) // 10 attempts per 15 minutes
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticates user credentials and returns JWT access token. ' +
      'The token should be included in Authorization header for protected routes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful - returns JWT token and user information',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation error - invalid email format or missing required fields',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        errors: [
          'email must be a valid email address',
          'password must be at least 6 characters long',
        ],
        timestamp: '2026-07-17T10:30:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description:
      'Invalid credentials - wrong email/password or inactive account',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        message: 'Invalid email or password',
        timestamp: '2026-07-17T10:30:00.000Z',
      },
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * Administrator Access Code Login
   *
   * Authenticates administrator with access code and returns JWT token.
   * Used for shared-workstation authentication.
   *
   * @param accessCodeLoginDto - Access code credentials
   * @returns JWT token and administrator information
   * @throws UnauthorizedException if access code is invalid
   *
   * Process:
   * 1. Validate request body (automatic via AccessCodeLoginDto)
   * 2. Verify access code (AuthService)
   * 3. Generate JWT token with session ID (AuthService)
   * 4. Update last login and activity timestamps
   * 5. Log authentication attempt (AuditService)
   * 6. Return token + user data
   *
   * Security:
   * - Access code is 12-character alphanumeric (case-sensitive)
   * - Access code is never logged or returned
   * - Generic error message (doesn't reveal which admin account)
   * - Account status checked (inactive accounts rejected)
   * - JWT token includes session ID for tracking
   * - All login attempts are audited
   *
   * Example Request:
   * POST /api/auth/admin/access-code
   * {
   *   "accessCode": "ABC123DEF456"
   * }
   *
   * Example Success Response (200):
   * {
   *   "success": true,
   *   "message": "Access code verified",
   *   "data": {
   *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *     "user": {
   *       "id": "64f9a1b2c3d4e5f6g7h8i9j0",
   *       "email": "admin@example.com",
   *       "name": "John Doe",
   *       "role": "SYSTEM_ADMIN",
   *       "isActive": true
   *     }
   *   }
   * }
   *
   * Example Error Response (401):
   * {
   *   "success": false,
   *   "statusCode": 401,
   *   "message": "Invalid access code",
   *   "timestamp": "2026-10-01T10:30:00.000Z"
   * }
   */
  @Post('admin/access-code')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 minutes (stricter for access codes)
  @ApiOperation({
    summary: 'Administrator access code login',
    description:
      'Authenticates administrator with personal access code for shared-workstation use. ' +
      'Returns JWT token with session tracking for 10-minute inactivity timeout.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Access code verified - returns JWT token and administrator information',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error - invalid access code format',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        errors: ['Access code must be exactly 12 characters'],
        timestamp: '2026-10-01T10:30:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid access code or inactive account',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        message: 'Invalid access code',
        timestamp: '2026-10-01T10:30:00.000Z',
      },
    },
  })
  async loginWithAccessCode(
    @Body() accessCodeLoginDto: AccessCodeLoginDto,
    @Req() req: any,
  ): Promise<AuthResponseDto> {
    try {
      // Attempt authentication
      const response = await this.authService.loginWithAccessCode(
        accessCodeLoginDto.accessCode,
      );

      // Log successful authentication
      await this.auditService.logSuccess({
        administratorId: response.data.user.id,
        administratorName: response.data.user.name,
        administratorRole: response.data.user.role as any,
        action: 'LOGIN',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: response.data.user.id + '_' + Date.now(), // Session ID from JWT
      });

      return response;
    } catch (error) {
      // Log failed authentication attempt
      // Note: We don't know which admin attempted, so log as system event
      await this.auditService.log({
        administratorId: '000000000000000000000000', // System/unknown
        administratorName: 'Unknown',
        administratorRole: 'SYSTEM_ADMIN',
        action: 'LOGIN',
        result: 'failure',
        failureReason: 'Invalid access code',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      throw error;
    }
  }
}

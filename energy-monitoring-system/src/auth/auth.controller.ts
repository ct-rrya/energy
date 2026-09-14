import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, AuthResponseDto } from './dto';

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
  constructor(private readonly authService: AuthService) {}

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
}

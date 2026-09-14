import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from './schemas/user.schema';
import { UsersService } from './users.service';
import { UserResponseDto, UpdateProfileDto, ChangePasswordDto } from './dto';

/**
 * Users Controller
 *
 * Handles user-related HTTP endpoints.
 *
 * Endpoints:
 * - GET  /api/users/profile         - Get current user's profile
 * - PUT  /api/users/profile         - Update current user's profile
 * - POST /api/users/change-password - Change current user's password
 *
 * Authentication:
 * - All endpoints require JWT authentication
 * - Token must be provided in Authorization header: Bearer <token>
 *
 * Error Handling:
 * - 401: Missing or invalid token
 * - 400: Validation errors
 *
 * Security:
 * - Password is never returned in responses
 * - Users can only access/modify their own profile
 * - Token validation automatic via JwtAuthGuard
 */
@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  /**
   * Get Current User Profile
   *
   * Returns the profile information of the authenticated user.
   *
   * @param user - Current user (injected by JWT guard and CurrentUser decorator)
   * @returns User profile information
   *
   * Process:
   * 1. Extract JWT token from Authorization header (JwtAuthGuard)
   * 2. Validate token signature and expiration (JwtAuthGuard)
   * 3. Query database to verify user exists and is active (JwtStrategy)
   * 4. Inject user into request (JwtStrategy)
   * 5. Extract user from request (CurrentUser decorator)
   * 6. Return user profile
   *
   * Frontend Usage:
   * 1. Include JWT token in Authorization header:
   *    Authorization: Bearer <token from login>
   * 2. Send GET request to /api/users/profile
   * 3. Display user information
   *
   * Security:
   * - Password is excluded from response (schema configuration)
   * - Token must be valid and not expired
   * - User must exist and be active
   * - No user enumeration (returns 401 for any auth failure)
   *
   * Example Request:
   * GET /api/users/profile
   * Headers:
   *   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *
   * Example Success Response (200):
   * {
   *   "success": true,
   *   "data": {
   *     "id": "64f9a1b2c3d4e5f6g7h8i9j0",
   *     "email": "admin@example.com",
   *     "name": "Administrator",
   *     "role": "admin",
   *     "isActive": true,
   *     "lastLoginAt": "2026-07-17T10:30:00.000Z",
   *     "createdAt": "2026-07-01T10:00:00.000Z",
   *     "updatedAt": "2026-07-17T10:30:00.000Z"
   *   }
   * }
   *
   * Example Error Response (401):
   * {
   *   "success": false,
   *   "statusCode": 401,
   *   "message": "Unauthorized",
   *   "timestamp": "2026-07-17T10:30:00.000Z"
   * }
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns the profile information of the authenticated user. ' +
      'Requires valid JWT token in Authorization header.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        message: 'Unauthorized',
        timestamp: '2026-07-17T10:30:00.000Z',
      },
    },
  })
  getProfile(@CurrentUser() user: UserDocument) {
    // Map user document to response DTO
    return {
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: (user as any).createdAt,
        updatedAt: (user as any).updatedAt,
      },
    };
  }

  /**
   * Update Current User Profile
   *
   * Updates the profile information of the authenticated user.
   *
   * @param user - Current user (injected by JWT guard)
   * @param updateProfileDto - Profile data to update
   * @returns Updated user profile
   *
   * Process:
   * 1. Validate request body (automatic via UpdateProfileDto)
   * 2. Update user in database
   * 3. Return updated profile
   *
   * Fields that can be updated:
   * - name: Display name (2-100 characters)
   *
   * Fields that CANNOT be updated:
   * - email: Unique identifier, cannot be changed
   * - password: Use /api/users/change-password instead
   * - role: System-managed, cannot be changed
   *
   * Example Request:
   * PUT /api/users/profile
   * Headers:
   *   Authorization: Bearer <token>
   * Body:
   * {
   *   "name": "New Name"
   * }
   *
   * Example Success Response (200):
   * {
   *   "success": true,
   *   "message": "Profile updated successfully",
   *   "data": {
   *     "id": "64f9a1b2c3d4e5f6g7h8i9j0",
   *     "email": "admin@example.com",
   *     "name": "New Name",
   *     "role": "admin",
   *     "isActive": true,
   *     "lastLoginAt": "2026-07-17T10:30:00.000Z",
   *     "createdAt": "2026-07-01T10:00:00.000Z",
   *     "updatedAt": "2026-07-19T14:30:00.000Z"
   *   }
   * }
   */
  @Put('profile')
  @ApiOperation({
    summary: 'Update current user profile',
    description:
      'Updates the profile information of the authenticated user. ' +
      'Currently only name can be updated.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error - invalid data',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
  })
  async updateProfile(
    @CurrentUser() user: UserDocument,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.usersService.updateProfile(
      user._id.toString(),
      updateProfileDto,
    );

    return {
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        lastLoginAt: updatedUser.lastLoginAt,
        createdAt: (updatedUser as any).createdAt,
        updatedAt: (updatedUser as any).updatedAt,
      },
    };
  }

  /**
   * Change Password
   *
   * Changes the password of the authenticated user.
   *
   * @param user - Current user (injected by JWT guard)
   * @param changePasswordDto - Current and new passwords
   * @returns Success message
   *
   * Process:
   * 1. Validate request body (automatic via ChangePasswordDto)
   * 2. Verify current password is correct
   * 3. Verify new password is different from current
   * 4. Hash and save new password
   *
   * Security Requirements:
   * - Current password must be provided (prevents unauthorized changes)
   * - New password must meet strength requirements:
   *   - Minimum 8 characters
   *   - At least one uppercase letter
   *   - At least one lowercase letter
   *   - At least one number
   *   - At least one special character (@$!%*?&)
   * - New password must be different from current password
   *
   * Example Request:
   * POST /api/users/change-password
   * Headers:
   *   Authorization: Bearer <token>
   * Body:
   * {
   *   "currentPassword": "Admin@2024!",
   *   "newPassword": "NewSecurePass456!"
   * }
   *
   * Example Success Response (200):
   * {
   *   "success": true,
   *   "message": "Password changed successfully"
   * }
   *
   * Example Error Response (401 - Wrong Current Password):
   * {
   *   "success": false,
   *   "statusCode": 401,
   *   "message": "Current password is incorrect",
   *   "timestamp": "2026-07-19T14:30:00.000Z"
   * }
   *
   * Example Error Response (400 - Same Password):
   * {
   *   "success": false,
   *   "statusCode": 400,
   *   "message": "New password must be different from current password",
   *   "timestamp": "2026-07-19T14:30:00.000Z"
   * }
   *
   * Example Error Response (400 - Weak Password):
   * {
   *   "success": false,
   *   "statusCode": 400,
   *   "message": "Validation failed",
   *   "errors": [
   *     "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
   *   ],
   *   "timestamp": "2026-07-19T14:30:00.000Z"
   * }
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change password',
    description:
      'Changes the password of the authenticated user. ' +
      'Requires current password for verification. ' +
      'New password must meet strength requirements.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiBadRequestResponse({
    description: 'Validation error - weak password or same as current password',
  })
  @ApiUnauthorizedResponse({
    description: 'Current password is incorrect',
  })
  async changePassword(
    @CurrentUser() user: UserDocument,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(
      user._id.toString(),
      changePasswordDto,
    );

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }
}

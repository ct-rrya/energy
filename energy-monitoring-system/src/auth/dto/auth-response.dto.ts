import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto';

/**
 * Auth Data DTO
 * 
 * Contains the authentication token and user information.
 * This is nested inside AuthResponseDto.
 */
export class AuthDataDto {
  @ApiProperty({
    description: 'JWT access token for authentication',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NGY5YTFiMmMzZDRlNWY2ZzdoOGk5ajAiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTY4NDM4MjJ9.4Adcj0H_bVeM8e...',
  })
  token: string;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

/**
 * Auth Response DTO
 * 
 * Standard response format for successful login.
 * Follows the API standards defined for the project.
 * 
 * Structure:
 * {
 *   success: true,
 *   message: "Login successful",
 *   data: {
 *     token: "JWT token...",
 *     user: { id, email, name, ... }
 *   }
 * }
 * 
 * Usage:
 * - POST /api/auth/login response
 * - Contains everything frontend needs after login:
 *   1. JWT token (store in localStorage)
 *   2. User information (display in UI)
 * 
 * Security:
 * - Token should be stored securely (not in cookies for CSRF protection)
 * - Token has expiration time (configured in .env)
 * - User object never contains password
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable success message',
    example: 'Login successful',
  })
  message: string;

  @ApiProperty({
    description: 'Authentication data containing token and user info',
    type: AuthDataDto,
  })
  data: AuthDataDto;
}

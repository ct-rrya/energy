import { ApiProperty } from '@nestjs/swagger';

/**
 * User Response DTO
 * 
 * Defines the structure of user data returned in API responses.
 * This DTO ensures that sensitive information (like password) is never exposed.
 * 
 * Used in:
 * - Login response (auth)
 * - Get profile endpoint
 * - Any endpoint that returns user data
 * 
 * Security:
 * - Password field is NEVER included
 * - Only safe, public user information is exposed
 */
export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
  })
  id: string;

  @ApiProperty({
    description: 'User email address (login identifier)',
    example: 'admin@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User display name',
    example: 'System Administrator',
  })
  name: string;

  @ApiProperty({
    description: 'User role in the system',
    example: 'admin',
    enum: ['admin'],
  })
  role: string;

  @ApiProperty({
    description: 'Account status - whether the user can login',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Last successful login timestamp',
    example: '2026-07-17T10:30:00.000Z',
    required: false,
    nullable: true,
  })
  lastLoginAt?: Date;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2026-07-01T08:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last account update timestamp',
    example: '2026-07-17T10:30:00.000Z',
  })
  updatedAt: Date;
}

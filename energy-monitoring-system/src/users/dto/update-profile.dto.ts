import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

/**
 * Update Profile DTO
 *
 * Data Transfer Object for updating user profile information.
 *
 * Validation:
 * - name: Required, 2-100 characters
 *
 * Usage:
 * PUT /api/users/profile
 * {
 *   "name": "John Doe"
 * }
 */
export class UpdateProfileDto {
  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;
}

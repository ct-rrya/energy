import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

/**
 * Change Password DTO
 * 
 * Data Transfer Object for changing user password.
 * 
 * Validation:
 * - currentPassword: Required, minimum 6 characters
 * - newPassword: Required, minimum 8 characters, must contain uppercase, lowercase, number, and special character
 * 
 * Security:
 * - Requires current password verification (prevents unauthorized changes)
 * - New password strength enforced
 * - New password must be different from current password
 * 
 * Usage:
 * POST /api/users/change-password
 * {
 *   "currentPassword": "OldPass123!",
 *   "newPassword": "NewSecurePass456!"
 * }
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password (for verification)',
    example: 'OldPass123!',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({
    description:
      'New password (min 8 chars, must contain uppercase, lowercase, number, and special character)',
    example: 'NewSecurePass456!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;
}

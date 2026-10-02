import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

/**
 * Create Administrator DTO
 *
 * Validates administrator account creation requests.
 * Only SUPER_ADMIN can create new administrator accounts.
 *
 * Security Requirements:
 * - Email must be unique and valid
 * - Name must be professional (2-50 characters)
 * - Role must be SYSTEM_ADMIN or SUPER_ADMIN
 * - Access code is auto-generated (not user-provided)
 *
 * Example:
 * {
 *   "email": "john.doe@codetech.edu",
 *   "name": "John Doe",
 *   "role": "SYSTEM_ADMIN"
 * }
 */
export class CreateAdminDto {
  /**
   * Administrator email address
   * - Must be valid email format
   * - Must be unique (enforced by database)
   * - Used for identification only (not login)
   */
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  /**
   * Administrator full name
   * - 2-50 characters
   * - Used for display in dashboard and audit logs
   * - Should be professional name (e.g., "John Doe", not "jdoe123")
   */
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  @Matches(/^[a-zA-Z\s\-'.]+$/, {
    message:
      'Name must contain only letters, spaces, hyphens, apostrophes, and periods',
  })
  name: string;

  /**
   * Administrator role
   * - SYSTEM_ADMIN: Operational dashboard access
   * - SUPER_ADMIN: Account management only (no operational access)
   * - PUBLIC_USER not allowed (use regular user creation)
   */
  @IsEnum(['SYSTEM_ADMIN', 'SUPER_ADMIN'], {
    message: 'Role must be either SYSTEM_ADMIN or SUPER_ADMIN',
  })
  @IsNotEmpty({ message: 'Role is required' })
  role: 'SYSTEM_ADMIN' | 'SUPER_ADMIN';
}

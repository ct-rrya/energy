import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Login DTO
 *
 * Validates login request data from clients.
 *
 * Validation Rules:
 * - Email must be a valid email format
 * - Email is required (cannot be empty)
 * - Password is required (cannot be empty)
 * - Password must be at least 6 characters
 *
 * Example Valid Request:
 * {
 *   "email": "admin@example.com",
 *   "password": "SecurePass123"
 * }
 *
 * Example Invalid Requests:
 * {
 *   "email": "not-an-email",      // ❌ Invalid email format
 *   "password": "123"              // ❌ Too short (min 6 chars)
 * }
 *
 * Security:
 * - Password validation is minimal (length only)
 * - Actual password verification happens in AuthService
 * - Never log password values
 */
export class LoginDto {
  @ApiProperty({
    description: 'User email address (login identifier)',
    example: 'admin@example.com',
    required: true,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123',
    required: true,
    minLength: 6,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}

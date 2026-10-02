import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

/**
 * Access Code Login DTO
 *
 * Validates administrator access code login requests.
 *
 * Security Requirements:
 * - Access code must be exactly 12 characters
 * - Access code must be alphanumeric (A-Z, a-z, 0-9)
 * - Access code is case-sensitive
 * - No special characters allowed (prevents injection attacks)
 *
 * Example valid access codes:
 * - ABC123DEF456
 * - xY7pQ3mN9kL2
 * - 1a2B3c4D5e6F
 *
 * Example invalid access codes:
 * - ADMIN01 (too short, predictable pattern)
 * - ABC123DEF456! (special character)
 * - abc-123-def-456 (special character)
 */
export class AccessCodeLoginDto {
  /**
   * Administrator access code
   * - Exactly 12 characters
   * - Alphanumeric only (A-Z, a-z, 0-9)
   * - Case-sensitive
   */
  @IsString()
  @IsNotEmpty({ message: 'Access code is required' })
  @Length(12, 12, { message: 'Access code must be exactly 12 characters' })
  @Matches(/^[A-Za-z0-9]{12}$/, {
    message: 'Access code must contain only letters and numbers',
  })
  accessCode: string;
}

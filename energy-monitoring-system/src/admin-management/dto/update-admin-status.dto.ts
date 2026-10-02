import { IsBoolean, IsNotEmpty } from 'class-validator';

/**
 * Update Administrator Status DTO
 *
 * Validates account activation/deactivation requests.
 * Only SUPER_ADMIN can change administrator account status.
 *
 * Security Requirements:
 * - isActive must be boolean (true or false)
 * - Deactivated accounts cannot login
 * - Audit log entry created for status changes
 *
 * Example:
 * {
 *   "isActive": false
 * }
 */
export class UpdateAdminStatusDto {
  /**
   * Account active status
   * - true: Administrator can login with access code
   * - false: Administrator cannot login (account suspended)
   */
  @IsBoolean({ message: 'isActive must be a boolean value' })
  @IsNotEmpty({ message: 'isActive is required' })
  isActive: boolean;
}

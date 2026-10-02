import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { AuthService } from '../auth/auth.service';
import { CreateAdminDto, UpdateAdminStatusDto } from './dto';

/**
 * AdminManagementService
 *
 * Handles administrator account management operations.
 * Only accessible by SUPER_ADMIN role.
 *
 * Key Features:
 * - Create new administrator accounts
 * - Generate secure access codes
 * - Reset administrator access codes
 * - Activate/deactivate accounts
 * - List all administrators
 * - Access codes shown only once (on create/reset)
 *
 * Security:
 * - All operations restricted to SUPER_ADMIN
 * - Access codes are cryptographically random
 * - Access codes are hashed before storage
 * - Plain access code never stored
 * - All operations audited (caller must log)
 */
@Injectable()
export class AdminManagementService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private authService: AuthService,
  ) {}

  /**
   * Generate secure access code
   *
   * @returns 12-character alphanumeric access code
   *
   * Format: ABC123DEF456 (example)
   * - Exactly 12 characters
   * - Alphanumeric only (A-Z, a-z, 0-9)
   * - Cryptographically random
   * - No special characters
   * - No predictable patterns
   *
   * Security:
   * - Uses crypto.randomBytes for randomness
   * - Character set: A-Z, a-z, 0-9 (62 possibilities per character)
   * - Total combinations: 62^12 = 3.2 quadrillion
   * - Resistant to brute force attacks
   *
   * Usage:
   *   const accessCode = this.generateAccessCode();
   *   // Returns: "xY7pQ3mN9kL2"
   */
  private generateAccessCode(): string {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 12;
    let accessCode = '';

    // Generate cryptographically secure random bytes
    const randomBytes = crypto.randomBytes(length);

    // Convert each byte to a character from charset
    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes[i] % charset.length;
      accessCode += charset[randomIndex];
    }

    return accessCode;
  }

  /**
   * Create new administrator account
   *
   * @param createAdminDto - Administrator data
   * @returns Created admin with plain access code (shown only once)
   *
   * Process:
   * 1. Check email uniqueness
   * 2. Generate random access code
   * 3. Hash access code with bcrypt
   * 4. Create user document
   * 5. Return admin with plain access code
   *
   * Security:
   * - Email uniqueness enforced
   * - Access code is cryptographically random
   * - Access code is hashed before storage
   * - Plain access code returned only once
   * - Caller must audit this operation
   *
   * Note:
   * - Password field is set to a random hash (not used for admin login)
   * - Admin login uses access code only
   * - isActive defaults to true
   *
   * Usage:
   *   const result = await service.createAdmin({
   *     email: 'john@example.com',
   *     name: 'John Doe',
   *     role: 'SYSTEM_ADMIN'
   *   });
   *   // result.accessCode: "xY7pQ3mN9kL2" (plain, show to user)
   *   // result.admin: UserDocument (access code hash stored)
   */
  async createAdmin(createAdminDto: CreateAdminDto): Promise<{
    admin: UserDocument;
    accessCode: string;
  }> {
    const { email, name, role } = createAdminDto;

    // Check if email already exists
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException(
        'An account with this email address already exists',
      );
    }

    // Generate secure access code
    const accessCode = this.generateAccessCode();

    // Hash the access code
    const accessCodeHash = await this.authService.hashAccessCode(accessCode);

    // Generate random password hash (not used for admin login)
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = await this.authService.hashPassword(randomPassword);

    // Create admin user
    const admin = new this.userModel({
      email,
      name,
      role,
      password: passwordHash, // Required by schema, but not used
      accessCodeHash,
      isActive: true,
      lastLoginAt: null,
      lastActivityAt: null,
    });

    await admin.save();

    // Return admin and plain access code (shown only once)
    return {
      admin,
      accessCode, // Plain text - must be shown to user immediately
    };
  }

  /**
   * List all administrators
   *
   * @returns Array of all admin users (SUPER_ADMIN and SYSTEM_ADMIN)
   *
   * Security:
   * - Only returns admins (not PUBLIC_USER accounts)
   * - Password and access code hash never included
   * - Sorted by creation date (newest first)
   *
   * Usage:
   *   const admins = await service.listAdministrators();
   */
  async listAdministrators(): Promise<UserDocument[]> {
    return this.userModel
      .find({
        role: { $in: ['SYSTEM_ADMIN', 'SUPER_ADMIN'] },
      })
      .sort({ createdAt: -1 }) // Newest first
      .exec();
  }

  /**
   * Get administrator by ID
   *
   * @param id - User ID
   * @returns Administrator user document
   * @throws NotFoundException if not found or not an admin
   *
   * Security:
   * - Only returns if role is SYSTEM_ADMIN or SUPER_ADMIN
   * - Password and access code hash never included
   *
   * Usage:
   *   const admin = await service.getAdministratorById(userId);
   */
  async getAdministratorById(id: string): Promise<UserDocument> {
    const admin = await this.userModel.findById(id).exec();

    if (!admin) {
      throw new NotFoundException('Administrator not found');
    }

    // Verify it's an admin account
    if (admin.role !== 'SYSTEM_ADMIN' && admin.role !== 'SUPER_ADMIN') {
      throw new NotFoundException('Administrator not found');
    }

    return admin;
  }

  /**
   * Reset administrator access code
   *
   * @param id - Administrator user ID
   * @returns New plain access code (shown only once)
   *
   * Process:
   * 1. Find administrator
   * 2. Verify it's an admin account
   * 3. Generate new random access code
   * 4. Hash new access code
   * 5. Update user document
   * 6. Return plain access code
   *
   * Security:
   * - Only works for admin accounts
   * - New access code is cryptographically random
   * - Old access code immediately invalidated
   * - Plain access code returned only once
   * - Caller must audit this operation
   *
   * Usage:
   *   const newCode = await service.resetAccessCode(userId);
   *   // newCode: "aB2cD3eF4gH5" (plain, show to user)
   */
  async resetAccessCode(id: string): Promise<string> {
    // Find administrator
    const admin = await this.getAdministratorById(id);

    // Generate new access code
    const accessCode = this.generateAccessCode();

    // Hash the new access code
    const accessCodeHash = await this.authService.hashAccessCode(accessCode);

    // Update admin's access code
    admin.accessCodeHash = accessCodeHash;
    await admin.save();

    // Return plain access code (shown only once)
    return accessCode;
  }

  /**
   * Update administrator account status
   *
   * @param id - Administrator user ID
   * @param updateStatusDto - New status
   * @returns Updated administrator
   *
   * Process:
   * 1. Find administrator
   * 2. Verify it's an admin account
   * 3. Update isActive status
   * 4. Save changes
   *
   * Security:
   * - Only works for admin accounts
   * - Deactivated admins cannot login
   * - Caller must audit this operation
   *
   * Usage:
   *   const admin = await service.updateStatus(userId, { isActive: false });
   */
  async updateStatus(
    id: string,
    updateStatusDto: UpdateAdminStatusDto,
  ): Promise<UserDocument> {
    // Find administrator
    const admin = await this.getAdministratorById(id);

    // Update status
    admin.isActive = updateStatusDto.isActive;
    await admin.save();

    return admin;
  }

  /**
   * Delete administrator account
   *
   * @param id - Administrator user ID
   * @returns void
   *
   * Process:
   * 1. Find administrator
   * 2. Verify it's an admin account
   * 3. Check if last SUPER_ADMIN (prevent lockout)
   * 4. Delete user document
   *
   * Security:
   * - Only works for admin accounts
   * - Prevents deletion of last SUPER_ADMIN
   * - Caller must audit this operation
   *
   * Warning:
   * - This is a hard delete (no soft delete)
   * - Audit logs remain (denormalized name)
   * - Cannot be undone
   *
   * Usage:
   *   await service.deleteAdministrator(userId);
   */
  async deleteAdministrator(id: string): Promise<void> {
    // Find administrator
    const admin = await this.getAdministratorById(id);

    // If deleting a SUPER_ADMIN, check if it's the last one
    if (admin.role === 'SUPER_ADMIN') {
      const superAdminCount = await this.userModel
        .countDocuments({ role: 'SUPER_ADMIN' })
        .exec();

      if (superAdminCount <= 1) {
        throw new BadRequestException(
          'Cannot delete the last SUPER_ADMIN account. ' +
            'Create another SUPER_ADMIN first to prevent system lockout.',
        );
      }
    }

    // Delete the administrator
    await this.userModel.findByIdAndDelete(id).exec();
  }

  /**
   * Count administrators by role
   *
   * @returns Object with counts for each admin role
   *
   * Usage:
   *   const counts = await service.countByRole();
   *   // { SUPER_ADMIN: 2, SYSTEM_ADMIN: 13 }
   */
  async countByRole(): Promise<{
    SUPER_ADMIN: number;
    SYSTEM_ADMIN: number;
  }> {
    const [superAdminCount, systemAdminCount] = await Promise.all([
      this.userModel.countDocuments({ role: 'SUPER_ADMIN' }).exec(),
      this.userModel.countDocuments({ role: 'SYSTEM_ADMIN' }).exec(),
    ]);

    return {
      SUPER_ADMIN: superAdminCount,
      SYSTEM_ADMIN: systemAdminCount,
    };
  }
}

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateProfileDto, ChangePasswordDto } from './dto';

/**
 * Users Service
 *
 * Handles all User-related database operations.
 * This service acts as a data access layer for the User collection.
 *
 * Responsibilities:
 * - Query users from database
 * - Create new users
 * - Update user data
 * - Does NOT handle authentication logic (that's AuthService)
 *
 * Security:
 * - Password field is NOT selected by default
 * - Must explicitly request password when needed
 * - All methods return User without password (unless requested)
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  /**
   * Find user by email address
   *
   * @param email - Email address to search for
   * @param includePassword - Whether to include password field (default: false)
   * @returns User document or null if not found
   *
   * Usage:
   *   // Normal query (no password)
   *   const user = await usersService.findByEmail('admin@example.com');
   *
   *   // Login query (includes password for verification)
   *   const user = await usersService.findByEmail('admin@example.com', true);
   *
   * Security:
   * - Password is only included when explicitly requested
   * - Use includePassword=true ONLY during login validation
   */
  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email });

    if (includePassword) {
      // Explicitly include password field
      query.select('+password');
    }

    return query.exec();
  }

  /**
   * Find user by ID
   *
   * @param id - User ID (MongoDB ObjectId)
   * @returns User document or null if not found
   *
   * Usage:
   *   const user = await usersService.findById('64f9a1b2c3d4e5f6g7h8i9j0');
   *
   * Note:
   * - Password is never included (secure by default)
   * - Used for profile retrieval, user verification
   */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Update user's last login timestamp
   *
   * @param id - User ID
   * @returns void
   *
   * Usage:
   *   await usersService.updateLastLogin(user.id);
   *
   * Note:
   * - Fire and forget operation
   * - Does not return updated user
   * - Atomic update operation
   * - Used after successful login
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, {
        lastLoginAt: new Date(),
      })
      .exec();
  }

  /**
   * Create a new user
   *
   * @param createUserData - User data to create
   * @returns Created user document
   *
   * Usage:
   *   const admin = await usersService.create({
   *     email: 'admin@example.com',
   *     password: hashedPassword,  // Must be pre-hashed
   *     name: 'Administrator',
   *     role: 'admin'
   *   });
   *
   * Security:
   * - Password must be hashed BEFORE calling this method
   * - This method does NOT hash passwords
   * - Used by seed script and future user management
   *
   * Note:
   * - Email uniqueness is enforced by database index
   * - Will throw error if email already exists
   */
  async create(createUserData: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(createUserData);
    return user.save();
  }

  /**
   * Check if any admin users exist
   *
   * @returns true if at least one admin exists
   *
   * Usage:
   *   const hasAdmin = await usersService.hasAdminUsers();
   *   if (!hasAdmin) {
   *     // Create initial admin
   *   }
   *
   * Note:
   * - Used by seed script to prevent duplicate admin creation
   * - Counts active and inactive admin accounts
   */
  async hasAdminUsers(): Promise<boolean> {
    const count = await this.userModel.countDocuments({ role: 'admin' }).exec();
    return count > 0;
  }

  /**
   * Update user profile
   *
   * @param userId - User ID
   * @param updateProfileDto - Profile data to update
   * @returns Updated user document
   *
   * Usage:
   *   const user = await usersService.updateProfile(userId, { name: 'New Name' });
   *
   * Note:
   * - Currently only name can be updated
   * - Email cannot be changed (unique identifier)
   * - Returns updated user without password
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { name: updateProfileDto.name },
        { new: true }, // Return updated document
      )
      .exec();

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  /**
   * Change user password
   *
   * @param userId - User ID
   * @param changePasswordDto - Current and new passwords
   * @returns void
   *
   * Process:
   * 1. Fetch user with password field
   * 2. Verify current password
   * 3. Check new password is different
   * 4. Hash new password
   * 5. Update password in database
   *
   * Usage:
   *   await usersService.changePassword(userId, {
   *     currentPassword: 'OldPass123!',
   *     newPassword: 'NewSecurePass456!'
   *   });
   *
   * Security:
   * - Requires current password verification
   * - New password must meet strength requirements (validated by DTO)
   * - New password must be different from current password
   * - Password is hashed before storage
   *
   * Errors:
   * - UnauthorizedException: Current password is incorrect
   * - BadRequestException: New password same as current or user not found
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    // Fetch user with password
    const user = await this.userModel
      .findById(userId)
      .select('+password')
      .exec();

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check new password is different from current
    const isSamePassword = await bcrypt.compare(
      changePasswordDto.newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update password
    await this.userModel
      .findByIdAndUpdate(userId, { password: hashedPassword })
      .exec();
  }
}

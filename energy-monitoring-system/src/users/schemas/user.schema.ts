import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

/**
 * User Schema
 *
 * Represents an administrator account in the system.
 *
 * Security Features:
 * - Password is hashed with bcrypt before storage
 * - Password is never selected by default (select: false)
 * - Password is excluded from JSON responses (transform function)
 * - Email is unique and indexed for fast lookups
 * - Email is normalized (lowercase, trimmed)
 *
 * Fields:
 * - email: Unique login identifier
 * - password: Hashed password (bcrypt)
 * - name: Display name
 * - role: User role (only 'admin' for now)
 * - isActive: Account status (for suspension)
 * - lastLoginAt: Last successful login timestamp
 * - createdAt: Account creation timestamp (auto-generated)
 * - updatedAt: Last modification timestamp (auto-generated)
 */
@Schema({
  timestamps: true, // Automatically add createdAt and updatedAt
  toJSON: {
    virtuals: true, // Include virtual fields in JSON
    transform: (doc: any, ret: any) => {
      // Transform the document before sending in API response
      ret.id = ret._id.toString(); // Map _id to id (REST convention)
      delete ret._id; // Remove _id
      delete ret.__v; // Remove Mongoose version key
      delete ret.password; // Remove password (security)
      return ret;
    },
  },
})
export class User {
  /**
   * Email address (login identifier)
   * - Unique across all users
   * - Auto-converted to lowercase
   * - Whitespace trimmed
   * - Indexed for fast lookups
   */
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  /**
   * Hashed password
   * - Stored as bcrypt hash
   * - Never selected by default (must explicitly request)
   * - Never included in API responses
   */
  @Prop({
    required: true,
    select: false, // Don't include in queries by default
  })
  password: string;

  /**
   * Display name
   * Used in dashboard and logs
   */
  @Prop({
    required: true,
  })
  name: string;

  /**
   * User role
   * - SUPER_ADMIN: Can manage administrator accounts/access codes (no operational access)
   * - SYSTEM_ADMIN: Can perform operational dashboard functions (no account management)
   * - PUBLIC_USER: Public monitoring access only (no admin functions)
   * - Enum ensures type safety
   * - Defaults to 'PUBLIC_USER'
   */
  @Prop({
    type: String,
    enum: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PUBLIC_USER'],
    default: 'PUBLIC_USER',
  })
  role: string;

  /**
   * Account status
   * - true: Account is active and can login
   * - false: Account is suspended (cannot login)
   * - Defaults to true
   */
  @Prop({
    default: true,
  })
  isActive: boolean;

  /**
   * Last login timestamp
   * - Updated on successful login
   * - Optional (null for accounts that never logged in)
   */
  @Prop({
    required: false,
  })
  lastLoginAt?: Date;

  /**
   * Administrator Access Code (hashed)
   * - Used for shared-workstation authentication
   * - Stored as bcrypt hash (same as password)
   * - Never selected by default (must explicitly request)
   * - Never included in API responses
   * - Optional: Only SYSTEM_ADMIN and SUPER_ADMIN users have access codes
   */
  @Prop({
    required: false,
    select: false, // Don't include in queries by default
  })
  accessCodeHash?: string;

  /**
   * Last activity timestamp
   * - Updated on each authenticated user action
   * - Used for inactivity timeout tracking
   * - Optional (null for PUBLIC_USER accounts)
   */
  @Prop({
    required: false,
  })
  lastActivityAt?: Date;

  /**
   * Compare plain password with hashed password
   *
   * @param plainPassword - The plain text password to check
   * @returns Promise<boolean> - true if password matches
   *
   * Usage:
   *   const isMatch = await user.comparePassword('password123');
   */
  async comparePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  /**
   * Compare plain access code with hashed access code
   *
   * @param plainAccessCode - The plain text access code to check
   * @returns Promise<boolean> - true if access code matches
   *
   * Usage:
   *   const isMatch = await user.compareAccessCode('ABC123DEF456');
   */
  async compareAccessCode(plainAccessCode: string): Promise<boolean> {
    if (!this.accessCodeHash) {
      return false;
    }
    return bcrypt.compare(plainAccessCode, this.accessCodeHash);
  }
}

/**
 * User Document Type
 * Represents a User document from MongoDB
 */
export type UserDocument = User & Document;

/**
 * User Schema Factory
 * Creates the Mongoose schema from the User class
 */
export const UserSchema = SchemaFactory.createForClass(User);

/**
 * Add comparePassword method to schema
 * This makes the method available on user instances
 */
UserSchema.methods.comparePassword = async function (
  plainPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, this.password);
};

/**
 * Add compareAccessCode method to schema
 * This makes the method available on user instances
 */
UserSchema.methods.compareAccessCode = async function (
  plainAccessCode: string,
): Promise<boolean> {
  if (!this.accessCodeHash) {
    return false;
  }
  return bcrypt.compare(plainAccessCode, this.accessCodeHash);
};

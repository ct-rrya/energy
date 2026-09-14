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
   * - Currently only 'admin' is supported
   * - Enum ensures type safety
   * - Defaults to 'admin'
   */
  @Prop({
    type: String,
    enum: ['admin'],
    default: 'admin',
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

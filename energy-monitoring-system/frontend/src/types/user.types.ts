/**
 * User Types
 * 
 * TypeScript types for user-related data structures.
 * Matches backend User schema and DTOs.
 */

/**
 * User Profile interface
 * Represents detailed user profile from /api/users/profile
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update Profile DTO
 * Data for updating user profile
 */
export interface UpdateProfileDto {
  name: string;
}

/**
 * Change Password DTO
 * Data for changing user password
 */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

/**
 * API Response wrapper for user data
 */
export interface UserResponse {
  success: boolean;
  data: UserProfile;
  message?: string;
}

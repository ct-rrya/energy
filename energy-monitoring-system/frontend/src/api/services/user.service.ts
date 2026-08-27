import apiClient from '../client';
import type { UpdateProfileDto, ChangePasswordDto, UserResponse } from '@/types/user.types';

/**
 * User Service
 * 
 * API service for user profile management operations.
 * 
 * Endpoints:
 * - GET  /api/users/profile         - Get current user profile
 * - PUT  /api/users/profile         - Update profile
 * - POST /api/users/change-password - Change password
 * 
 * All endpoints require authentication (JWT token).
 */

/**
 * Get current user profile
 * 
 * @returns Promise<UserResponse> User profile data
 * 
 * Example:
 * const response = await userService.getProfile();
 * console.log(response.data.name); // "John Doe"
 */
export async function getProfile(): Promise<UserResponse> {
  const response = await apiClient.get<UserResponse>('/users/profile');
  return response.data;
}

/**
 * Update current user profile
 * 
 * @param dto - Profile data to update
 * @returns Promise<UserResponse> Updated user profile
 * 
 * Example:
 * const response = await userService.updateProfile({
 *   name: 'Jane Doe'
 * });
 */
export async function updateProfile(dto: UpdateProfileDto): Promise<UserResponse> {
  const response = await apiClient.put<UserResponse>('/users/profile', dto);
  return response.data;
}

/**
 * Change current user password
 * 
 * @param dto - Current and new passwords
 * @returns Promise<{ success: boolean; message: string }>
 * 
 * Example:
 * await userService.changePassword({
 *   currentPassword: 'OldPass123!',
 *   newPassword: 'NewSecurePass456!'
 * });
 */
export async function changePassword(
  dto: ChangePasswordDto
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    '/users/change-password',
    dto
  );
  return response.data;
}

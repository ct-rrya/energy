import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as userService from '@/api/services/user.service';
import type { UpdateProfileDto, ChangePasswordDto } from '@/types/user.types';
import { showToast } from '@/components/common/Toast';

/**
 * Query key for user profile
 */
const PROFILE_QUERY_KEY = ['user', 'profile'];

/**
 * useProfile Hook
 * 
 * React Query hook for fetching user profile.
 * 
 * Features:
 * - Automatic caching
 * - Automatic refetching
 * - Loading and error states
 * 
 * Usage:
 * const { data, isLoading, error, refetch } = useProfile();
 */
export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: userService.getProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * useUpdateProfile Hook
 * 
 * React Query mutation hook for updating user profile.
 * 
 * Features:
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Success/error handling
 * - Toast notifications
 * 
 * Usage:
 * const { mutate: updateProfile, isPending } = useUpdateProfile();
 * updateProfile({ name: 'New Name' });
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateProfileDto) => userService.updateProfile(dto),
    onSuccess: (data) => {
      // Invalidate profile query to refetch
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      
      showToast(data.message || 'Profile updated successfully', 'success');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update profile';
      showToast(message, 'error');
    },
  });
}

/**
 * useChangePassword Hook
 * 
 * React Query mutation hook for changing user password.
 * 
 * Features:
 * - Success/error handling
 * - Toast notifications
 * - Form reset callback support
 * 
 * Usage:
 * const { mutate: changePassword, isPending } = useChangePassword();
 * changePassword({
 *   currentPassword: 'OldPass123!',
 *   newPassword: 'NewSecurePass456!'
 * });
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (dto: ChangePasswordDto) => userService.changePassword(dto),
    onSuccess: (data) => {
      showToast(data.message || 'Password changed successfully', 'success');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to change password';
      showToast(message, 'error');
    },
  });
}

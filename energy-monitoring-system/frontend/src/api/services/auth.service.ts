import apiClient from '../client';
import { AUTH_ENDPOINTS } from '../constants';
import type { ApiResponse, LoginCredentials, LoginResponse, User } from '@/types';

/**
 * Authentication Service
 * Handles login and user profile operations
 */
export const authService = {
  /**
   * Login user
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      AUTH_ENDPOINTS.LOGIN,
      credentials
    );
    return response.data;
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>(AUTH_ENDPOINTS.PROFILE);
    return response.data;
  },
};

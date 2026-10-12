/**
 * Authentication Service
 * 
 * Handles authentication API calls.
 * Backend contract (verified):
 * - POST /auth/login - body: { email: string, password: string }
 * - POST /auth/admin/access-code - body: { accessCode: string }
 * 
 * SECURITY: Never log credentials or tokens.
 */

import apiClient from '../client';
import type {
  LoginCredentials,
  AccessCodeCredentials,
  AuthResponse,
} from '../../types/auth.types';

/**
 * Login with email and password (for PUBLIC_USER)
 * Backend blocks admin roles from using this endpoint.
 * 
 * @param credentials - Email and password
 * @returns AuthResponse with token and user data
 * @throws Error with backend message if login fails
 */
export async function login(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>(
      '/auth/login',
      credentials
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Login failed');
    }

    return response.data;
  } catch (error: any) {
    // Extract error message from backend response
    const message =
      error.response?.data?.message || 
      error.message ||
      'Network error. Please check your connection.';
    throw new Error(message);
  }
}

/**
 * Login with administrator access code (for SYSTEM_ADMIN and SUPER_ADMIN)
 * Access code must be exactly 12 alphanumeric characters (case-sensitive).
 * 
 * @param credentials - Access code
 * @returns AuthResponse with token and user data
 * @throws Error with backend message if login fails
 */
export async function loginWithAccessCode(
  credentials: AccessCodeCredentials
): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>(
      '/auth/admin/access-code',
      credentials
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Invalid access code');
    }

    return response.data;
  } catch (error: any) {
    // Extract error message from backend response
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Please check your connection.';
    throw new Error(message);
  }
}

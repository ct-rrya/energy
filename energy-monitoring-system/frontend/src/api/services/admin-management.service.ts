import apiClient from '../client';
import type { ApiResponse } from '@/types';

/**
 * Administrator Interface
 */
export interface Administrator {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'SYSTEM_ADMIN';
  isActive: boolean;
  lastLoginAt?: string;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Administrator DTO
 */
export interface CreateAdministratorDto {
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'SYSTEM_ADMIN';
}

/**
 * Create Administrator Response
 */
export interface CreateAdministratorResponse {
  message: string;
  administrator: Administrator;
  accessCode: string; // Shown only once!
}

/**
 * Update Administrator Status DTO
 */
export interface UpdateAdministratorStatusDto {
  isActive: boolean;
}

/**
 * Reset Access Code Response
 */
export interface ResetAccessCodeResponse {
  message: string;
  accessCode: string; // Shown only once!
}

/**
 * Administrator Statistics
 */
export interface AdministratorStats {
  SUPER_ADMIN: number;
  SYSTEM_ADMIN: number;
  total: number;
}

/**
 * Admin Management Service
 *
 * Provides API methods for SUPER_ADMIN to manage administrator accounts.
 * All endpoints require SUPER_ADMIN authentication.
 */
export const adminManagementService = {
  /**
   * List all administrators
   */
  listAdministrators: async (): Promise<
    ApiResponse<{ administrators: Administrator[] }>
  > => {
    const response = await apiClient.get<
      ApiResponse<{ administrators: Administrator[] }>
    >('/admin-management/administrators');
    return response.data;
  },

  /**
   * Get administrator statistics
   */
  getStatistics: async (): Promise<
    ApiResponse<{ stats: AdministratorStats }>
  > => {
    const response = await apiClient.get<
      ApiResponse<{ stats: AdministratorStats }>
    >('/admin-management/administrators/stats');
    return response.data;
  },

  /**
   * Get administrator by ID
   */
  getAdministrator: async (
    id: string,
  ): Promise<ApiResponse<{ administrator: Administrator }>> => {
    const response = await apiClient.get<
      ApiResponse<{ administrator: Administrator }>
    >(`/admin-management/administrators/${id}`);
    return response.data;
  },

  /**
   * Create new administrator
   */
  createAdministrator: async (
    data: CreateAdministratorDto,
  ): Promise<ApiResponse<CreateAdministratorResponse>> => {
    const response = await apiClient.post<
      ApiResponse<CreateAdministratorResponse>
    >('/admin-management/administrators', data);
    return response.data;
  },

  /**
   * Reset administrator access code
   */
  resetAccessCode: async (
    id: string,
  ): Promise<ApiResponse<ResetAccessCodeResponse>> => {
    const response = await apiClient.post<
      ApiResponse<ResetAccessCodeResponse>
    >(`/admin-management/administrators/${id}/reset-code`);
    return response.data;
  },

  /**
   * Update administrator status (activate/deactivate)
   */
  updateStatus: async (
    id: string,
    data: UpdateAdministratorStatusDto,
  ): Promise<ApiResponse<{ message: string; administrator: Administrator }>> => {
    const response = await apiClient.patch<
      ApiResponse<{ message: string; administrator: Administrator }>
    >(`/admin-management/administrators/${id}/status`, data);
    return response.data;
  },

  /**
   * Delete administrator
   */
  deleteAdministrator: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<
      ApiResponse<{ message: string }>
    >(`/admin-management/administrators/${id}`);
    return response.data;
  },
};

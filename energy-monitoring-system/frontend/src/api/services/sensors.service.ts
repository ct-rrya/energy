import apiClient from '../client';
import type { ApiResponse } from '@/types';

/**
 * Sensor Interface
 */
export interface Sensor {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
  apiKey?: string;
  installationDate: string;
  lastSeenAt?: string;
  metadata?: {
    hardwareVersion?: string;
    firmwareVersion?: string;
    model?: string;
    notes?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Sensors Service
 * 
 * Handles sensor management API operations.
 */
export const sensorsService = {
  /**
   * Get all sensors
   * 
   * @returns Array of sensors
   */
  getAll: async (): Promise<ApiResponse<Sensor[]>> => {
    const response = await apiClient.get<ApiResponse<Sensor[]>>('/sensors');
    return response.data;
  },

  /**
   * Get sensor by ID
   * 
   * @param id - Sensor ID
   * @returns Sensor details
   */
  getById: async (id: string): Promise<ApiResponse<Sensor>> => {
    const response = await apiClient.get<ApiResponse<Sensor>>(`/sensors/${id}`);
    return response.data;
  },

  /**
   * Create new sensor
   * 
   * @param data - Sensor creation data
   * @returns Created sensor
   */
  create: async (data: {
    name: string;
    location: string;
    status?: 'active' | 'inactive' | 'maintenance';
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<Sensor>> => {
    const response = await apiClient.post<ApiResponse<Sensor>>('/sensors', data);
    return response.data;
  },

  /**
   * Update sensor
   * 
   * @param id - Sensor ID
   * @param data - Update data
   * @returns Updated sensor
   */
  update: async (
    id: string,
    data: Partial<{
      name: string;
      location: string;
      status: 'active' | 'inactive' | 'maintenance';
      metadata: Record<string, any>;
    }>
  ): Promise<ApiResponse<Sensor>> => {
    const response = await apiClient.patch<ApiResponse<Sensor>>(`/sensors/${id}`, data);
    return response.data;
  },

  /**
   * Delete sensor (soft delete)
   * 
   * @param id - Sensor ID
   * @returns Success response
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/sensors/${id}`);
    return response.data;
  },

  /**
   * Regenerate sensor API key
   * 
   * @param id - Sensor ID
   * @returns New API key
   */
  regenerateKey: async (id: string): Promise<ApiResponse<{ apiKey: string }>> => {
    const response = await apiClient.post<ApiResponse<{ apiKey: string }>>(
      `/sensors/${id}/regenerate-key`
    );
    return response.data;
  },
};

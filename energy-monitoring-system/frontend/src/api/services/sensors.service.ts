import apiClient from '../client';
import type { 
  Sensor, 
  SensorWithApiKey, 
  CreateSensorDto, 
  UpdateSensorDto 
} from '@/types/sensor.types';

/**
 * Sensors Service
 * 
 * API calls for sensor management (System Admin only)
 */
export const sensorsService = {
  /**
   * Get all sensors
   */
  getAll: async () => {
    return apiClient.get<Sensor[]>('/sensors');
  },

  /**
   * Get sensor by ID
   */
  getById: async (id: string) => {
    return apiClient.get<Sensor>(`/sensors/${id}`);
  },

  /**
   * Create new sensor
   */
  create: async (data: CreateSensorDto) => {
    return apiClient.post<SensorWithApiKey>('/sensors', data);
  },

  /**
   * Update sensor
   */
  update: async (id: string, data: UpdateSensorDto) => {
    return apiClient.patch<Sensor>(`/sensors/${id}`, data);
  },

  /**
   * Delete sensor (soft delete)
   */
  delete: async (id: string) => {
    return apiClient.delete<Sensor>(`/sensors/${id}`);
  },

  /**
   * Regenerate API key
   */
  regenerateApiKey: async (id: string) => {
    return apiClient.post<SensorWithApiKey>(`/sensors/${id}/regenerate-key`);
  },
};

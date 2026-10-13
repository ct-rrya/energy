/**
 * Sensors Service
 * 
 * Handles sensor management API operations.
 * Backend endpoints (verified):
 * - POST   /api/sensors - Create new sensor
 * - GET    /api/sensors - List all sensors
 * - GET    /api/sensors/:id - Get sensor details
 * - PATCH  /api/sensors/:id - Update sensor
 * - DELETE /api/sensors/:id - Delete sensor (soft delete)
 * - POST   /api/sensors/:id/regenerate-key - Regenerate API key
 * 
 * Authentication: Required (JWT)
 * All endpoints require JWT authentication via JwtAuthGuard.
 * Admin-only in practice, but mobile service does not enforce roles (backend handles authorization).
 * The apiClient automatically attaches the JWT token via request interceptor.
 */

import apiClient from '../client';
import type {
  ApiResponse,
  Sensor,
  SensorWithApiKey,
  SensorMetadata,
  SensorStatus,
} from '../../types';

/**
 * Get Sensors
 * 
 * Retrieves all active sensors.
 * API keys are excluded from the response for security.
 * 
 * Backend endpoint: GET /api/sensors
 * Authentication: Required (JWT)
 * 
 * @returns Array of sensors (API keys excluded)
 * @throws Error if unauthorized or network fails
 */
export async function getSensors(): Promise<Sensor[]> {
  try {
    const response = await apiClient.get<ApiResponse<Sensor[]>>('/sensors');

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch sensors'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch sensors.';
    throw new Error(message);
  }
}

/**
 * Get Sensor by ID
 * 
 * Retrieves detailed information about a specific sensor.
 * API key is excluded from the response for security.
 * 
 * Backend endpoint: GET /api/sensors/:id
 * Authentication: Required (JWT)
 * 
 * @param id - Sensor ID (MongoDB ObjectId)
 * @returns Sensor details (API key excluded)
 * @throws Error if sensor not found, unauthorized, or network fails
 */
export async function getSensorById(id: string): Promise<Sensor> {
  try {
    const response = await apiClient.get<ApiResponse<Sensor>>(
      `/sensors/${id}`
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch sensor'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch sensor.';
    throw new Error(message);
  }
}

/**
 * Create Sensor
 * 
 * Registers a new sensor device and generates a unique API key.
 * The API key is ONLY returned in this response and cannot be retrieved later.
 * Administrator must save the API key immediately and configure ESP32 with it.
 * 
 * Backend endpoint: POST /api/sensors
 * Authentication: Required (JWT)
 * 
 * @param data - Sensor creation data (name, location, optional status and metadata)
 * @returns Created sensor with API key
 * @throws Error if validation fails, unauthorized, or network fails
 */
// SECURITY: Do not log or store the returned apiKey — it is shown once only
export async function createSensor(data: {
  name: string;
  location: string;
  status?: SensorStatus;
  metadata?: SensorMetadata;
}): Promise<SensorWithApiKey> {
  try {
    const response = await apiClient.post<ApiResponse<SensorWithApiKey>>(
      '/sensors',
      data
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to create sensor'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to create sensor.';
    throw new Error(message);
  }
}

/**
 * Update Sensor
 * 
 * Updates sensor information (name, location, status, metadata).
 * All fields are optional (partial update).
 * Cannot update API key - use regenerateSensorApiKey instead.
 * 
 * Backend endpoint: PATCH /api/sensors/:id
 * Authentication: Required (JWT)
 * 
 * @param id - Sensor ID (MongoDB ObjectId)
 * @param data - Fields to update (all optional)
 * @returns Updated sensor (API key excluded)
 * @throws Error if sensor not found, validation fails, unauthorized, or network fails
 */
export async function updateSensor(
  id: string,
  data: {
    name?: string;
    location?: string;
    status?: SensorStatus;
    metadata?: SensorMetadata;
  }
): Promise<Sensor> {
  try {
    const response = await apiClient.patch<ApiResponse<Sensor>>(
      `/sensors/${id}`,
      data
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to update sensor'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to update sensor.';
    throw new Error(message);
  }
}

/**
 * Delete Sensor
 * 
 * Soft deletes a sensor by marking it as inactive.
 * The sensor and its historical data are preserved in the database.
 * The sensor cannot send new data after deletion (API key becomes invalid).
 * 
 * Backend endpoint: DELETE /api/sensors/:id
 * Authentication: Required (JWT)
 * 
 * @param id - Sensor ID (MongoDB ObjectId)
 * @returns Deleted sensor (with isActive = false)
 * @throws Error if sensor not found, unauthorized, or network fails
 */
export async function deleteSensor(id: string): Promise<Sensor> {
  try {
    const response = await apiClient.delete<ApiResponse<Sensor>>(
      `/sensors/${id}`
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to delete sensor'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to delete sensor.';
    throw new Error(message);
  }
}

/**
 * Regenerate Sensor API Key
 * 
 * Generates a new API key for a sensor.
 * Use when API key is compromised, lost, or for security rotation.
 * 
 * IMPORTANT:
 * - Old API key becomes invalid immediately
 * - ESP32 must be reconfigured with the new key
 * - New key is ONLY shown in this response
 * - Cannot retrieve key later
 * 
 * Backend endpoint: POST /api/sensors/:id/regenerate-key
 * Authentication: Required (JWT)
 * 
 * @param id - Sensor ID (MongoDB ObjectId)
 * @returns Sensor with new API key
 * @throws Error if sensor not found, unauthorized, or network fails
 */
// SECURITY: Do not log or store the returned apiKey — it is shown once only
export async function regenerateSensorApiKey(id: string): Promise<SensorWithApiKey> {
  try {
    const response = await apiClient.post<ApiResponse<SensorWithApiKey>>(
      `/sensors/${id}/regenerate-key`,
      {} // Empty body
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to regenerate API key'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to regenerate API key.';
    throw new Error(message);
  }
}

/**
 * Energy Service
 * 
 * Handles energy data API operations.
 * Backend endpoints (verified):
 * - GET /api/energy/today - Today's total energy (auth required)
 * - GET /api/energy/range - Energy for date range (auth required)
 * - GET /api/energy/recent - Recent readings (PUBLIC, no auth)
 * - GET /api/energy/readings - Readings in range (auth required)
 * - GET /api/energy/by-sensors - Today's energy by sensor (auth required)
 * - GET /api/energy/statistics - System statistics (auth required)
 * - GET /api/energy/sensor/:id/today - Sensor today energy (auth required)
 * - GET /api/energy/sensor/:id/range - Sensor range (auth required)
 * - GET /api/energy/sensor/:id/recent - Sensor recent readings (auth required)
 * 
 * Authentication: Most endpoints require JWT except /recent (public)
 */

import apiClient from '../client';
import type {
  ApiResponse,
  EnergyReading,
  TodayEnergy,
  EnergyRange,
  SensorEnergy,
  TotalStatistics,
} from '../../types';

/**
 * Get Today's Total Energy
 * 
 * Retrieves energy statistics for the current day across all sensors.
 * 
 * Backend endpoint: GET /api/energy/today
 * Authentication: Required (JWT)
 * 
 * @returns Today's energy statistics
 * @throws Error if unauthorized or network fails
 */
export async function getTodayEnergy(): Promise<TodayEnergy> {
  try {
    const response = await apiClient.get<ApiResponse<TodayEnergy>>(
      '/energy/today'
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch today energy'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch today energy.';
    throw new Error(message);
  }
}

/**
 * Get Energy for Date Range
 * 
 * Retrieves energy statistics for a specific date range across all sensors.
 * 
 * Backend endpoint: GET /api/energy/range
 * Authentication: Required (JWT)
 * 
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Energy statistics for the date range
 * @throws Error if dates are invalid, unauthorized, or network fails
 */
export async function getEnergyRange(
  startDate: string,
  endDate: string
): Promise<EnergyRange> {
  try {
    const response = await apiClient.get<ApiResponse<EnergyRange>>(
      '/energy/range',
      {
        params: { startDate, endDate },
      }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch energy range'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch energy range.';
    throw new Error(message);
  }
}

/**
 * Get Recent Readings
 * 
 * Retrieves the most recent energy readings across all sensors.
 * This is a PUBLIC endpoint - no authentication required.
 * 
 * Backend endpoint: GET /api/energy/recent
 * Authentication: Public (no JWT required)
 * 
 * @param limit - Number of readings to fetch (default: 10, max: 1000)
 * @returns Array of recent readings, sorted by timestamp (newest first)
 * @throws Error if limit is invalid or network fails
 */
export async function getRecentReadings(
  limit: number = 10
): Promise<EnergyReading[]> {
  try {
    const response = await apiClient.get<ApiResponse<EnergyReading[]>>(
      '/energy/recent',
      {
        params: { limit },
      }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch recent readings'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch recent readings.';
    throw new Error(message);
  }
}

/**
 * Get Latest Reading
 * 
 * Convenience method that retrieves the single most recent reading.
 * Uses the public /recent endpoint with limit=1.
 * 
 * Backend endpoint: GET /api/energy/recent?limit=1
 * Authentication: Public (no JWT required)
 * 
 * @returns Latest reading or null if no readings exist
 * @throws Error if network fails
 */
export async function getLatestReading(): Promise<EnergyReading | null> {
  try {
    const readings = await getRecentReadings(1);
    return readings.length > 0 ? readings[0] : null;
  } catch (error: any) {
    // Return null instead of throwing for this convenience method
    console.error('Failed to fetch latest reading:', error.message);
    return null;
  }
}

/**
 * Get Readings for Date Range
 * 
 * Retrieves all readings within a date range.
 * Use with caution - can return large datasets.
 * 
 * Backend endpoint: GET /api/energy/readings
 * Authentication: Required (JWT)
 * 
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param limit - Maximum number of readings (default: 1000, max: 10000)
 * @returns Array of readings
 * @throws Error if unauthorized or network fails
 */
export async function getReadingsRange(
  startDate: string,
  endDate: string,
  limit: number = 1000
): Promise<EnergyReading[]> {
  try {
    const response = await apiClient.get<ApiResponse<EnergyReading[]>>(
      '/energy/readings',
      {
        params: { startDate, endDate, limit },
      }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch readings range'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch readings range.';
    throw new Error(message);
  }
}

/**
 * Get Energy by Sensors
 * 
 * Retrieves today's energy grouped by sensor.
 * Shows which sensors are most productive.
 * 
 * Backend endpoint: GET /api/energy/by-sensors
 * Authentication: Required (JWT)
 * 
 * @returns Array of sensor energy statistics, sorted by total power (highest first)
 * @throws Error if unauthorized or network fails
 */
export async function getEnergyBySensors(): Promise<SensorEnergy[]> {
  try {
    const response = await apiClient.get<ApiResponse<SensorEnergy[]>>(
      '/energy/by-sensors'
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch energy by sensors'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch energy by sensors.';
    throw new Error(message);
  }
}

/**
 * Get Total Statistics
 * 
 * Returns overall system statistics including total readings,
 * today's stats, and last reading received.
 * 
 * Backend endpoint: GET /api/energy/statistics
 * Authentication: Required (JWT)
 * 
 * @returns System-wide energy statistics
 * @throws Error if unauthorized or network fails
 */
export async function getTotalStatistics(): Promise<TotalStatistics> {
  try {
    const response = await apiClient.get<ApiResponse<TotalStatistics>>(
      '/energy/statistics'
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch total statistics'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch total statistics.';
    throw new Error(message);
  }
}

/**
 * Get Sensor's Today Energy
 * 
 * Retrieves energy statistics for a specific sensor for the current day.
 * 
 * Backend endpoint: GET /api/energy/sensor/:id/today
 * Authentication: Required (JWT)
 * 
 * @param sensorId - Sensor ID (MongoDB ObjectId)
 * @returns Today's energy statistics for the sensor
 * @throws Error if sensor not found, unauthorized, or network fails
 */
export async function getSensorTodayEnergy(
  sensorId: string
): Promise<TodayEnergy & { sensorId: string }> {
  try {
    const response = await apiClient.get<
      ApiResponse<TodayEnergy & { sensorId: string }>
    >(`/energy/sensor/${sensorId}/today`);

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch sensor today energy'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch sensor today energy.';
    throw new Error(message);
  }
}

/**
 * Get Sensor's Energy Range
 * 
 * Retrieves energy statistics for a specific sensor within a date range.
 * 
 * Backend endpoint: GET /api/energy/sensor/:id/range
 * Authentication: Required (JWT)
 * 
 * @param sensorId - Sensor ID (MongoDB ObjectId)
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Energy statistics for the sensor in the date range
 * @throws Error if sensor not found, unauthorized, or network fails
 */
export async function getSensorEnergyRange(
  sensorId: string,
  startDate: string,
  endDate: string
): Promise<EnergyRange & { sensorId: string }> {
  try {
    const response = await apiClient.get<
      ApiResponse<EnergyRange & { sensorId: string }>
    >(`/energy/sensor/${sensorId}/range`, {
      params: { startDate, endDate },
    });

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch sensor energy range'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch sensor energy range.';
    throw new Error(message);
  }
}

/**
 * Get Sensor's Recent Readings
 * 
 * Retrieves the most recent readings for a specific sensor.
 * 
 * Backend endpoint: GET /api/energy/sensor/:id/recent
 * Authentication: Required (JWT)
 * 
 * @param sensorId - Sensor ID (MongoDB ObjectId)
 * @param limit - Number of readings to fetch (default: 100, max: 1000)
 * @returns Array of sensor's recent readings, sorted by timestamp (newest first)
 * @throws Error if sensor not found, unauthorized, or network fails
 */
export async function getSensorRecentReadings(
  sensorId: string,
  limit: number = 100
): Promise<EnergyReading[]> {
  try {
    const response = await apiClient.get<ApiResponse<EnergyReading[]>>(
      `/energy/sensor/${sensorId}/recent`,
      {
        params: { limit },
      }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch sensor recent readings'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch sensor recent readings.';
    throw new Error(message);
  }
}

/**
 * Sensor Types
 * 
 * Type definitions for sensor management.
 * These match the backend sensor DTOs and schema.
 */

/**
 * Sensor Status
 * Matches backend SensorStatus enum
 */
export enum SensorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

/**
 * Sensor Metadata
 * Additional information about the sensor
 */
export interface SensorMetadata {
  hardwareVersion?: string;
  firmwareVersion?: string;
  model?: string;
  notes?: string;
  [key: string]: any;
}

/**
 * Sensor
 * Represents a sensor device
 * Matches: SensorResponseDto
 * Note: apiKey is excluded (only visible at creation)
 */
export interface Sensor {
  id: string;
  name: string;
  location: string;
  status: SensorStatus;
  installationDate: string;    // ISO 8601
  lastSeenAt: string | null;   // ISO 8601
  metadata?: SensorMetadata;
  isActive: boolean;
  createdAt: string;           // ISO 8601
  updatedAt: string;           // ISO 8601
}

/**
 * Sensor with API Key
 * Extended sensor info including API key
 * Matches: SensorWithApiKeyResponseDto
 * ONLY returned when creating a sensor or regenerating API key
 */
export interface SensorWithApiKey extends Sensor {
  apiKey: string;
}

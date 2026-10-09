/**
 * Sensor Type Definitions
 */

/**
 * Sensor Status
 */
export const SensorStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
} as const;

export type SensorStatus = typeof SensorStatus[keyof typeof SensorStatus];

/**
 * Sensor Metadata
 */
export interface SensorMetadata {
  hardwareVersion?: string;
  firmwareVersion?: string;
  model?: string;
  notes?: string;
}

/**
 * Sensor Interface
 */
export interface Sensor {
  id: string;
  name: string;
  location: string;
  status: SensorStatus;
  installationDate: string;
  lastSeenAt: string | null;
  metadata: SensorMetadata;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Sensor with API Key (only returned on creation/regeneration)
 */
export interface SensorWithApiKey extends Sensor {
  apiKey: string;
}

/**
 * Create Sensor DTO
 */
export interface CreateSensorDto {
  name: string;
  location: string;
  status?: SensorStatus;
  metadata?: SensorMetadata;
}

/**
 * Update Sensor DTO
 */
export interface UpdateSensorDto {
  name?: string;
  location?: string;
  status?: SensorStatus;
  metadata?: SensorMetadata;
}

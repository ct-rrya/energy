/**
 * Sensor Status
 */
export const SensorStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
} as const;

export type SensorStatus = (typeof SensorStatus)[keyof typeof SensorStatus];

/**
 * Sensor Entity
 */
export interface Sensor {
  _id: string;
  name: string;
  location: string;
  description?: string;
  apiKey: string;
  status: SensorStatus;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Sensor DTO
 */
export interface CreateSensorDto {
  name: string;
  location: string;
  description?: string;
}

/**
 * Update Sensor DTO
 */
export interface UpdateSensorDto {
  name?: string;
  location?: string;
  description?: string;
  status?: SensorStatus;
}

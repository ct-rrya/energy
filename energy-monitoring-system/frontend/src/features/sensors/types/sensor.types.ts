/**
 * Sensor Monitoring Types
 * 
 * TypeScript interfaces for sensor monitoring feature.
 */

/**
 * Reading Source
 */
export type ReadingSource = 'hardware' | 'mock';

/**
 * Signal Quality
 */
export type SignalQuality = 'excellent' | 'good' | 'fair' | 'poor';

/**
 * Sensor Reading
 * 
 * Complete sensor reading with all fields and calculated values.
 */
export interface SensorReading {
  id: string;
  sensorId: string;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  batteryPercentage: number;
  temperature?: number;
  frequency?: number;
  timestamp: string;
  receivedAt: string;
  source: ReadingSource;
  signalQuality: SignalQuality;
  latency: number;
  powerKW: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Sensor Reading Statistics
 */
export interface ReadingStatistics {
  sensorId: string;
  totalReadings: number;
  startDate: string;
  endDate: string;
  voltage: {
    min: number;
    max: number;
    avg: number;
  };
  current: {
    min: number;
    max: number;
    avg: number;
  };
  power: {
    min: number;
    max: number;
    avg: number;
  };
  totalEnergy: number;
  battery: {
    min: number;
    max: number;
    avg: number;
  };
  temperature?: {
    min: number;
    max: number;
    avg: number;
  };
  frequency?: {
    min: number;
    max: number;
    avg: number;
  };
}

/**
 * Paginated Readings Response
 */
export interface PaginatedReadings {
  readings: SensorReading[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Reading Query Parameters
 */
export interface ReadingQueryParams {
  startDate?: string;
  endDate?: string;
  source?: ReadingSource;
  page?: number;
  limit?: number;
}

/**
 * Statistics Query Parameters
 */
export interface StatisticsQueryParams {
  startDate?: string;
  endDate?: string;
  source?: ReadingSource;
}

/**
 * Sensor with Latest Reading
 * 
 * Combines sensor info with its latest reading.
 */
export interface SensorWithReading {
  sensorId: string;
  sensorName: string;
  sensorLocation: string;
  sensorStatus: 'active' | 'inactive' | 'maintenance';
  lastReading?: SensorReading;
}

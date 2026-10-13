/**
 * Energy Data Types
 * 
 * Type definitions for energy readings and statistics.
 * These match the backend DTOs exactly.
 */

/**
 * Energy Reading
 * Represents a single sensor reading from the backend
 * Matches: EnergyReadingResponseDto
 */
export interface EnergyReading {
  id: string;
  sensorId: string;
  voltage: number;          // Volts
  current: number;          // Amperes
  power: number;            // Watts
  energy: number;           // kWh (cumulative)
  timestamp: string;        // ISO 8601 (ESP32 time)
  receivedAt: string;       // ISO 8601 (Server time)
  stepCount?: number;
  capacitorVoltage?: number;
  frequency?: number;       // Hz
}

/**
 * Energy Statistics
 * Base statistics structure used by various endpoints
 * Matches: EnergyStatisticsDto
 */
export interface EnergyStatistics {
  totalPower: number;           // Sum of all power readings (W)
  count: number;                // Number of readings
  avgPower: number;             // Average power (W)
  maxPower: number;             // Maximum power (W)
  minPower: number;             // Minimum power (W)
  estimatedEnergyKWh: number;   // Estimated energy (kWh)
}

/**
 * Today's Energy Statistics
 * Matches: TodayEnergyResponseDto
 * Used by: GET /api/energy/today
 */
export interface TodayEnergy extends EnergyStatistics {
  date: string; // YYYY-MM-DD
}

/**
 * Energy Range Statistics
 * Matches: EnergyRangeResponseDto
 * Used by: GET /api/energy/range
 */
export interface EnergyRange extends EnergyStatistics {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

/**
 * Sensor Energy Summary
 * Matches: SensorEnergyDto
 * Used by: GET /api/energy/by-sensors
 */
export interface SensorEnergy {
  sensorId: string;
  totalPower: number;
  count: number;
  avgPower: number;
  maxPower: number;
}

/**
 * Total System Statistics
 * Matches: TotalStatisticsResponseDto
 * Used by: GET /api/energy/statistics
 */
export interface TotalStatistics {
  totalReadings: number;
  todayStats: TodayEnergy;
  lastReading: {
    timestamp: string;
    power: number;
    sensorId: string;
  } | null;
}

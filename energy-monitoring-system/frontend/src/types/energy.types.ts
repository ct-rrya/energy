/**
 * Energy Reading Entity
 */
export interface EnergyReading {
  _id: string;
  sensorId: string;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  timestamp: string;
  createdAt: string;
}

/**
 * Real-time Energy Metrics
 */
export interface RealTimeMetrics {
  currentPower: number;
  totalEnergy: number;
  activeSensors: number;
  averageVoltage: number;
  averageCurrent: number;
}

/**
 * Energy Statistics
 */
export interface EnergyStatistics {
  totalEnergy: number;
  averagePower: number;
  peakPower: number;
  readings: number;
  period: string;
}

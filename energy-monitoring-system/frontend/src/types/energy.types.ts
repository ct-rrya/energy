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
  batteryPercentage?: number;
  temperature?: number;
  frequency?: number;
  stepCount?: number;
  capacitorVoltage?: number;
  wifiConnected?: boolean;
  bluetoothConnected?: boolean;
  timestamp: string;
  receivedAt?: string;
  source?: 'hardware' | 'mock';
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

/**
 * Monitoring Metrics
 * 
 * Real-time monitoring data for dashboard display
 */
export interface MonitoringMetrics {
  voltage: number;
  current: number;
  power: number;
  energy: number;
  batteryPercentage?: number;
  stepCount?: number;
  capacitorVoltage?: number;
  temperature?: number;
  frequency?: number;
  timestamp: string;
}

/**
 * Connectivity Status
 * 
 * Device connectivity information
 */
export interface ConnectivityStatus {
  wifiConnected: boolean;
  bluetoothConnected: boolean;
  dataTransferStatus: 'receiving' | 'waiting' | 'offline' | 'error';
  lastUpdate: string | null;
  latency?: number; // milliseconds
}

/**
 * System Status
 * 
 * Overall system monitoring status
 */
export interface SystemStatus {
  connectivity: ConnectivityStatus;
  deviceOnline: boolean;
  lastReading: EnergyReading | null;
  activeSensors: number;
}

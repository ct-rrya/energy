/**
 * Dashboard Metrics Response
 */
export interface DashboardMetrics {
  // Energy metrics
  dailyEnergy: number;
  todayTotalPower?: number;
  todayAvgPower?: number;
  todayEstimatedEnergyKWh?: number;
  
  // Sensor data
  totalReadings?: number;
  activeSensors: number;
  lastReadingAt?: string;
  lastReadingPower?: number;
  lastReadingSensorId?: string;
  
  // AI insight
  aiInsight?: string; // AI-generated insight about today's energy performance
  
  // Legacy fields (kept for backward compatibility)
  currentEnergy?: number;
  currentVoltage?: number;
  currentCurrent?: number;
  currentPower?: number;
  batteryPercentage?: number;
  estimatedDailyEnergy?: number;
  stepCount?: number;
  capacitorVoltage?: number;
  temperature?: number;
  frequency?: number;
  wifiConnected?: boolean;
  bluetoothConnected?: boolean;
  lastUpdate?: string;
  connectedDevices?: number;
}

/**
 * System Status
 */
export interface SystemStatus {
  api: ConnectionStatus;
  database: ConnectionStatus;
  websocket: ConnectionStatus;
  uptime: number;
}

/**
 * Connection Status
 */
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

/**
 * Activity Item
 */
export interface ActivityItem {
  id: string;
  type: 'sensor' | 'reading' | 'alert' | 'report';
  message: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'error';
}

/**
 * Sensor Reading (WebSocket)
 */
export interface SensorReading {
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
}

/**
 * Dashboard WebSocket Events
 */
export interface DashboardSocketEvents {
  'dashboard:metrics': (data: DashboardMetrics) => void;
  'sensor:reading': (data: SensorReading) => void;
  'system:status': (data: { status: string }) => void;
}

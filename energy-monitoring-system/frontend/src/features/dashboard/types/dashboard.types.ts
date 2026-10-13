/**
 * Dashboard Metrics Response
 */
export interface DashboardMetrics {
  currentEnergy: number;
  currentVoltage: number;
  currentCurrent: number;
  currentPower: number;
  batteryPercentage: number;
  dailyEnergy: number;
  estimatedDailyEnergy: number;
  aiInsight?: string; // AI-generated insight about today's energy performance
  stepCount?: number;
  capacitorVoltage?: number;
  temperature?: number;
  frequency?: number;
  wifiConnected?: boolean;
  bluetoothConnected?: boolean;
  lastUpdate: string;
  activeSensors: number;
  connectedDevices: number;
  
  // Daily aggregates (NEW - from backend /dashboard/metrics)
  todayTotalSteps?: number;      // Total steps accumulated today (delta-based)
  todayMaxVoltage?: number;      // Maximum voltage reading today
  todayPeakPower?: number;       // Peak power reading today
  todayPeakCurrent?: number;     // Peak current reading today
  todayAvgVoltage?: number;      // Average voltage today
  todayAvgPower?: number;        // Average power today
  todayAvgCurrent?: number;      // Average current today
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

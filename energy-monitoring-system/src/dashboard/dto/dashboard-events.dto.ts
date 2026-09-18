/**
 * Dashboard WebSocket Event DTOs
 *
 * Defines data structures for real-time events sent via Socket.IO.
 *
 * Event Categories:
 * - Reading Events: New energy readings
 * - Sensor Events: Sensor status changes
 * - Statistics Events: System statistics updates
 * - Alert Events: Threshold alerts
 */

/**
 * New Reading Event Payload
 *
 * Broadcasted when IoT module receives a new energy reading.
 *
 * Event: 'reading:new'
 * Trigger: IoT controller stores reading
 * Frequency: Every time ESP32 sends data
 */
export class NewReadingEventDto {
  /**
   * Reading ID
   */
  id: string;

  /**
   * Sensor ID
   */
  sensorId: string;

  /**
   * Sensor Name (for display)
   */
  sensorName: string;

  /**
   * Sensor Location (for display)
   */
  sensorLocation: string;

  /**
   * Voltage (V)
   */
  voltage: number;

  /**
   * Current (A)
   */
  current: number;

  /**
   * Power (W)
   */
  power: number;

  /**
   * Energy (kWh)
   */
  energy: number;

  /**
   * Battery Percentage (%)
   */
  batteryPercentage?: number;

  /**
   * Temperature (°C)
   */
  temperature?: number;

  /**
   * Frequency (Hz)
   */
  frequency?: number;

  /**
   * Step Count
   */
  stepCount?: number;

  /**
   * Capacitor Voltage (V)
   */
  capacitorVoltage?: number;

  /**
   * Wi-Fi Connection Status
   */
  wifiConnected?: boolean;

  /**
   * Bluetooth Connection Status
   */
  bluetoothConnected?: boolean;

  /**
   * Timestamp from ESP32
   */
  timestamp: Date;

  /**
   * Received at server
   */
  receivedAt: Date;
}

/**
 * Sensor Update Event Payload
 *
 * Broadcasted when sensor status changes.
 *
 * Event: 'sensor:update'
 * Trigger: Sensor lastSeenAt updated
 * Frequency: Every time sensor sends data
 */
export class SensorUpdateEventDto {
  /**
   * Sensor ID
   */
  id: string;

  /**
   * Sensor Name
   */
  name: string;

  /**
   * Sensor Location
   */
  location: string;

  /**
   * Sensor Status
   */
  status: 'active' | 'inactive' | 'maintenance';

  /**
   * Last Seen At
   */
  lastSeenAt: Date;

  /**
   * Is Active
   */
  isActive: boolean;
}

/**
 * Statistics Update Event Payload
 *
 * Broadcasted periodically with current statistics.
 *
 * Event: 'statistics:update'
 * Trigger: Periodic interval (every 10 seconds)
 * Frequency: Every 10 seconds
 */
export class StatisticsUpdateEventDto {
  /**
   * Total number of readings in system
   */
  totalReadings: number;

  /**
   * Today's total power (W)
   */
  todayTotalPower: number;

  /**
   * Today's average power (W)
   */
  todayAvgPower: number;

  /**
   * Today's estimated energy (kWh)
   */
  todayEstimatedEnergyKWh: number;

  /**
   * Number of active sensors
   */
  activeSensors: number;

  /**
   * Last reading timestamp
   */
  lastReadingAt: Date | null;

  /**
   * Last reading power (W)
   */
  lastReadingPower: number | null;

  /**
   * Updated timestamp
   */
  updatedAt: Date;
}

/**
 * Power Alert Event Payload
 *
 * Broadcasted when power exceeds threshold.
 *
 * Event: 'alert:power'
 * Trigger: Reading power > threshold
 * Frequency: Once per alert (throttled)
 */
export class PowerAlertEventDto {
  /**
   * Alert ID (for tracking)
   */
  alertId: string;

  /**
   * Sensor ID
   */
  sensorId: string;

  /**
   * Sensor Name
   */
  sensorName: string;

  /**
   * Sensor Location
   */
  sensorLocation: string;

  /**
   * Current Power (W)
   */
  power: number;

  /**
   * Threshold Power (W)
   */
  threshold: number;

  /**
   * Alert Message
   */
  message: string;

  /**
   * Alert Timestamp
   */
  timestamp: Date;

  /**
   * Severity Level
   */
  severity: 'warning' | 'critical';
}

/**
 * Sensor Online Event Payload
 *
 * Broadcasted when sensor comes online (first reading after offline).
 *
 * Event: 'sensor:online'
 */
export class SensorOnlineEventDto {
  /**
   * Sensor ID
   */
  sensorId: string;

  /**
   * Sensor Name
   */
  sensorName: string;

  /**
   * Sensor Location
   */
  sensorLocation: string;

  /**
   * Timestamp
   */
  timestamp: Date;
}

/**
 * Sensor Offline Event Payload
 *
 * Broadcasted when sensor hasn't sent data for threshold period.
 *
 * Event: 'sensor:offline'
 */
export class SensorOfflineEventDto {
  /**
   * Sensor ID
   */
  sensorId: string;

  /**
   * Sensor Name
   */
  sensorName: string;

  /**
   * Sensor Location
   */
  sensorLocation: string;

  /**
   * Last Seen At
   */
  lastSeenAt: Date;

  /**
   * Timestamp
   */
  timestamp: Date;
}

/**
 * Connection Authenticated Event Payload
 *
 * Sent to client after successful authentication.
 *
 * Event: 'connection:authenticated'
 */
export class ConnectionAuthenticatedEventDto {
  /**
   * User ID
   */
  userId: string;

  /**
   * User Email
   */
  email: string;

  /**
   * User Role
   */
  role: string;

  /**
   * Connection Timestamp
   */
  connectedAt: Date;

  /**
   * Message
   */
  message: string;
}

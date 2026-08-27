/**
 * Event DTOs for Notification Triggers
 * 
 * Used by EventEmitter to pass data between modules.
 */

/**
 * Energy Milestone Event
 * 
 * Emitted when energy generation reaches a milestone.
 */
export class EnergyMilestoneEvent {
  milestone: number; // Milestone value (100, 500, 1000, 5000)
  totalEnergy: number; // Total energy in Wh
  timestamp: Date;
}

/**
 * Battery Alert Event
 * 
 * Emitted when battery level crosses threshold.
 */
export class BatteryAlertEvent {
  sensorId: string;
  sensorName: string;
  sensorLocation: string;
  batteryLevel: number; // Percentage
  threshold: number; // Threshold crossed
  timestamp: Date;
  alertType: 'low' | 'critical' | 'full';
}

/**
 * Sensor Online Event
 * 
 * Emitted when sensor comes online.
 */
export class SensorOnlineEvent {
  sensorId: string;
  sensorName: string;
  sensorLocation: string;
  timestamp: Date;
}

/**
 * Sensor Offline Event
 * 
 * Emitted when sensor goes offline.
 */
export class SensorOfflineEvent {
  sensorId: string;
  sensorName: string;
  sensorLocation: string;
  lastSeenAt: Date;
  timestamp: Date;
}

/**
 * System Alert Event
 * 
 * Emitted for system-level notifications.
 */
export class SystemAlertEvent {
  alertType: 'startup' | 'shutdown' | 'error' | 'maintenance';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  metadata?: Record<string, any>;
}

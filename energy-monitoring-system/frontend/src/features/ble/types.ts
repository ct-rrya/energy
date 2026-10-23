/**
 * Web Bluetooth Wi-Fi Provisioning Types for EcoStep Harvester
 */

export type BleConnectionState = 
  | 'idle' 
  | 'scanning' 
  | 'connecting' 
  | 'connected' 
  | 'provisioning'
  | 'disconnected' 
  | 'error';

export interface WiFiStatusNotification {
  event: 'wifi_status';
  status: 'CONNECTING' | 'CONNECTED' | 'FAILED';
  ssid?: string;
  ip?: string;
  error?: string;
}

export interface StepTelemetryNotification {
  event: 'step';
  steps?: number;
  voltage?: number;
  energy?: number;
  power?: number;
  freq?: number;
}

export type BleNotificationPayload = WiFiStatusNotification | StepTelemetryNotification | Record<string, unknown>;

export interface BleStatusMessage {
  state: BleConnectionState | 'notification';
  message?: string;
  payload?: BleNotificationPayload;
  type?: 'info' | 'success' | 'error' | 'warning';
}

export interface BleClientConfig {
  serviceUuid: string;
  charWriteUuid: string;
  charNotifyUuid: string;
  deviceName: string;
}

/**
 * EcoStep Web Bluetooth Wi-Fi Provisioning Module
 * Zero external dependencies: Uses standard browser navigator.bluetooth and TextEncoder/TextDecoder.
 * Compatible with Chrome, Edge, and Chromium-based browsers on Desktop and Android.
 */
import type { 
  BleClientConfig, 
  BleStatusMessage, 
  BleNotificationPayload 
} from './types';

export const BLE_CONFIG: BleClientConfig = {
  serviceUuid: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
  charWriteUuid: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
  charNotifyUuid: 'beb5483e-36e1-4688-b7f5-ea07361b26a9',
  deviceName: 'EcoStep-Harvester',
};

// Generic interface for Web Bluetooth objects to avoid strict DOM type library discrepancies
interface BluetoothRemoteGATTServerLike {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServerLike>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<any>;
}

interface BluetoothDeviceLike extends EventTarget {
  name?: string;
  id: string;
  gatt?: BluetoothRemoteGATTServerLike;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

export class EcoStepBleClient {
  public device: BluetoothDeviceLike | null = null;
  public server: BluetoothRemoteGATTServerLike | null = null;
  public writeChar: any = null;
  public notifyChar: any = null;
  private onStatusChange: (status: BleStatusMessage) => void;
  private onNotificationListener: ((event: any) => void) | null = null;
  private onDisconnectListener: (() => void) | null = null;

  constructor(onStatusChange: (status: BleStatusMessage) => void = () => {}) {
    this.onStatusChange = onStatusChange;
  }

  /**
   * Check if Web Bluetooth API is supported and in a secure context.
   */
  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'bluetooth' in (navigator as any)
    );
  }

  /**
   * Check if the page is currently served over HTTPS or localhost (Web Bluetooth requirement).
   */
  public isSecureContext(): boolean {
    if (typeof window === 'undefined') return true;
    if (typeof window.location !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
        return true;
      }
    }
    return window.isSecureContext ?? true;
  }


  /**
   * Check if currently connected to the GATT server.
   */
  public isConnected(): boolean {
    return Boolean(this.server && this.server.connected);
  }

  /**
   * Connect to the EcoStep Harvester device via Web Bluetooth
   */
  public async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error(
        'Web Bluetooth is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Bluefy on iOS.'
      );
    }

    if (!this.isSecureContext()) {
      throw new Error(
        'Web Bluetooth requires a secure context (HTTPS or localhost). Please access over HTTPS.'
      );
    }

    this.onStatusChange({
      state: 'scanning',
      message: `Scanning for ${BLE_CONFIG.deviceName}...`,
      type: 'info',
    });

    try {
      const navBluetooth = (navigator as any).bluetooth;

      // Request device with exact name and service
      this.device = await navBluetooth.requestDevice({
        filters: [{ name: BLE_CONFIG.deviceName }],
        optionalServices: [BLE_CONFIG.serviceUuid],
      });

      if (!this.device) {
        throw new Error('No device selected.');
      }

      // Handle accidental or spontaneous GATT disconnection
      this.onDisconnectListener = () => {
        this.server = null;
        this.writeChar = null;
        this.notifyChar = null;
        this.onStatusChange({
          state: 'disconnected',
          message: 'Device disconnected.',
          type: 'warning',
        });
      };
      this.device.addEventListener('gattserverdisconnected', this.onDisconnectListener);

      this.onStatusChange({
        state: 'connecting',
        message: 'Connecting to device GATT server...',
        type: 'info',
      });

      if (!this.device.gatt) {
        throw new Error('Device does not support GATT connectivity.');
      }

      this.server = await this.device.gatt.connect();

      this.onStatusChange({
        state: 'connecting',
        message: 'Discovering EcoStep provisioning service...',
        type: 'info',
      });

      const service = await this.server.getPrimaryService(BLE_CONFIG.serviceUuid);
      this.writeChar = await service.getCharacteristic(BLE_CONFIG.charWriteUuid);
      this.notifyChar = await service.getCharacteristic(BLE_CONFIG.charNotifyUuid);

      // Subscribe to telemetry and status notifications
      await this.notifyChar.startNotifications();

      this.onNotificationListener = (event: any) => {
        const targetValue = event?.target?.value;
        if (!targetValue) return;

        const decoder = new TextDecoder('utf-8');
        const jsonStr = decoder.decode(targetValue);
        try {
          const payload = JSON.parse(jsonStr) as BleNotificationPayload;
          this.onStatusChange({
            state: 'notification',
            payload,
            message: `Received status update from ${BLE_CONFIG.deviceName}`,
            type: 'info',
          });
        } catch {
          console.warn('Non-JSON BLE payload received:', jsonStr);
        }
      };

      this.notifyChar.addEventListener('characteristicvaluechanged', this.onNotificationListener);

      this.onStatusChange({
        state: 'connected',
        message: `Connected to ${this.device.name || BLE_CONFIG.deviceName}!`,
        type: 'success',
      });

      return true;
    } catch (err: any) {
      this.onStatusChange({
        state: 'error',
        message: err?.message || 'Bluetooth connection cancelled or failed.',
        type: 'error',
      });
      throw err;
    }
  }

  /**
   * Send Wi-Fi credentials to the ESP32 over BLE
   */
  public async sendWiFiCredentials(ssid: string, pass: string): Promise<void> {
    const trimmedSsid = ssid.trim();
    if (!trimmedSsid) {
      throw new Error('Please enter a valid Wi-Fi SSID.');
    }

    if (!this.writeChar || !this.isConnected()) {
      throw new Error('Not connected to EcoStep device via Bluetooth. Please reconnect.');
    }

    this.onStatusChange({
      state: 'provisioning',
      message: `Sending Wi-Fi credentials for "${trimmedSsid}"...`,
      type: 'info',
    });

    const payload = JSON.stringify({
      ssid: trimmedSsid,
      pass: pass || '',
    });

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(payload);

    try {
      // Characteristic writeValueWithResponse or writeValue
      if (typeof this.writeChar.writeValueWithResponse === 'function') {
        await this.writeChar.writeValueWithResponse(encodedData);
      } else {
        await this.writeChar.writeValue(encodedData);
      }

      this.onStatusChange({
        state: 'provisioning',
        message: 'Credentials sent to ESP32! Awaiting connection status...',
        type: 'info',
      });
    } catch (err: any) {
      this.onStatusChange({
        state: 'error',
        message: `Failed to write credentials to device: ${err?.message || 'Unknown error'}`,
        type: 'error',
      });
      throw err;
    }
  }

  /**
   * Disconnect from device and clean up event listeners
   */
  public disconnect(): void {
    if (this.notifyChar && this.onNotificationListener) {
      try {
        this.notifyChar.removeEventListener('characteristicvaluechanged', this.onNotificationListener);
        this.notifyChar.stopNotifications().catch(() => {});
      } catch {
        // Ignored during teardown
      }
    }

    if (this.device && this.onDisconnectListener) {
      try {
        this.device.removeEventListener('gattserverdisconnected', this.onDisconnectListener);
      } catch {
        // Ignored
      }
    }

    if (this.device?.gatt?.connected) {
      try {
        this.device.gatt.disconnect();
      } catch {
        // Ignored
      }
    }

    this.server = null;
    this.writeChar = null;
    this.notifyChar = null;
    this.device = null;

    this.onStatusChange({
      state: 'idle',
      message: 'Bluetooth disconnected.',
      type: 'info',
    });
  }
}

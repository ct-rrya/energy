import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EcoStepBleClient, BLE_CONFIG } from './EcoStepBleClient';

describe('EcoStepBleClient', () => {
  let mockBluetooth: any;
  let mockDevice: any;
  let mockServer: any;
  let mockService: any;
  let mockWriteChar: any;
  let mockNotifyChar: any;
  let statusChangeCallback: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockWriteChar = {
      writeValue: vi.fn().mockResolvedValue(undefined),
      writeValueWithResponse: vi.fn().mockResolvedValue(undefined),
    };

    mockNotifyChar = {
      startNotifications: vi.fn().mockResolvedValue(undefined),
      stopNotifications: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockService = {
      getCharacteristic: vi.fn().mockImplementation((uuid: string) => {
        if (uuid === BLE_CONFIG.charWriteUuid) return Promise.resolve(mockWriteChar);
        if (uuid === BLE_CONFIG.charNotifyUuid) return Promise.resolve(mockNotifyChar);
        return Promise.reject(new Error(`Unknown characteristic ${uuid}`));
      }),
    };

    mockServer = {
      connected: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      getPrimaryService: vi.fn().mockResolvedValue(mockService),
    };
    mockServer.connect.mockImplementation(() => Promise.resolve(mockServer));


    mockDevice = {
      id: 'mock-device-id',
      name: 'EcoStep-Harvester',
      gatt: mockServer,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockBluetooth = {
      requestDevice: vi.fn().mockResolvedValue(mockDevice),
    };

    // Attach mock bluetooth to navigator
    Object.defineProperty(navigator, 'bluetooth', {
      value: mockBluetooth,
      writable: true,
      configurable: true,
    });

    statusChangeCallback = vi.fn();
  });

  it('detects Web Bluetooth support properly', () => {
    const client = new EcoStepBleClient(statusChangeCallback);
    expect(client.isSupported()).toBe(true);

    const originalBluetooth = (navigator as any).bluetooth;
    delete (navigator as any).bluetooth;

    expect(client.isSupported()).toBe(false);

    (navigator as any).bluetooth = originalBluetooth;
  });

  it('connects to EcoStep-Harvester and initializes GATT service & characteristics', async () => {
    const client = new EcoStepBleClient(statusChangeCallback);
    const connected = await client.connect();

    expect(connected).toBe(true);
    expect(mockBluetooth.requestDevice).toHaveBeenCalledWith({
      filters: [{ name: BLE_CONFIG.deviceName }],
      optionalServices: [BLE_CONFIG.serviceUuid],
    });
    expect(mockServer.getPrimaryService).toHaveBeenCalledWith(BLE_CONFIG.serviceUuid);
    expect(mockNotifyChar.startNotifications).toHaveBeenCalled();
    expect(mockNotifyChar.addEventListener).toHaveBeenCalledWith(
      'characteristicvaluechanged',
      expect.any(Function)
    );
    expect(client.isConnected()).toBe(true);
  });

  it('handles incoming wifi_status notification events', async () => {
    const client = new EcoStepBleClient(statusChangeCallback);
    await client.connect();

    // Retrieve notification listener
    const notifyListener = mockNotifyChar.addEventListener.mock.calls.find(
      (call: any[]) => call[0] === 'characteristicvaluechanged'
    )[1];

    expect(notifyListener).toBeDefined();

    // Simulate incoming WiFi status event
    const payload = {
      event: 'wifi_status',
      status: 'CONNECTED',
      ssid: 'CampusNet',
      ip: '192.168.1.100',
    };
    const encoder = new TextEncoder();
    const event = {
      target: {
        value: encoder.encode(JSON.stringify(payload)),
      },
    };

    notifyListener(event);

    expect(statusChangeCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        state: 'notification',
        payload,
      })
    );
  });

  it('sends Wi-Fi credentials formatted as JSON payload', async () => {
    const client = new EcoStepBleClient(statusChangeCallback);
    await client.connect();

    await client.sendWiFiCredentials('TestSSID', 'TestPassword123');

    expect(mockWriteChar.writeValueWithResponse).toHaveBeenCalled();
    const sentBuffer = mockWriteChar.writeValueWithResponse.mock.calls[0][0];
    const decoded = JSON.parse(new TextDecoder().decode(sentBuffer));

    expect(decoded).toEqual({
      ssid: 'TestSSID',
      pass: 'TestPassword123',
    });
  });

  it('validates SSID before sending', async () => {
    const client = new EcoStepBleClient(statusChangeCallback);
    await client.connect();

    await expect(client.sendWiFiCredentials('  ', 'pass')).rejects.toThrow(
      'Please enter a valid Wi-Fi SSID.'
    );
  });

  it('disconnects and cleans up listeners', async () => {
    const client = new EcoStepBleClient(statusChangeCallback);
    await client.connect();

    client.disconnect();

    expect(mockServer.disconnect).toHaveBeenCalled();
    expect(client.isConnected()).toBe(false);
  });
});

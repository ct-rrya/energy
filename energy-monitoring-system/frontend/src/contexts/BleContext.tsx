import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BLE_CONFIG, EcoStepBleClient } from '@/features/ble/EcoStepBleClient';
import { saveWifiSsid } from '@/features/ble/wifiNetworks';
import type {
  BleStatusMessage,
  SavedBleDevice,
  StepTelemetryNotification,
  WiFiStatusNotification,
} from '@/features/ble/types';

export const SAVED_BLE_DEVICE_STORAGE_KEY = 'ecostep_saved_ble_device';

function loadSavedBleDevice(): SavedBleDevice | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SAVED_BLE_DEVICE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === 'string' && typeof parsed.name === 'string') {
      return parsed as SavedBleDevice;
    }
    return null;
  } catch {
    return null;
  }
}

function persistSavedBleDevice(device: SavedBleDevice | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (device) {
      localStorage.setItem(SAVED_BLE_DEVICE_STORAGE_KEY, JSON.stringify(device));
    } else {
      localStorage.removeItem(SAVED_BLE_DEVICE_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export interface BleContextValue {
  isSupported: boolean;
  isSecure: boolean;
  isConnected: boolean;
  isSimulation: boolean;
  isConnecting: boolean;
  isProvisioning: boolean;
  connectedDevice: { id: string; name: string } | null;
  savedDevice: SavedBleDevice | null;
  statusText: string;
  statusType: 'info' | 'success' | 'error' | 'warning';
  wifiStatus: WiFiStatusNotification | null;
  latestTelemetry: StepTelemetryNotification | null;
  connect: () => Promise<boolean>;
  connectSimulated: () => Promise<boolean>;
  reconnectSaved: () => Promise<boolean>;
  sendWiFiCredentials: (ssid: string, pass: string) => Promise<void>;
  disconnect: (customMessage?: string) => void;
  forgetSavedDevice: () => void;
  clearStatus: () => void;
  setStatusMessage: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
}

const BleContext = createContext<BleContextValue | null>(null);

export const BleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const clientRef = useRef<EcoStepBleClient | null>(null);
  const activeSsidRef = useRef<string>('');
  const attemptedAutoRestoreRef = useRef<boolean>(false);

  const [isSupported, setIsSupported] = useState<boolean>(
    () => typeof navigator !== 'undefined' && 'bluetooth' in (navigator as any),
  );
  const [isSecure, setIsSecure] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isSimulation, setIsSimulation] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<{ id: string; name: string } | null>(null);
  const [savedDevice, setSavedDevice] = useState<SavedBleDevice | null>(() => loadSavedBleDevice());
  const [statusText, setStatusText] = useState('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error' | 'warning'>('info');
  const [wifiStatus, setWifiStatus] = useState<WiFiStatusNotification | null>(null);
  const [latestTelemetry, setLatestTelemetry] = useState<StepTelemetryNotification | null>(null);

  // Initialize a single app-wide EcoStepBleClient instance so BLE stays alive across page navigation
  useEffect(() => {
    const client = new EcoStepBleClient((status: BleStatusMessage) => {
      if (status.message) {
        setStatusText(status.message);
      }
      if (status.type) {
        setStatusType(status.type);
      }

      if (status.state === 'connected') {
        const deviceInfo = client.isSimulation
          ? { id: 'ecostep-demo-device', name: `${BLE_CONFIG.deviceName} (Demo)` }
          : {
              id: client.device?.id || BLE_CONFIG.deviceName,
              name: client.device?.name || BLE_CONFIG.deviceName,
            };

        setIsConnecting(false);
        setIsConnected(true);
        setIsSimulation(client.isSimulation);
        setConnectedDevice(deviceInfo);

        if (!status.message) {
          setStatusText(`Connection with ESP32 (${deviceInfo.name}) was successful!`);
        }
        setStatusType('success');

        if (!client.isSimulation) {
          setSavedDevice((prev) => {
            const next: SavedBleDevice = {
              id: deviceInfo.id,
              name: deviceInfo.name,
              lastConnectedAt: new Date().toISOString(),
              lastSsid: prev?.lastSsid,
            };
            persistSavedBleDevice(next);
            return next;
          });
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('ecostep:hardware-connected', { detail: { source: 'ble' } }),
          );
        }
      } else if (status.state === 'disconnected' || status.state === 'idle') {
        setIsConnecting(false);
        setIsProvisioning(false);
        setIsConnected(false);
        setIsSimulation(false);
        setConnectedDevice(null);
        if (status.state === 'disconnected' && typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('ecostep:hardware-disconnected', { detail: { source: 'ble' } }),
          );
        }
      } else if (status.state === 'error') {
        setIsConnecting(false);
        setIsProvisioning(false);
      }

      if (status.state === 'notification' && status.payload) {
        const payload = status.payload as any;
        if (payload.event === 'wifi_status') {
          const wifiEvt = payload as WiFiStatusNotification;
          setWifiStatus(wifiEvt);
          if (wifiEvt.status === 'CONNECTING') {
            setIsProvisioning(true);
            setStatusText(
              `ESP32 is attempting to connect to "${wifiEvt.ssid || activeSsidRef.current}"...`,
            );
            setStatusType('info');
          } else if (wifiEvt.status === 'CONNECTED') {
            setIsProvisioning(false);
            setStatusText(
              `Successfully connected to Wi-Fi! Assigned IP: ${wifiEvt.ip || '192.168.1.xxx'}`,
            );
            setStatusType('success');

            const confirmedSsid = (wifiEvt.ssid || activeSsidRef.current || '').trim();
            if (confirmedSsid) {
              saveWifiSsid(confirmedSsid);
              setSavedDevice((prev) => {
                if (!prev) return prev;
                const next = { ...prev, lastSsid: confirmedSsid };
                persistSavedBleDevice(next);
                return next;
              });
            }
          } else if (wifiEvt.status === 'FAILED') {
            setIsProvisioning(false);
            setStatusText(
              `Wi-Fi connection failed: ${wifiEvt.error || 'Please check SSID and password'}`,
            );
            setStatusType('error');
          }
        } else if (payload.event === 'step') {
          setLatestTelemetry(payload as StepTelemetryNotification);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('ecostep:hardware-connected', {
                detail: {
                  source: 'ble',
                  reading: {
                    power: payload.power,
                    voltage: payload.voltage,
                    current: payload.current,
                    energy: payload.energy,
                    stepCount: payload.stepCount ?? payload.steps,
                    timestamp: payload.timestamp || new Date().toISOString(),
                  },
                },
              }),
            );
          }
        }
      }
    });

    clientRef.current = client;
    setIsSupported(client.isSupported());
    setIsSecure(client.isSecureContext());

    // Best-effort silent restore after full page reload if browser supports getDevices()
    const existingSaved = loadSavedBleDevice();
    if (existingSaved && !attemptedAutoRestoreRef.current) {
      attemptedAutoRestoreRef.current = true;
      void client.reconnectSavedDevice(existingSaved.id);
    }

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, []);

  const connect = useCallback(async () => {
    if (!clientRef.current) return false;
    setIsConnecting(true);
    setStatusText('');
    try {
      return await clientRef.current.connect();
    } catch {
      setIsConnecting(false);
      return false;
    }
  }, []);

  const connectSimulated = useCallback(async () => {
    if (!clientRef.current) return false;
    setIsConnecting(true);
    setStatusText('');
    try {
      return await clientRef.current.connectSimulated();
    } catch {
      setIsConnecting(false);
      return false;
    }
  }, []);

  const reconnectSaved = useCallback(async () => {
    if (!clientRef.current) return false;
    setIsConnecting(true);
    setStatusText('');
    const restored = await clientRef.current.reconnectSavedDevice(savedDevice?.id);
    if (restored) {
      return true;
    }
    // Browser requires user gesture picker when silent getDevices() is unavailable
    try {
      return await clientRef.current.connect();
    } catch {
      setIsConnecting(false);
      return false;
    }
  }, [savedDevice?.id]);

  const sendWiFiCredentials = useCallback(async (ssid: string, pass: string) => {
    if (!clientRef.current) return;
    const trimmedSsid = ssid.trim();
    activeSsidRef.current = trimmedSsid;
    if (trimmedSsid) {
      saveWifiSsid(trimmedSsid);
      setSavedDevice((prev) => {
        if (!prev) return prev;
        const next = { ...prev, lastSsid: trimmedSsid };
        persistSavedBleDevice(next);
        return next;
      });
    }
    setIsProvisioning(true);
    try {
      await clientRef.current.sendWiFiCredentials(trimmedSsid, pass);
    } catch {
      setIsProvisioning(false);
    }
  }, []);

  const disconnect = useCallback((customMessage?: string) => {
    clientRef.current?.disconnect();
    setIsConnected(false);
    setIsSimulation(false);
    setIsConnecting(false);
    setIsProvisioning(false);
    setConnectedDevice(null);
    setWifiStatus(null);
    setLatestTelemetry(null);
    if (customMessage) {
      setStatusText(customMessage);
      setStatusType('info');
    }
  }, []);

  const forgetSavedDevice = useCallback(() => {
    setSavedDevice(null);
    persistSavedBleDevice(null);
  }, []);

  const clearStatus = useCallback(() => {
    setStatusText('');
    setWifiStatus(null);
    setLatestTelemetry(null);
  }, []);

  const setStatusMessage = useCallback(
    (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
      setStatusText(message);
      setStatusType(type);
    },
    [],
  );

  const value = useMemo<BleContextValue>(
    () => ({
      isSupported,
      isSecure,
      isConnected,
      isSimulation,
      isConnecting,
      isProvisioning,
      connectedDevice,
      savedDevice,
      statusText,
      statusType,
      wifiStatus,
      latestTelemetry,
      connect,
      connectSimulated,
      reconnectSaved,
      sendWiFiCredentials,
      disconnect,
      forgetSavedDevice,
      clearStatus,
      setStatusMessage,
    }),
    [
      isSupported,
      isSecure,
      isConnected,
      isSimulation,
      isConnecting,
      isProvisioning,
      connectedDevice,
      savedDevice,
      statusText,
      statusType,
      wifiStatus,
      latestTelemetry,
      connect,
      connectSimulated,
      reconnectSaved,
      sendWiFiCredentials,
      disconnect,
      forgetSavedDevice,
      clearStatus,
      setStatusMessage,
    ],
  );

  return <BleContext.Provider value={value}>{children}</BleContext.Provider>;
};

export function useBle(): BleContextValue {
  const ctx = useContext(BleContext);
  if (!ctx) {
    throw new Error('useBle must be used within a BleProvider');
  }
  return ctx;
}

export function useOptionalBle(): BleContextValue | null {
  return useContext(BleContext);
}

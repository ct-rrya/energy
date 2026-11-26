import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { QueryClientContext } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { useSocket } from './SocketContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { SensorReading } from '@/features/dashboard/types/dashboard.types';

const LIVE_SYNC_QUERY_KEYS = [
  ['dashboard'],
  ['analytics'],
  ['timeSeries'],
  ['rawReadings'],
  ['milestones'],
  ['sensor'],
  ['sensors'],
  ['energy'],
  ['reports'],
  ['logs'],
] as const;

const LIVE_SYNC_THROTTLE_MS = 1500;
const SAFETY_POLL_INTERVAL_MS = 8000;

export type HardwareConnectionStatus = 'waiting' | 'connected' | 'disconnected';

export interface HardwareStatusContextValue {
  status: HardwareConnectionStatus;
  statusLabel: string;
  shortStatusLabel: string;
  statusDescription: string;
  dotColor: string;
  pulseColor?: string;
  statusClass: string;
  lastReading: SensorReading | undefined;
  lastSeenAt: Date | null;
  hasEverConnected: boolean;
  isHardwareConnected: boolean;
  markHardwareConnected: (reading?: Partial<SensorReading>) => void;
  markHardwareDisconnected: () => void;
  refreshStatus: () => Promise<void>;
}

const DEFAULT_STATUS_CONFIG = {
  waiting: {
    label: 'Idle',
    shortLabel: 'Idle',
    description:
      'No recent footstep activity received. The tile only sends data when stepped on, so Idle means either no recent footsteps or the tile is powered off.',
    dotColor: 'bg-[#F59E0B]',
    pulseColor: undefined,
    statusClass: 'status-waiting status-standby',
  },
  connected: {
    label: 'Live',
    shortLabel: 'Live',
    description:
      'Footstep readings are actively streaming from the piezoelectric tile.',
    dotColor: 'bg-[#3ED98A]',
    pulseColor: 'bg-[#3ED98A]',
    statusClass: 'status-connected status-online',
  },
  disconnected: {
    label: 'Connection Lost',
    shortLabel: 'Offline',
    description:
      'Unable to reach the live EcoStep server. Trying to reconnect automatically.',
    dotColor: 'bg-[#EF4444]',
    pulseColor: undefined,
    statusClass: 'status-disconnected status-offline',
  },
};

export const HardwareStatusContext = createContext<HardwareStatusContextValue>({
  status: 'waiting',
  statusLabel: DEFAULT_STATUS_CONFIG.waiting.label,
  shortStatusLabel: DEFAULT_STATUS_CONFIG.waiting.shortLabel,
  statusDescription: DEFAULT_STATUS_CONFIG.waiting.description,
  dotColor: DEFAULT_STATUS_CONFIG.waiting.dotColor,
  pulseColor: undefined,
  statusClass: DEFAULT_STATUS_CONFIG.waiting.statusClass,
  lastReading: undefined,
  lastSeenAt: null,
  hasEverConnected: false,
  isHardwareConnected: false,
  markHardwareConnected: () => {},
  markHardwareDisconnected: () => {},
  refreshStatus: async () => {},
});

const TIMEOUT_MS = 60_000; // 60 seconds without a footstep reading returns to Standby
const SESSION_STORAGE_KEY = 'ecostep_hardware_has_connected';

export function HardwareStatusProvider({ children }: { children: React.ReactNode }) {
  const { socket, isConnected: isSocketConnected } = useSocket();
  const queryClient = useContext(QueryClientContext);
  const [hasEverConnected, setHasEverConnected] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [status, setStatus] = useState<HardwareConnectionStatus>('waiting');
  const [lastReading, setLastReading] = useState<SensorReading | undefined>(undefined);
  const [lastSeenAt, setLastSeenAt] = useState<Date | null>(null);

  const lastSeenMsRef = useRef<number | null>(null);
  const latestReadingTsRef = useRef<number>(0);
  const lastRealtimePushMsRef = useRef<number>(0);
  const lastSyncMsRef = useRef<number>(0);
  const pendingSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBleConnectedRef = useRef<boolean>(false);
  const hadSocketConnectionRef = useRef<boolean>(false);
  const statusRef = useRef<HardwareConnectionStatus>(status);
  statusRef.current = status;
  const hasEverConnectedRef = useRef<boolean>(hasEverConnected);
  hasEverConnectedRef.current = hasEverConnected;

  // Global app-wide cache invalidator (leading + trailing throttle) so ALL pages auto-update
  const scheduleLiveSync = useCallback(() => {
    if (!queryClient) return;

    const runInvalidation = () => {
      lastSyncMsRef.current = Date.now();
      for (const queryKey of LIVE_SYNC_QUERY_KEYS) {
        void queryClient.invalidateQueries({ queryKey: [...queryKey] });
      }
    };

    const elapsed = Date.now() - lastSyncMsRef.current;
    if (elapsed >= LIVE_SYNC_THROTTLE_MS) {
      if (pendingSyncTimerRef.current) {
        clearTimeout(pendingSyncTimerRef.current);
        pendingSyncTimerRef.current = null;
      }
      runInvalidation();
    } else if (!pendingSyncTimerRef.current) {
      pendingSyncTimerRef.current = setTimeout(() => {
        pendingSyncTimerRef.current = null;
        runInvalidation();
      }, LIVE_SYNC_THROTTLE_MS - elapsed);
    }
  }, [queryClient]);

  useEffect(() => {
    return () => {
      if (pendingSyncTimerRef.current) {
        clearTimeout(pendingSyncTimerRef.current);
        pendingSyncTimerRef.current = null;
      }
    };
  }, []);

  const markHardwareConnected = useCallback((readingData?: Partial<SensorReading>) => {
    const now = Date.now();
    lastSeenMsRef.current = now;
    setLastSeenAt(new Date(now));
    setHasEverConnected(true);
    setStatus('connected');

    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    } catch {
      // Ignore sessionStorage exceptions
    }

    if (readingData) {
      setLastReading((prev) => ({
        sensorId: readingData.sensorId ?? prev?.sensorId ?? '',
        voltage: readingData.voltage ?? prev?.voltage ?? 0,
        current: readingData.current ?? prev?.current ?? 0,
        power: readingData.power ?? prev?.power ?? 0,
        energy: readingData.energy ?? prev?.energy ?? 0,
        stepCount: readingData.stepCount ?? prev?.stepCount ?? 0,
        timestamp: readingData.timestamp ?? new Date().toISOString(),
      }));
    }
  }, []);

  const markHardwareDisconnected = useCallback(() => {
    setStatus('disconnected');
  }, []);

  // Check initial state from REST API on mount
  const checkInitialHardwareState = useCallback(async () => {
    try {
      const response = await apiClient.get<any[]>('/energy/recent', {
        params: { limit: 1 },
      });
      const readings = response.data;
      if (readings && readings.length > 0) {
        const latest = readings[0];
        const timestamp = new Date(latest.timestamp).getTime();
        const ageMs = Date.now() - timestamp;
        if (Number.isFinite(timestamp) && timestamp > latestReadingTsRef.current) {
          latestReadingTsRef.current = timestamp;
        }

        const formattedReading: SensorReading = {
          sensorId: latest.sensorId || '',
          voltage: latest.voltage || 0,
          current: latest.current || 0,
          power: latest.power || 0,
          energy: latest.energy || 0,
          stepCount: latest.stepCount || 0,
          timestamp: new Date(latest.timestamp).toISOString(),
        };

        if (ageMs <= TIMEOUT_MS) {
          lastSeenMsRef.current = timestamp;
          setLastSeenAt(new Date(timestamp));
          setLastReading(formattedReading);
          setHasEverConnected(true);
          setStatus('connected');
          try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
          } catch {}
          return;
        }

        // Reading is older than 60s — tile only sends on footsteps, so this is normal Standby
        setLastReading(formattedReading);
        setStatus('waiting');
        return;
      }

      // No readings found yet — server responded cleanly, so tile is in Standby
      setStatus('waiting');
    } catch {
      // Backend API request failed — connection to server is lost
      setStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    checkInitialHardwareState();
  }, [checkInitialHardwareState]);

  // Firebase Firestore real-time listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let initialSnapshotSeen = false;

    try {
      const unsubscribe = onSnapshot(
        doc(db, 'liveReadings', 'latest'),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const rawTs = data.timestamp;
            const parsedMs = rawTs ? new Date(rawTs).getTime() : NaN;
            const isFresh = Number.isFinite(parsedMs) && Date.now() - parsedMs <= TIMEOUT_MS;
            const isNewerReading =
              Number.isFinite(parsedMs) && parsedMs > latestReadingTsRef.current;

            const reading: SensorReading = {
              sensorId: data.sensorId || '',
              voltage: data.voltage || 0,
              current: data.current || 0,
              power: data.power || 0,
              energy: data.energy || 0,
              stepCount: data.stepCount || 0,
              timestamp: Number.isFinite(parsedMs) ? new Date(parsedMs).toISOString() : new Date().toISOString(),
            };

            if (isNewerReading) {
              latestReadingTsRef.current = parsedMs;
            }

            if (isFresh) {
              markHardwareConnected(reading);
            } else {
              // Historical Firestore snapshot (>60s old): keep latest reading cached without marking Live
              setLastReading(reading);
            }

            if (initialSnapshotSeen && isNewerReading) {
              lastRealtimePushMsRef.current = Date.now();
              scheduleLiveSync();
            }
            initialSnapshotSeen = true;
          }
        },
        (error) => {
          console.warn('[HardwareStatus] Firestore listener notice:', error.message);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('[HardwareStatus] Firestore setup skipped:', e);
    }
  }, [markHardwareConnected, scheduleLiveSync]);

  // Socket.IO real-time telemetry listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewReading = (data: any) => {
      const tsStr = data.timestamp || new Date().toISOString();
      const parsedMs = new Date(tsStr).getTime();
      if (Number.isFinite(parsedMs) && parsedMs > latestReadingTsRef.current) {
        latestReadingTsRef.current = parsedMs;
      }
      lastRealtimePushMsRef.current = Date.now();

      markHardwareConnected({
        sensorId: data.sensorId,
        voltage: data.voltage,
        current: data.current,
        power: data.power,
        energy: data.energy,
        stepCount: data.stepCount,
        timestamp: tsStr,
      });
      scheduleLiveSync();
    };

    const handleHardwareActivity = () => {
      lastRealtimePushMsRef.current = Date.now();
      markHardwareConnected();
      scheduleLiveSync();
    };

    socket.on('reading:new', handleNewReading);
    socket.on('piezo:trigger', handleHardwareActivity);
    socket.on('piezo:milestone', handleHardwareActivity);
    socket.on('capacitor:full', handleHardwareActivity);

    return () => {
      socket.off('reading:new', handleNewReading);
      socket.off('piezo:trigger', handleHardwareActivity);
      socket.off('piezo:milestone', handleHardwareActivity);
      socket.off('capacitor:full', handleHardwareActivity);
    };
  }, [socket, markHardwareConnected, scheduleLiveSync]);

  // Lightweight 8-second safety poll: catches new cloud readings automatically even if Socket.IO or Firestore is idle/stale
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pollLatestReading = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      if (Date.now() - lastRealtimePushMsRef.current < SAFETY_POLL_INTERVAL_MS) {
        return;
      }

      try {
        const response = await apiClient.get<any[]>('/energy/recent', {
          params: { limit: 1 },
        });
        const readings = response.data;
        if (!readings || readings.length === 0) return;

        const latest = readings[0];
        const parsedMs = new Date(latest.timestamp).getTime();
        if (!Number.isFinite(parsedMs)) return;

        if (parsedMs > latestReadingTsRef.current) {
          latestReadingTsRef.current = parsedMs;
          const formattedReading: SensorReading = {
            sensorId: latest.sensorId || '',
            voltage: latest.voltage || 0,
            current: latest.current || 0,
            power: latest.power || 0,
            energy: latest.energy || 0,
            stepCount: latest.stepCount || 0,
            timestamp: new Date(parsedMs).toISOString(),
          };

          if (Date.now() - parsedMs <= TIMEOUT_MS) {
            markHardwareConnected(formattedReading);
          } else {
            setLastReading(formattedReading);
          }
          scheduleLiveSync();
        }
      } catch {
        // Ignore transient safety poll errors
      }
    };

    const interval = setInterval(() => {
      void pollLatestReading();
    }, SAFETY_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [markHardwareConnected, scheduleLiveSync]);

  // Listen for custom hardware events (e.g. from Web BLE client or simulator)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCustomConnected = (e: any) => {
      if (e.detail?.source === 'ble') {
        isBleConnectedRef.current = true;
      }
      markHardwareConnected(e.detail?.reading);
    };

    const handleCustomDisconnected = (e: any) => {
      if (!e.detail?.source || e.detail?.source === 'ble') {
        isBleConnectedRef.current = false;
      }
      markHardwareDisconnected();
    };

    window.addEventListener('ecostep:hardware-connected', handleCustomConnected);
    window.addEventListener('ecostep:hardware-disconnected', handleCustomDisconnected);

    return () => {
      window.removeEventListener('ecostep:hardware-connected', handleCustomConnected);
      window.removeEventListener('ecostep:hardware-disconnected', handleCustomDisconnected);
    };
  }, [markHardwareConnected, markHardwareDisconnected]);

  // Idle check timer: Returns Live -> Idle if no footstep reading received for > 60s (unless BLE GATT is actively connected)
  useEffect(() => {
    const interval = setInterval(() => {
      if (statusRef.current === 'connected' && !isBleConnectedRef.current) {
        const lastSeen = lastSeenMsRef.current;
        if (lastSeen && Date.now() - lastSeen > TIMEOUT_MS) {
          console.log('[HardwareStatus] No footsteps for >60s -> Idle');
          setStatus('waiting');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Track real Socket.IO server connectivity: only mark Connection Lost when an established server socket drops
  useEffect(() => {
    if (isSocketConnected) {
      hadSocketConnectionRef.current = true;
      if (statusRef.current === 'disconnected') {
        const lastSeen = lastSeenMsRef.current;
        const isFresh = lastSeen !== null && Date.now() - lastSeen <= TIMEOUT_MS;
        setStatus(isFresh ? 'connected' : 'waiting');
      }
    } else if (hadSocketConnectionRef.current && !isBleConnectedRef.current) {
      setStatus('disconnected');
    }
  }, [isSocketConnected]);

  const config = DEFAULT_STATUS_CONFIG[status];

  const value = useMemo<HardwareStatusContextValue>(() => ({
    status,
    statusLabel: config.label,
    shortStatusLabel: config.shortLabel,
    statusDescription: config.description,
    dotColor: config.dotColor,
    pulseColor: config.pulseColor,
    statusClass: config.statusClass,
    lastReading,
    lastSeenAt,
    hasEverConnected,
    isHardwareConnected: status === 'connected',
    markHardwareConnected,
    markHardwareDisconnected,
    refreshStatus: checkInitialHardwareState,
  }), [status, config, lastReading, lastSeenAt, hasEverConnected, markHardwareConnected, markHardwareDisconnected, checkInitialHardwareState]);

  return (
    <HardwareStatusContext.Provider value={value}>
      {children}
    </HardwareStatusContext.Provider>
  );
}

export function useHardwareStatus() {
  return useContext(HardwareStatusContext);
}


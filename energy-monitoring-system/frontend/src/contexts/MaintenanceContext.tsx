import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_MAINTENANCE_STATE,
  maintenanceService,
  type MaintenanceState,
  type UpdateMaintenancePayload,
} from '@/api/services/maintenance.service';
import { useSocket } from './SocketContext';

export interface MaintenanceContextValue {
  state: MaintenanceState;
  isLoading: boolean;
  isUpdating: boolean;
  refresh: () => Promise<void>;
  updateMaintenance: (payload: UpdateMaintenancePayload) => Promise<MaintenanceState>;
  resumeNormalOperation: () => Promise<MaintenanceState>;
}

const MaintenanceContext = createContext<MaintenanceContextValue>({
  state: DEFAULT_MAINTENANCE_STATE,
  isLoading: false,
  isUpdating: false,
  refresh: async () => {},
  updateMaintenance: async () => DEFAULT_MAINTENANCE_STATE,
  resumeNormalOperation: async () => DEFAULT_MAINTENANCE_STATE,
});

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const [state, setState] = useState<MaintenanceState>(DEFAULT_MAINTENANCE_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    try {
      const next = await maintenanceService.getMaintenanceState();
      setState(next);
    } catch {
      // Keep last known state if backend is momentarily unreachable
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        void refresh();
      }
    }, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Real-time Socket.IO listener so enabling or clicking Resume updates every tab instantly
  useEffect(() => {
    if (!socket) return;

    const handleMaintenanceUpdate = (incoming: MaintenanceState) => {
      if (incoming && typeof incoming.enabled === 'boolean') {
        setState(incoming);
      } else {
        void refresh();
      }
    };

    const handleReconnect = () => {
      void refresh();
    };

    socket.on('maintenance:updated', handleMaintenanceUpdate);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('maintenance:updated', handleMaintenanceUpdate);
      socket.off('connect', handleReconnect);
    };
  }, [socket, refresh]);

  const updateMaintenance = useCallback(
    async (payload: UpdateMaintenancePayload): Promise<MaintenanceState> => {
      setIsUpdating(true);
      try {
        const updated = await maintenanceService.updateMaintenanceState(payload);
        setState(updated);
        return updated;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  const resumeNormalOperation = useCallback(async (): Promise<MaintenanceState> => {
    return updateMaintenance({ enabled: false, estimatedResumeAt: null });
  }, [updateMaintenance]);

  const value = useMemo<MaintenanceContextValue>(
    () => ({
      state,
      isLoading,
      isUpdating,
      refresh,
      updateMaintenance,
      resumeNormalOperation,
    }),
    [state, isLoading, isUpdating, refresh, updateMaintenance, resumeNormalOperation],
  );

  return (
    <MaintenanceContext.Provider value={value}>
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  return useContext(MaintenanceContext);
}

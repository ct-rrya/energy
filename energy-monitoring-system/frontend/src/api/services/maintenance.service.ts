import apiClient from '../client';

export interface MaintenanceState {
  enabled: boolean;
  message: string;
  estimatedResumeAt: string | null;
  updatedBy: string | null;
  updatedAt: string;
}

export interface UpdateMaintenancePayload {
  enabled: boolean;
  message?: string;
  estimatedResumeAt?: string | null;
}

export const DEFAULT_MAINTENANCE_STATE: MaintenanceState = {
  enabled: false,
  message: 'Scheduled floor mat wiring inspection and calibration in progress.',
  estimatedResumeAt: null,
  updatedBy: null,
  updatedAt: new Date(0).toISOString(),
};

export async function getMaintenanceState(): Promise<MaintenanceState> {
  const response = await apiClient.get<{ success: boolean; data: MaintenanceState }>(
    '/maintenance',
  );
  return response.data?.data ?? DEFAULT_MAINTENANCE_STATE;
}

export async function updateMaintenanceState(
  payload: UpdateMaintenancePayload,
): Promise<MaintenanceState> {
  const response = await apiClient.patch<{
    success: boolean;
    message?: string;
    data: MaintenanceState;
  }>('/maintenance', payload);
  return response.data?.data ?? DEFAULT_MAINTENANCE_STATE;
}

export const maintenanceService = {
  getMaintenanceState,
  updateMaintenanceState,
};

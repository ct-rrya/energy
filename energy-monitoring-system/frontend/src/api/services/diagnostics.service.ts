import apiClient from '../client';
import type {
  ReferenceConfig,
  DiagnosticHistoryResponse,
  CreateReferenceConfigRequest,
  RecordDiagnosticTestRequest,
  DiagnosticBaseline,
  RecordStepTestRequest,
  StepTestResult,
  DailyDiagnosticTask,
  CompleteDailyDiagnosticRequest,
  CompleteDailyDiagnosticResponse,
} from '@/types/diagnostic.types';

/**
 * Diagnostics API Service
 * 
 * Handles all system diagnostics-related API calls including
 * reference configuration, automatic baseline, and step tests.
 */

/**
 * Get Automatic Baseline
 * 
 * Retrieves the 30-day historical baseline of footstep energy.
 */
export const getBaseline = async (): Promise<DiagnosticBaseline> => {
  const response = await apiClient.get<DiagnosticBaseline>('/diagnostics/baseline');
  return response.data;
};

/**
 * Record Step Diagnostic Test
 * 
 * Records a single footstep on-demand test.
 */
export const recordStepTest = async (
  data: RecordStepTestRequest
): Promise<StepTestResult> => {
  const response = await apiClient.post<StepTestResult>('/diagnostics/test-step', data);
  return response.data;
};

/**
 * Create or Update Reference Configuration
 * 
 * Creates or updates the reference configuration used for diagnostic tests.
 * 
 * @param data - Reference configuration data
 * @returns Updated reference configuration
 */
export const createOrUpdateReference = async (
  data: CreateReferenceConfigRequest
): Promise<ReferenceConfig> => {
  const response = await apiClient.post<ReferenceConfig>('/diagnostics/reference', data);
  return response.data;
};

/**
 * Get Reference Configuration
 * 
 * Retrieves the current reference configuration.
 * 
 * @returns Current reference configuration or null if not set
 */
export const getReferenceConfig = async (): Promise<ReferenceConfig | null> => {
  const response = await apiClient.get<ReferenceConfig | null>('/diagnostics/reference');
  return response.data;
};

/**
 * Record Diagnostic Test
 * 
 * Records a new diagnostic test result based on actual energy measurement.
 * 
 * @param data - Diagnostic test data including actual energy and optional notes
 * @returns Recorded diagnostic test with analysis results
 */
export const recordDiagnosticTest = async (
  data: RecordDiagnosticTestRequest
): Promise<any> => {
  const response = await apiClient.post('/diagnostics/test', data);
  return response.data;
};

/**
 * Get Diagnostic History
 * 
 * Retrieves paginated diagnostic test history.
 * 
 * @param page - Page number (1-based)
 * @param limit - Number of items per page
 * @returns Paginated diagnostic test history
 */
export const getDiagnosticHistory = async (
  page: number,
  limit: number
): Promise<DiagnosticHistoryResponse> => {
  const response = await apiClient.get<DiagnosticHistoryResponse>('/diagnostics/history', {
    params: { page, limit },
  });
  return response.data;
};

/**
 * Get Today's Shared Daily Diagnostic Task
 */
export const getTodayDailyTask = async (): Promise<DailyDiagnosticTask> => {
  const response = await apiClient.get<DailyDiagnosticTask>('/diagnostics/daily-task/today');
  return response.data;
};

/**
 * Start Daily Diagnostic Session (Lock for Active Admin)
 */
export const startDailySession = async (): Promise<DailyDiagnosticTask> => {
  const response = await apiClient.post<DailyDiagnosticTask>('/diagnostics/daily-task/start-session');
  return response.data;
};

/**
 * Cancel Daily Diagnostic Session (Release Lock)
 */
export const cancelDailySession = async (): Promise<DailyDiagnosticTask> => {
  const response = await apiClient.post<DailyDiagnosticTask>('/diagnostics/daily-task/cancel-session');
  return response.data;
};

/**
 * Complete Daily Diagnostic Task
 */
export const completeDailyTask = async (
  data: CompleteDailyDiagnosticRequest
): Promise<CompleteDailyDiagnosticResponse> => {
  const response = await apiClient.post<CompleteDailyDiagnosticResponse>('/diagnostics/daily-task/complete', data);
  return response.data;
};

/**
 * Get Daily Diagnostic Task History
 */
export const getDailyTaskHistory = async (
  limit: number = 30
): Promise<DailyDiagnosticTask[]> => {
  const response = await apiClient.get<DailyDiagnosticTask[]>('/diagnostics/daily-task/history', {
    params: { limit },
  });
  return response.data;
};

/**
 * Diagnostics Service Object
 * 
 * Centralized object for all diagnostics API calls.
 */
export const diagnosticsService = {
  getBaseline,
  recordStepTest,
  createOrUpdateReference,
  getReferenceConfig,
  recordDiagnosticTest,
  getDiagnosticHistory,
  getTodayDailyTask,
  startDailySession,
  cancelDailySession,
  completeDailyTask,
  getDailyTaskHistory,
};

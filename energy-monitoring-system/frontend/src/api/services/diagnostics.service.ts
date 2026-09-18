import apiClient from '../client';
import type {
  ReferenceConfig,
  DiagnosticHistoryResponse,
  CreateReferenceConfigRequest,
  RecordDiagnosticTestRequest,
} from '@/types/diagnostic.types';

/**
 * Diagnostics API Service
 * 
 * Handles all system diagnostics-related API calls including
 * reference configuration and diagnostic test recording.
 */

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
 * Diagnostics Service Object
 * 
 * Centralized object for all diagnostics API calls.
 */
export const diagnosticsService = {
  createOrUpdateReference,
  getReferenceConfig,
  recordDiagnosticTest,
  getDiagnosticHistory,
};

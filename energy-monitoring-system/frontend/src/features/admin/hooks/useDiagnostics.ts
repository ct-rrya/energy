import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { diagnosticsService } from '@/api/services';
import type {
  ReferenceConfig,
  DiagnosticHistoryResponse,
  CreateReferenceConfigRequest,
  RecordDiagnosticTestRequest,
  DiagnosticTest,
} from '@/types/diagnostic.types';

/**
 * Query Keys for Diagnostics
 */
const DIAGNOSTICS_KEYS = {
  all: ['diagnostics'] as const,
  referenceConfig: ['diagnostics', 'referenceConfig'] as const,
  history: (page: number, limit: number) =>
    ['diagnostics', 'history', page, limit] as const,
};

/**
 * Use Reference Config Hook
 * 
 * Fetches the current reference configuration for diagnostic tests.
 * Returns null if no configuration has been set yet.
 * 
 * @returns Query result with reference configuration or null
 */
export function useReferenceConfig() {
  return useQuery<ReferenceConfig | null>({
    queryKey: DIAGNOSTICS_KEYS.referenceConfig,
    queryFn: diagnosticsService.getReferenceConfig,
    staleTime: 10 * 60 * 1000, // 10 minutes (configuration changes infrequently)
    refetchOnWindowFocus: false,
  });
}

/**
 * Use Create Reference Config Hook
 * 
 * Mutation hook for creating or updating the reference configuration.
 * Automatically invalidates and refetches the reference config query on success.
 * 
 * @returns Mutation result for creating/updating reference configuration
 */
export function useCreateReferenceConfig() {
  const queryClient = useQueryClient();

  return useMutation<ReferenceConfig, Error, CreateReferenceConfigRequest>({
    mutationFn: diagnosticsService.createOrUpdateReference,
    onSuccess: (data) => {
      // Invalidate and refetch reference config
      queryClient.invalidateQueries({
        queryKey: DIAGNOSTICS_KEYS.referenceConfig,
      });

      // Update cache optimistically
      queryClient.setQueryData(DIAGNOSTICS_KEYS.referenceConfig, data);
    },
  });
}

/**
 * Use Diagnostic History Hook
 * 
 * Fetches paginated diagnostic test history.
 * Results are sorted by date in descending order (newest first).
 * 
 * @param page - Page number (default: 1)
 * @param limit - Number of tests per page (default: 20)
 * @returns Query result with paginated diagnostic test history
 */
export function useDiagnosticHistory(page: number = 1, limit: number = 20) {
  return useQuery<DiagnosticHistoryResponse>({
    queryKey: DIAGNOSTICS_KEYS.history(page, limit),
    queryFn: () => diagnosticsService.getDiagnosticHistory(page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData, // Keep previous page data while fetching new page
  });
}

/**
 * Use Record Diagnostic Test Hook
 * 
 * Mutation hook for recording a new diagnostic test.
 * Automatically invalidates and refetches diagnostic history on success.
 * 
 * @returns Mutation result for recording diagnostic test
 */
export function useRecordDiagnosticTest() {
  const queryClient = useQueryClient();

  return useMutation<DiagnosticTest, Error, RecordDiagnosticTestRequest>({
    mutationFn: diagnosticsService.recordDiagnosticTest,
    onSuccess: () => {
      // Invalidate all history queries to refetch with new test
      queryClient.invalidateQueries({
        queryKey: ['diagnostics', 'history'],
      });
    },
  });
}

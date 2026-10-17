import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { diagnosticsService } from '@/api/services';
import type {
  ReferenceConfig,
  DiagnosticHistoryResponse,
  CreateReferenceConfigRequest,
  RecordDiagnosticTestRequest,
  DiagnosticTest,
  DiagnosticBaseline,
  RecordStepTestRequest,
  StepTestResult,
  DailyDiagnosticTask,
  CompleteDailyDiagnosticRequest,
  CompleteDailyDiagnosticResponse,
} from '@/types/diagnostic.types';

/**
 * Query Keys for Diagnostics
 */
const DIAGNOSTICS_KEYS = {
  all: ['diagnostics'] as const,
  referenceConfig: ['diagnostics', 'referenceConfig'] as const,
  baseline: ['diagnostics', 'baseline'] as const,
  todayDailyTask: ['diagnostics', 'dailyTask', 'today'] as const,
  dailyTaskHistory: (limit: number) =>
    ['diagnostics', 'dailyTask', 'history', limit] as const,
  history: (page: number, limit: number) =>
    ['diagnostics', 'history', page, limit] as const,
};

/**
 * Use Diagnostic Baseline Hook
 * 
 * Fetches the 30-day historical baseline metrics.
 */
export function useDiagnosticBaseline() {
  return useQuery<DiagnosticBaseline>({
    queryKey: DIAGNOSTICS_KEYS.baseline,
    queryFn: diagnosticsService.getBaseline,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

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

/**
 * Use Record Step Test Hook
 * 
 * Mutation hook for recording an on-demand footstep test.
 */
export function useRecordStepTest() {
  const queryClient = useQueryClient();

  return useMutation<StepTestResult, Error, RecordStepTestRequest>({
    mutationFn: diagnosticsService.recordStepTest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['diagnostics', 'history'],
      });
      queryClient.invalidateQueries({
        queryKey: DIAGNOSTICS_KEYS.baseline,
      });
    },
  });
}

/**
 * Use Today's Daily Task Hook
 */
export function useTodayDailyTask() {
  return useQuery<DailyDiagnosticTask>({
    queryKey: DIAGNOSTICS_KEYS.todayDailyTask,
    queryFn: diagnosticsService.getTodayDailyTask,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 15 * 1000, // Periodically poll every 15s in addition to WebSockets
  });
}

/**
 * Use Daily Task History Hook
 */
export function useDailyTaskHistory(limit: number = 30) {
  return useQuery<DailyDiagnosticTask[]>({
    queryKey: DIAGNOSTICS_KEYS.dailyTaskHistory(limit),
    queryFn: () => diagnosticsService.getDailyTaskHistory(limit),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Use Start Daily Session Hook (Lock)
 */
export function useStartDailySession() {
  const queryClient = useQueryClient();

  return useMutation<DailyDiagnosticTask, Error>({
    mutationFn: diagnosticsService.startDailySession,
    onSuccess: (data) => {
      queryClient.setQueryData(DIAGNOSTICS_KEYS.todayDailyTask, data);
      queryClient.invalidateQueries({
        queryKey: DIAGNOSTICS_KEYS.todayDailyTask,
      });
    },
  });
}

/**
 * Use Cancel Daily Session Hook (Unlock)
 */
export function useCancelDailySession() {
  const queryClient = useQueryClient();

  return useMutation<DailyDiagnosticTask, Error>({
    mutationFn: diagnosticsService.cancelDailySession,
    onSuccess: (data) => {
      queryClient.setQueryData(DIAGNOSTICS_KEYS.todayDailyTask, data);
      queryClient.invalidateQueries({
        queryKey: DIAGNOSTICS_KEYS.todayDailyTask,
      });
    },
  });
}

/**
 * Use Complete Daily Diagnostic Task Hook
 */
export function useCompleteDailyTask() {
  const queryClient = useQueryClient();

  return useMutation<
    CompleteDailyDiagnosticResponse,
    Error,
    CompleteDailyDiagnosticRequest
  >({
    mutationFn: diagnosticsService.completeDailyTask,
    onSuccess: (data) => {
      queryClient.setQueryData(DIAGNOSTICS_KEYS.todayDailyTask, data.task);
      queryClient.invalidateQueries({
        queryKey: DIAGNOSTICS_KEYS.todayDailyTask,
      });
      queryClient.invalidateQueries({
        queryKey: ['diagnostics', 'dailyTask', 'history'],
      });
      queryClient.invalidateQueries({
        queryKey: ['diagnostics', 'history'],
      });
      queryClient.invalidateQueries({
        queryKey: DIAGNOSTICS_KEYS.baseline,
      });
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsService } from '@/api/services';
import { showToast } from '@/components/common/Toast';

/**
 * Use Alert Actions Hook
 * 
 * Provides mutations for acknowledging and resolving alerts.
 * 
 * @returns Mutation functions and states
 */
export function useAlertActions() {
  const queryClient = useQueryClient();

  /**
   * Acknowledge Alert Mutation
   */
  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: string) => alertsService.acknowledgeAlert(alertId),
    onSuccess: () => {
      // Invalidate alerts queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      showToast('Alert acknowledged successfully', 'success');
    },
    onError: (error: any) => {
      showToast(
        error?.response?.data?.message || 'Failed to acknowledge alert',
        'error'
      );
    },
  });

  /**
   * Resolve Alert Mutation
   */
  const resolveMutation = useMutation({
    mutationFn: (alertId: string) => alertsService.resolveAlert(alertId),
    onSuccess: () => {
      // Invalidate alerts queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      showToast('Alert resolved successfully', 'success');
    },
    onError: (error: any) => {
      showToast(
        error?.response?.data?.message || 'Failed to resolve alert',
        'error'
      );
    },
  });

  return {
    acknowledgeAlert: acknowledgeMutation.mutate,
    isAcknowledging: acknowledgeMutation.isPending,
    resolveAlert: resolveMutation.mutate,
    isResolving: resolveMutation.isPending,
  };
}

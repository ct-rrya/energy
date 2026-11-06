import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { milestonesService } from '@/api/services';
import type {
  MilestonesResponse,
  UpdateMonthTargetsPayload,
} from '../types/milestone.types';
import { formatMonthLabel } from '../utils/milestone.utils';

export function useMilestones(monthProp?: string) {
  const queryClient = useQueryClient();
  const [internalMonth, setInternalMonth] = useState<string | undefined>(monthProp);

  // Sync internal state when external monthProp changes
  useEffect(() => {
    if (monthProp !== undefined) {
      setInternalMonth(monthProp);
    }
  }, [monthProp]);

  // Controlled mode takes precedence; otherwise fallback to internal state
  const activeMonth = monthProp !== undefined ? monthProp : internalMonth;

  const query = useQuery<MilestonesResponse>({
    queryKey: ['milestones', activeMonth],
    queryFn: () => milestonesService.getMilestones(activeMonth),
    staleTime: 30000,
    refetchInterval: 45000, // Poll periodically for updates
  });

  const updateTargetsMutation = useMutation({
    mutationFn: (payload: UpdateMonthTargetsPayload) =>
      milestonesService.updateTargets(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });

  const data = query.data;
  const currentMonthKey = data?.currentMonth;
  const effectiveMonth = activeMonth || data?.yearMonth || currentMonthKey;

  const policy = data?.configurationPolicy;

  return {
    yearMonth: data?.yearMonth || effectiveMonth,
    monthLabel: data?.monthLabel || (effectiveMonth ? formatMonthLabel(effectiveMonth) : 'Current Month'),
    monthlyMilestone: data?.monthlyMilestone,
    weeklyMilestones: data?.weeklyMilestones ?? [],
    milestones: data?.milestones ?? [],
    availableMonths: data?.availableMonths ?? ['2026-10', '2026-11'],
    currentMonth: data?.currentMonth,
    selectedMonth: effectiveMonth,
    setSelectedMonth: setInternalMonth,
    allTimeEnergyMWh: data?.allTimeEnergyMWh ?? (data?.allTimeEnergyWh ? data.allTimeEnergyWh * 1000 : 0),
    allTimeEnergyWh: data?.allTimeEnergyWh ?? 0,
    allTimeSteps: data?.allTimeSteps ?? 0,
    lastUpdated: data?.lastUpdated,
    configurationPolicy: policy,
    isConfigured: data?.isConfigured ?? policy?.isConfigured ?? false,
    isLocked: policy?.isLocked ?? false,
    status: policy?.status,
    deadlineLabel: policy?.deadlineLabel,
    overdueMonths: data?.overdueMonths ?? policy?.overdueMonths ?? [],
    hasOverdue: data?.hasOverdue ?? policy?.hasOverdue ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateTargets: updateTargetsMutation.mutateAsync,
    isUpdatingTargets: updateTargetsMutation.isPending,
  };
}

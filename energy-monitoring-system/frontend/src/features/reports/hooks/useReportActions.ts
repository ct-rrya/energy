import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsService } from '@/api/services';
import { showToast } from '@/components/common/Toast';
import type { GenerateReportDto } from '@/types/report.types';

/**
 * Use Report Actions Hook
 * 
 * Provides mutations for generating, downloading, and deleting reports.
 * 
 * @returns Mutation functions and states
 */
export function useReportActions() {
  const queryClient = useQueryClient();

  /**
   * Generate Report Mutation
   */
  const generateMutation = useMutation({
    mutationFn: (dto: GenerateReportDto) => reportsService.generateReport(dto),
    onSuccess: () => {
      // Invalidate reports queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      showToast('Report generated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(
        error?.response?.data?.message || 'Failed to generate report',
        'error'
      );
    },
  });

  /**
   * Download Report Mutation
   */
  const downloadMutation = useMutation({
    mutationFn: ({ id, fileName }: { id: string; fileName: string }) =>
      reportsService.downloadReport(id, fileName),
    onSuccess: () => {
      showToast('Report downloaded successfully', 'success');
      // Invalidate to update download count
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error: any) => {
      showToast(
        error?.response?.data?.message || 'Failed to download report',
        'error'
      );
    },
  });

  /**
   * Delete Report Mutation
   */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportsService.deleteReport(id),
    onSuccess: () => {
      // Invalidate reports queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      showToast('Report deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(
        error?.response?.data?.message || 'Failed to delete report',
        'error'
      );
    },
  });

  return {
    generateReport: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    downloadReport: downloadMutation.mutate,
    isDownloading: downloadMutation.isPending,
    deleteReport: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

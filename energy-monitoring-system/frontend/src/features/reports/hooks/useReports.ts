import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/api/services';
import type { ReportType, ReportFormat } from '@/types/report.types';

/**
 * Use Reports Hook
 * 
 * Fetches user's reports with pagination and filters using TanStack Query.
 * 
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param type - Filter by report type (optional)
 * @param format - Filter by format (optional)
 * @returns Query result with reports data
 */
export function useReports(
  page: number = 1,
  limit: number = 10,
  type?: ReportType,
  format?: ReportFormat
) {
  return useQuery({
    queryKey: ['reports', page, limit, type, format],
    queryFn: () => reportsService.getReports(page, limit, type, format),
    staleTime: 60 * 1000, // 1 minute
  });
}

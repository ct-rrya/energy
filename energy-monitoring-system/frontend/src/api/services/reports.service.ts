import apiClient from '../client';
import type {
  Report,
  GenerateReportDto,
  ReportsListResponse,
  AvailableReportTypesResponse,
  ReportType,
  ReportFormat,
} from '@/types/report.types';

/**
 * Reports API Service
 * 
 * Handles all report-related API calls.
 */

/**
 * Generate Report
 * 
 * Creates a new report and returns metadata.
 * 
 * @param dto - Report generation parameters
 * @returns Generated report metadata
 */
export const generateReport = async (dto: GenerateReportDto): Promise<Report> => {
  const response = await apiClient.post<{ data: Report }>('/reports/generate', dto);
  return response.data.data;
};

/**
 * Get Reports List
 * 
 * Fetches user's reports with pagination and filters.
 * 
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param type - Filter by report type (optional)
 * @param format - Filter by format (optional)
 * @returns Paginated reports list
 */
export const getReports = async (
  page: number = 1,
  limit: number = 10,
  type?: ReportType,
  format?: ReportFormat
): Promise<ReportsListResponse> => {
  const params: any = { page, limit };
  if (type) params.type = type;
  if (format) params.format = format;

  const response = await apiClient.get<ReportsListResponse>('/reports', { params });
  return response.data;
};

/**
 * Get Report Details
 * 
 * Fetches detailed metadata for a specific report.
 * 
 * @param id - Report ID
 * @returns Report details
 */
export const getReportById = async (id: string): Promise<Report> => {
  const response = await apiClient.get<{ data: Report }>(`/reports/${id}`);
  return response.data.data;
};

/**
 * Download Report
 * 
 * Downloads the report file.
 * 
 * @param id - Report ID
 * @param fileName - File name for download
 */
export const downloadReport = async (id: string, fileName: string): Promise<void> => {
  const response = await apiClient.get(`/reports/${id}/download`, {
    responseType: 'blob',
  });

  // Determine content type from file extension
  const extension = fileName.split('.').pop()?.toLowerCase();
  let mimeType = 'application/octet-stream';
  
  if (extension === 'pdf') {
    mimeType = 'application/pdf';
  } else if (extension === 'xlsx' || extension === 'xls') {
    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else if (extension === 'csv') {
    mimeType = 'text/csv';
  }

  // Create a blob URL with proper MIME type and trigger download
  const blob = new Blob([response.data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // Clean up after a short delay to ensure download starts
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Delete Report
 * 
 * Deletes a report and its file.
 * 
 * @param id - Report ID
 * @returns Deleted report info
 */
export const deleteReport = async (id: string): Promise<{ id: string; fileName: string }> => {
  const response = await apiClient.delete<{ data: { id: string; fileName: string } }>(
    `/reports/${id}`
  );
  return response.data.data;
};

/**
 * Get Available Report Types
 * 
 * Fetches information about available report types and formats.
 * 
 * @returns Available report types and formats
 */
export const getAvailableReportTypes = async (): Promise<AvailableReportTypesResponse> => {
  const response = await apiClient.get<{ data: AvailableReportTypesResponse }>(
    '/reports/types/available'
  );
  return response.data.data;
};

/**
 * Reports Service Object
 * 
 * Centralized object for all report API calls.
 */
export const reportsService = {
  generateReport,
  getReports,
  getReportById,
  downloadReport,
  deleteReport,
  getAvailableReportTypes,
};

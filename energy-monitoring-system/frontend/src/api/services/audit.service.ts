import apiClient from '../client';

export interface AuditLogItem {
  id: string;
  _id?: string;
  administratorId: string;
  administratorName: string;
  administratorRole: string;
  category?: string;
  module?: string;
  event?: string;
  action: string;
  target?: string;
  targetType?: string;
  details?: Record<string, any>;
  result: 'SUCCESS' | 'FAILED' | 'DENIED' | 'success' | 'failure' | 'partial';
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  timestamp: string;
}

export interface AuditCategoryCounts {
  all: number;
  authentication: number;
  reports: number;
  milestones: number;
  diagnostics: number;
}

export interface AuditLogsResponse {
  logs: AuditLogItem[];
  total: number;
  limit: number;
  skip: number;
  counts?: AuditCategoryCounts;
}

export interface QueryAuditLogsParams {
  administratorId?: string;
  adminId?: string;
  administratorRole?: string;
  category?: string;
  module?: string;
  action?: string;
  event?: string;
  result?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
}

export interface AuditMetaResponse {
  administrators: Array<{
    id?: string;
    administratorId: string;
    name?: string;
    administratorName: string;
    role?: string;
    administratorRole: string;
  }>;
  modules: string[];
  categories?: string[];
  counts?: AuditCategoryCounts;
}

export const auditService = {
  getLogs: async (params?: QueryAuditLogsParams): Promise<AuditLogsResponse> => {
    try {
      const response = await apiClient.get<AuditLogsResponse>('/logs', { params });
      return response.data;
    } catch {
      // Fallback to /audit/logs
      const fallback = await apiClient.get<AuditLogsResponse>('/audit/logs', { params });
      return fallback.data;
    }
  },

  getRecentLogs: async (limit: number = 20): Promise<{ logs: AuditLogItem[] }> => {
    const response = await apiClient.get<{ logs: AuditLogItem[] }>('/audit/logs/recent', { params: { limit } });
    return response.data;
  },

  getMetadata: async (): Promise<AuditMetaResponse> => {
    const response = await apiClient.get<AuditMetaResponse>('/audit/meta');
    return response.data;
  },

  exportCsv: async (params?: QueryAuditLogsParams): Promise<Blob> => {
    const response = await apiClient.get('/audit/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  recordPageView: async (pageName: string, path: string): Promise<void> => {
    try {
      await apiClient.post('/audit/page-view', { pageName, path });
    } catch {
      // Non-blocking silently fail if network or session issues occur
    }
  },
};

import apiClient from '../client';

export interface AuditLogItem {
  id: string;
  administratorId: string;
  administratorName: string;
  administratorRole: string;
  action: string;
  target?: string;
  targetType?: string;
  details?: Record<string, any>;
  result: 'success' | 'failure' | 'partial';
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuditLogsResponse {
  logs: AuditLogItem[];
  total: number;
  limit: number;
  skip: number;
}

export interface QueryAuditLogsParams {
  administratorId?: string;
  action?: string;
  result?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
}

export const auditService = {
  getLogs: async (params?: QueryAuditLogsParams): Promise<AuditLogsResponse> => {
    const response = await apiClient.get<AuditLogsResponse>('/audit/logs', { params });
    return response.data;
  },
  getRecentLogs: async (limit: number = 20): Promise<{ logs: AuditLogItem[] }> => {
    const response = await apiClient.get<{ logs: AuditLogItem[] }>('/audit/logs/recent', { params: { limit } });
    return response.data;
  },
};


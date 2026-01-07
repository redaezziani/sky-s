import { axiosInstance } from '@/lib/utils';

export enum LogType {
  ACTIVITY = 'activity',
  ERROR = 'error',
  COMBINED = 'combined',
}

export enum LogAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  CANCEL = 'CANCEL',
  REFUND = 'REFUND',
  RESTORE = 'RESTORE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  action?: LogAction;
  entity?: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  context?: string;
  stack?: string;
}

export interface LogsQuery {
  page?: number;
  limit?: number;
  type?: LogType;
  date?: string;
  search?: string;
  userId?: string;
  action?: LogAction;
  entity?: string;
  entityId?: string;
}

export interface PaginatedLogsResponse {
  data: LogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface LogStats {
  date: string;
  totalLogs: number;
  activityLogs: number;
  errorLogs: number;
  actionBreakdown: Record<string, number>;
  entityBreakdown: Record<string, number>;
  userBreakdown: Record<string, number>;
}

export const logsApi = {
  /**
   * Get logs with pagination and filtering
   */
  async getLogs(query: LogsQuery): Promise<PaginatedLogsResponse> {
    const params = new URLSearchParams();

    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.type) params.append('type', query.type);
    if (query.date) params.append('date', query.date);
    if (query.search) params.append('search', query.search);
    if (query.userId) params.append('userId', query.userId);
    if (query.action) params.append('action', query.action);
    if (query.entity) params.append('entity', query.entity);
    if (query.entityId) params.append('entityId', query.entityId);

    const response = await axiosInstance.get<PaginatedLogsResponse>(`/logs?${params.toString()}`);
    return response.data;
  },

  /**
   * Get available log dates
   */
  async getAvailableDates(type?: LogType): Promise<string[]> {
    const params = type ? `?type=${type}` : '';
    const response = await axiosInstance.get<string[]>(`/logs/dates${params}`);
    return response.data;
  },

  /**
   * Get log statistics for a specific date
   */
  async getLogStats(date?: string): Promise<LogStats> {
    const params = date ? `?date=${date}` : '';
    const response = await axiosInstance.get<LogStats>(`/logs/stats${params}`);
    return response.data;
  },
};

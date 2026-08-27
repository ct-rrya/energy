import { Server, Database, Wifi, Clock } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { StatusBadge } from './StatusBadge';
import type { SystemStatus } from '../types/dashboard.types';

/**
 * System Status Card Props
 */
interface SystemStatusCardProps {
  status: SystemStatus;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

/**
 * System Status Card Component
 * Displays system health and connectivity status
 */
export function SystemStatusCard({
  status,
  isLoading,
  error,
  onRetry,
}: SystemStatusCardProps) {
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <DashboardCard
      title="System Status"
      subtitle="Backend connectivity and health"
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    >
      <div className="space-y-4">
        {/* API Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
              <Server className="h-5 w-5 text-primary-600" />
            </div>
            <span className="font-medium text-neutral-900">API Server</span>
          </div>
          <StatusBadge status={status.api} label="API" showIcon={false} />
        </div>

        {/* Database Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <span className="font-medium text-neutral-900">Database</span>
          </div>
          <StatusBadge status={status.database} label="DB" showIcon={false} />
        </div>

        {/* WebSocket Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-50">
              <Wifi className="h-5 w-5 text-secondary-600" />
            </div>
            <span className="font-medium text-neutral-900">WebSocket</span>
          </div>
          <StatusBadge status={status.websocket} label="WS" showIcon={false} />
        </div>

        {/* Uptime */}
        <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50">
              <Clock className="h-5 w-5 text-accent-600" />
            </div>
            <span className="font-medium text-neutral-900">Uptime</span>
          </div>
          <span className="text-sm font-semibold text-neutral-700">
            {formatUptime(status.uptime)}
          </span>
        </div>
      </div>
    </DashboardCard>
  );
}

import { RefreshCw } from 'lucide-react';
import { ConnectionIndicator } from './ConnectionIndicator';
import { formatDateTime, cn } from '@/lib/utils';
import type { ConnectionStatus } from '../types/dashboard.types';

/**
 * Page Header Props
 */
interface PageHeaderProps {
  title: string;
  lastUpdated?: string;
  websocketStatus: ConnectionStatus;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

/**
 * Page Header Component
 * Dashboard page header with title, status, and actions
 */
export function PageHeader({
  title,
  lastUpdated,
  websocketStatus,
  onRefresh,
  isRefreshing,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Title and Update Time */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-800">{title}</h1>
        {lastUpdated && (
          <p className="mt-2 text-sm font-medium text-neutral-600">
            Last updated: {formatDateTime(lastUpdated)}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <ConnectionIndicator status={websocketStatus} />
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl glass border border-primary-500/30 px-5 py-2.5 text-sm font-semibold text-primary-600 hover:bg-primary-50 hover:border-primary-500 active:bg-primary-100 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
            aria-label="Refresh dashboard"
          >
            <RefreshCw
              className={cn(
                'h-4 w-4',
                isRefreshing && 'animate-spin'
              )}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>
    </div>
  );
}

import { Activity, AlertTriangle, FileText, Radio } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { getRelativeTime } from '@/lib/utils';
import type { ActivityItem } from '../types/dashboard.types';

/**
 * Recent Activity Card Props
 */
interface RecentActivityCardProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

/**
 * Recent Activity Card Component
 * Displays recent system activities and events
 */
export function RecentActivityCard({
  activities,
  isLoading,
  error,
  onRetry,
}: RecentActivityCardProps) {
  const isEmpty = activities.length === 0 && !isLoading && !error;

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'sensor':
        return Radio;
      case 'reading':
        return Activity;
      case 'alert':
        return AlertTriangle;
      case 'report':
        return FileText;
      default:
        return Activity;
    }
  };

  const getSeverityColor = (severity?: ActivityItem['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-gradient-to-br from-[rgb(var(--color-error-500))] to-[rgb(var(--color-error-600))]';
      case 'warning':
        return 'bg-gradient-to-br from-[rgb(var(--color-warning-500))] to-[rgb(var(--color-warning-600))]';
      case 'info':
      default:
        return 'bg-gradient-to-br from-[#428475] to-[#89D7B7]';
    }
  };

  return (
    <DashboardCard
      title="Recent Activity"
      subtitle="Latest system events"
      isLoading={isLoading}
      isEmpty={isEmpty}
      error={error}
      onRetry={onRetry}
    >
      <div className="space-y-3">
        {activities.slice(0, 5).map((activity) => {
          const Icon = getActivityIcon(activity.type);
          const colorClass = getSeverityColor(activity.severity);

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-lg bg-white/40 dark:bg-[#1A312C]/30 border border-white/60 dark:border-[#89D7B7]/8 p-3 transition-all hover:shadow-md hover:bg-white/60 dark:hover:bg-[#1A312C]/50"
            >
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg shadow-sm ${colorClass}`}>
                <Icon className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A312C] dark:text-[#89D7B7] line-clamp-2">
                  {activity.message}
                </p>
                <p className="mt-1 text-xs text-[rgb(var(--color-neutral-500))]">
                  {getRelativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}

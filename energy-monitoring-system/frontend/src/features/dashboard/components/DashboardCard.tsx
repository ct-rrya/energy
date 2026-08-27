import type { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

/**
 * Dashboard Card Props
 */
interface DashboardCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Dashboard Card Component
 * Reusable card container with loading, empty, and error states
 */
export function DashboardCard({
  title,
  subtitle,
  actions,
  children,
  isLoading,
  isEmpty,
  error,
  onRetry,
  className,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white/72 dark:bg-[#1A312C]/60 border border-white/70 dark:border-[#89D7B7]/12 shadow-md p-6',
        className
      )}
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1A312C] dark:text-[#89D7B7] tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1.5 text-sm font-medium text-[rgb(var(--color-neutral-600))]">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Content States */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(239,68,68,0.1)]">
            <AlertCircle className="h-7 w-7 text-[rgb(var(--color-error-600))]" strokeWidth={2} />
          </div>
          <p className="mb-2 text-sm font-semibold text-[#1A312C] dark:text-[#89D7B7]">
            Error loading data
          </p>
          <p className="mb-5 text-xs text-[rgb(var(--color-neutral-600))] max-w-xs">
            {error}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-[#1A312C] dark:bg-[#428475] text-[#FFF4E1] font-semibold hover:bg-[#428475] dark:hover:bg-[#89D7B7] transition-all duration-200 shadow-md"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={2} />
              <span>Retry</span>
            </button>
          )}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 text-5xl">📊</div>
          <p className="text-sm font-semibold text-[#1A312C] dark:text-[#89D7B7]">
            No data available
          </p>
          <p className="mt-1.5 text-xs text-[rgb(var(--color-neutral-500))] max-w-xs">
            Data will appear here once available
          </p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Stat Card Props
 */
interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  isLoading?: boolean;
}

/**
 * Stat Card Component - Premium Glassmorphic Design
 * Displays a single statistic with icon, value, and optional trend
 */
export function StatCard({
  icon: Icon,
  title,
  value,
  unit,
  trend,
  variant = 'default',
  isLoading,
}: StatCardProps) {
  const variants = {
    default: {
      iconBg: 'bg-gradient-to-br from-[rgb(var(--color-secondary-400))] to-[rgb(var(--color-secondary-500))]',
      badge: 'bg-[rgba(66,132,117,0.1)] text-[rgb(var(--color-secondary-700))] border-[rgba(66,132,117,0.2)]',
    },
    success: {
      iconBg: 'bg-gradient-to-br from-[rgb(var(--color-accent-400))] to-[rgb(var(--color-accent-500))]',
      badge: 'bg-[rgba(137,215,183,0.15)] text-[rgb(var(--color-accent-700))] border-[rgba(137,215,183,0.3)]',
    },
    warning: {
      iconBg: 'bg-gradient-to-br from-[rgb(var(--color-warning-500))] to-[rgb(var(--color-warning-600))]',
      badge: 'bg-[rgba(234,179,8,0.1)] text-[rgb(var(--color-warning-700))] border-[rgba(234,179,8,0.2)]',
    },
    danger: {
      iconBg: 'bg-gradient-to-br from-[rgb(var(--color-error-500))] to-[rgb(var(--color-error-600))]',
      badge: 'bg-[rgba(239,68,68,0.1)] text-[rgb(var(--color-error-700))] border-[rgba(239,68,68,0.2)]',
    },
    info: {
      iconBg: 'bg-gradient-to-br from-[rgb(var(--color-info-500))] to-[rgb(var(--color-info-600))]',
      badge: 'bg-[rgba(59,130,246,0.1)] text-[rgb(var(--color-info-700))] border-[rgba(59,130,246,0.2)]',
    },
  };

  const TrendIcon =
    trend?.direction === 'up'
      ? TrendingUp
      : trend?.direction === 'down'
      ? TrendingDown
      : Minus;

  return (
    <div className="metric-card">
      {/* Icon Badge and Trend */}
      <div className="mb-5 flex items-start justify-between">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-[0.875rem] shadow-md transition-transform duration-200 hover:scale-105',
            variants[variant].iconBg
          )}
        >
          <Icon className="h-6 w-6 text-white" strokeWidth={2} />
        </div>
        {trend && !isLoading && (
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold',
              variants[variant].badge
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Title - Uppercase Label */}
      <div className="metric-label mb-2">{title}</div>

      {/* Value with Unit */}
      {isLoading ? (
        <div className="h-9 w-32 animate-pulse rounded-lg bg-white/50" />
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="metric-value-large">{value}</span>
          {unit && (
            <span className="text-base font-medium text-[rgb(var(--color-neutral-500))]">
              {unit}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

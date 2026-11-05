import { ChartLoadingState } from './ChartLoadingState';

interface ChartCardSkeletonProps {
  title?: string;
  subtitle?: string;
  height?: number | string;
  className?: string;
}

/**
 * ChartCardSkeleton Component
 * 
 * Renders an instant, theme-aware skeleton card while dynamic chart bundles
 * (Recharts / SVG engines) are deferred and loaded asynchronously.
 * Prevents layout shift (CLS) and allows the browser to hit Largest Contentful Paint (LCP)
 * immediately in <300ms.
 */
export function ChartCardSkeleton({
  title,
  subtitle,
  height = 280,
  className = '',
}: ChartCardSkeletonProps) {
  return (
    <div
      className={`cd flex flex-col justify-between h-full w-full min-w-0 ${className}`}
      style={{
        borderRadius: '22px',
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        boxShadow: 'var(--shadow)',
        padding: '16px 20px',
        boxSizing: 'border-box',
      }}
      role="status"
      aria-label="Loading chart..."
    >
      {/* Header Skeleton */}
      <div
        className="chart-container-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pb-2.5 mb-2.5"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div className="flex-1 min-w-0">
          <div className="chart-title-row flex items-center gap-2 mb-1">
            {title ? (
              <h3
                className="font-semibold tracking-tight"
                style={{ fontSize: '16px', color: 'var(--t)', marginBottom: 0 }}
              >
                {title}
              </h3>
            ) : (
              <div className="h-5 w-44 rounded-md bg-black/6 dark:bg-white/10 animate-pulse" />
            )}
          </div>
          {subtitle ? (
            <p
              className="chart-subtitle text-xs sm:text-sm leading-snug line-clamp-2"
              style={{ color: 'var(--mu)', minHeight: '36px' }}
            >
              {subtitle}
            </p>
          ) : (
            <div className="h-3.5 w-64 max-w-full rounded bg-black/4 dark:bg-white/5 animate-pulse mt-1" />
          )}
        </div>

        {/* Filter buttons placeholder */}
        <div className="w-full sm:w-auto flex items-center gap-1.5 opacity-60">
          <div className="h-7 w-16 rounded-full bg-black/4 dark:bg-white/5 animate-pulse" />
          <div className="h-7 w-16 rounded-full bg-black/4 dark:bg-white/5 animate-pulse" />
        </div>
      </div>

      {/* Content Chart Graph Skeleton */}
      <div className="w-full min-w-0 pt-1 pb-0 flex-1 flex flex-col justify-end">
        <ChartLoadingState height={height} />
      </div>
    </div>
  );
}


import { cn } from '@/lib/utils';

/**
 * Card Skeleton Props
 */
interface CardSkeletonProps {
  className?: string;
  rows?: number;
  hasHeader?: boolean;
  hasActions?: boolean;
}

/**
 * Card Skeleton Component
 * 
 * Reusable loading skeleton for card-based layouts.
 * 
 * Features:
 * - Configurable number of content rows
 * - Optional header skeleton
 * - Optional action buttons skeleton
 * - Pulse animation
 * 
 * @example
 * <CardSkeleton rows={3} hasHeader hasActions />
 */
export function CardSkeleton({
  className,
  rows = 3,
  hasHeader = false,
  hasActions = false,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg border border-neutral-200 bg-white p-6',
        className
      )}
    >
      {/* Header */}
      {hasHeader && (
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-32 rounded bg-neutral-200" />
          <div className="h-4 w-20 rounded bg-neutral-200" />
        </div>
      )}

      {/* Content Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div
              className={cn(
                'h-4 rounded bg-neutral-200',
                i % 2 === 0 ? 'w-full' : 'w-5/6'
              )}
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      {hasActions && (
        <div className="mt-4 flex gap-2">
          <div className="h-9 w-24 rounded bg-neutral-200" />
          <div className="h-9 w-20 rounded bg-neutral-200" />
        </div>
      )}
    </div>
  );
}

/**
 * Grid Skeleton Component
 * 
 * Displays a grid of card skeletons.
 * 
 * @example
 * <GridSkeleton count={6} columns={3} />
 */
interface GridSkeletonProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  rows?: number;
  hasHeader?: boolean;
  hasActions?: boolean;
}

export function GridSkeleton({
  count = 6,
  columns = 3,
  rows = 3,
  hasHeader = false,
  hasActions = false,
}: GridSkeletonProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-6', gridCols[columns])}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton
          key={i}
          rows={rows}
          hasHeader={hasHeader}
          hasActions={hasActions}
        />
      ))}
    </div>
  );
}

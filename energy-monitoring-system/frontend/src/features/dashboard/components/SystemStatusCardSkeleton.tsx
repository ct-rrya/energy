/**
 * System Status Card Skeleton Component
 * 
 * Loading skeleton for SystemStatusCard with pulse animation.
 * Maintains the three-column grid layout structure to prevent layout shift.
 * 
 * Features:
 * - Matches SystemStatusCard dimensions and padding
 * - Three indicator skeletons in grid layout
 * - Pulse animation for visual feedback
 * - Responsive layout (3-col desktop, 1-col mobile)
 * - Theme-aware styling
 * 
 * Requirements: 3.8, 10.2
 * 
 * @component
 * @example
 * ```tsx
 * <SystemStatusCardSkeleton />
 * ```
 */
export function SystemStatusCardSkeleton() {
  return (
    <div 
      className="eco-card"
      style={{
        padding: '24px',
      }}
      aria-busy="true"
      aria-label="Loading system status"
    >
      {/* Title skeleton */}
      <div 
        className="animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded"
        style={{
          height: '24px',
          width: '150px',
          marginBottom: '24px',
        }}
      />

      {/* Status indicators grid */}
      <div 
        className="grid grid-cols-1 sm:grid-cols-3"
        style={{
          gap: '16px',
        }}
      >
        {/* Three status indicator skeletons */}
        {[1, 2, 3].map((index) => (
          <div key={index} className="flex items-start gap-3">
            {/* Status dot skeleton */}
            <div 
              className="animate-pulse bg-neutral-300 dark:bg-neutral-600 rounded-full flex-shrink-0 mt-1"
              style={{
                width: '8px',
                height: '8px',
              }}
            />
            
            <div className="flex-1 min-w-0 space-y-2">
              {/* Label skeleton */}
              <div 
                className="animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded"
                style={{
                  height: '14px',
                  width: '70%',
                }}
              />
              
              {/* Value skeleton */}
              <div 
                className="animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded"
                style={{
                  height: '12px',
                  width: '50%',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

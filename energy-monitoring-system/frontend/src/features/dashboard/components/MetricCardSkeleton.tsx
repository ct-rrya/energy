/**
 * Metric Card Skeleton Component
 * 
 * Loading skeleton for MetricCard with pulse animation.
 * Maintains layout structure to prevent layout shift during loading.
 * 
 * Features:
 * - Matches MetricCard dimensions and padding
 * - Pulse animation for visual feedback
 * - Preserves responsive typography sizing
 * - Theme-aware (works in light and dark mode)
 * 
 * Requirements: 3.8, 10.2
 * 
 * @component
 * @example
 * ```tsx
 * <MetricCardSkeleton />
 * ```
 */
export function MetricCardSkeleton() {
  return (
    <div
      className="eco-card"
      style={{
        padding: '24px', // Match MetricCard padding
        borderRadius: '12px',
      }}
      aria-busy="true"
      aria-label="Loading metric"
    >
      {/* Label skeleton - matches MetricCard label height */}
      <div 
        className="animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded"
        style={{
          height: '13px',
          width: '60%',
          marginBottom: '12px',
        }}
      />

      {/* Value skeleton - responsive sizing to match MetricCard */}
      <div 
        className="animate-pulse bg-neutral-300 dark:bg-neutral-600 rounded"
        style={{
          height: '2.25rem', // 36px on desktop
          width: '80%',
        }}
      />
    </div>
  );
}

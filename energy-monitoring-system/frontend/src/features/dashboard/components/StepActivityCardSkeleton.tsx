/**
 * Step Activity Card Skeleton Component
 * 
 * Loading skeleton for StepActivityCard with pulse animation.
 * Maintains card dimensions and max-width constraint to prevent layout shift.
 * 
 * Features:
 * - Matches StepActivityCard dimensions (max-width: 400px)
 * - Pulse animation for visual feedback
 * - Preserves label and value layout structure
 * - Theme-aware styling
 * 
 * Requirements: 3.8, 10.2
 * 
 * @component
 * @example
 * ```tsx
 * <StepActivityCardSkeleton />
 * ```
 */
export function StepActivityCardSkeleton() {
  return (
    <div
      className="eco-card"
      style={{
        padding: '24px',
        borderRadius: '12px',
        maxWidth: '400px',
      }}
      aria-busy="true"
      aria-label="Loading step activity"
    >
      {/* Label skeleton - matches StepActivityCard label with icon */}
      <div 
        className="animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded"
        style={{
          height: '13px',
          width: '120px',
          marginBottom: '12px',
        }}
      />

      {/* Value skeleton - matches step count display */}
      <div 
        className="animate-pulse bg-neutral-300 dark:bg-neutral-600 rounded"
        style={{
          height: '2rem', // 32px for step count
          width: '150px',
        }}
      />
    </div>
  );
}

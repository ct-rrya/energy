import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Data Fetch Error Props
 */
export interface DataFetchErrorProps {
  /** Error message to display */
  message?: string;
  /** Callback when retry button is clicked */
  onRetry: () => void;
  /** Whether retry is currently in progress */
  isRetrying?: boolean;
}

/**
 * Data Fetch Error Component
 * 
 * Displays an inline error message for failed data fetches with retry functionality.
 * Used within the dashboard layout to show fetch errors without breaking the page.
 * 
 * Features:
 * - Inline error display matching dashboard design system
 * - Retry button with loading state
 * - Compact layout suitable for embedding in grid
 * - Theme-aware styling
 * 
 * Requirements: 4.6 - Implement retry button for data fetch errors
 * 
 * @component
 * @example
 * ```tsx
 * <DataFetchError
 *   message="Failed to load metrics"
 *   onRetry={() => refetch()}
 *   isRetrying={isRefetching}
 * />
 * ```
 */
export function DataFetchError({
  message = 'Failed to load data',
  onRetry,
  isRetrying = false,
}: DataFetchErrorProps) {
  return (
    <div 
      className="eco-card"
      style={{
        padding: '24px',
        borderLeft: '4px solid #EF4444',
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Error icon */}
        <AlertCircle 
          className="text-[#EF4444] flex-shrink-0 mt-0.5" 
          size={20}
          aria-hidden="true"
        />

        <div className="flex-1 min-w-0">
          {/* Error message */}
          <p 
            className="text-sm font-medium text-[#1A312C] dark:text-[#F9FAFB] mb-3"
          >
            {message}
          </p>

          {/* Retry button */}
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="
              inline-flex items-center gap-2
              px-4 py-2
              text-sm font-medium
              bg-white dark:bg-[#1C1F28]
              text-[#374151] dark:text-[#9CA3AF]
              border border-[#E5E7EB] dark:border-[#2A2E39]
              hover:bg-[#F9FAFB] dark:hover:bg-[#22252F]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
            style={{
              borderRadius: '8px',
            }}
          >
            <RefreshCw 
              size={14} 
              className={isRetrying ? 'animate-spin' : ''}
            />
            <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

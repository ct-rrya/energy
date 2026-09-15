/**
 * ChartErrorState Component
 * 
 * Displays an error message with retry functionality when chart data fetching fails.
 * Provides clear feedback and recovery options for the user.
 * 
 * Requirements:
 * - 12.3: Display error message and "Retry" button on network error
 * - 12.4: Trigger refetch when user clicks "Retry"
 * - 12.7: Display error message text when available for debugging
 * 
 * Features:
 * - Theme-aware colors from ThemeContext (light/dark mode)
 * - Error accent color (#EF4444) for icon and highlights
 * - Centered content with icon, message, and retry button
 * - Configurable height to match parent chart container
 * - Accessible with proper ARIA labels and keyboard navigation
 * - Displays technical error message for debugging when available
 */

import { useTheme } from '@/contexts/ThemeContext';
import { AlertCircle } from 'lucide-react';
import type { ChartErrorStateProps } from './chartTypes';

export function ChartErrorState({
  error,
  onRetry,
  height = 400,
}: ChartErrorStateProps) {
  const { theme } = useTheme();

  // Theme-aware colors for error state
  const colors = theme === 'light'
    ? {
        text: '#1A312C', // Deep Forest Green
        textSecondary: 'rgba(26, 49, 44, 0.7)',
        errorColor: '#EF4444', // Error accent color
        errorBg: 'rgba(239, 68, 68, 0.08)',
        buttonBg: '#428475', // Muted Teal
        buttonHover: '#357060',
        buttonText: '#FFFFFF',
      }
    : {
        text: '#EDEEF0',
        textSecondary: '#9CA3AF',
        errorColor: '#EF4444',
        errorBg: 'rgba(239, 68, 68, 0.12)',
        buttonBg: '#3ED98A', // Vibrant Mint
        buttonHover: '#2FBF71',
        buttonText: '#1A312C',
      };

  // Extract error message from Error object or string
  const errorMessage = error instanceof Error ? error.message : error;
  const displayMessage = errorMessage || 'Failed to load chart data';

  // Calculate container height (accept number or string)
  const containerHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className="relative w-full flex items-center justify-center"
      style={{ height: containerHeight }}
      role="alert"
      aria-live="polite"
      data-testid="chart-error"
    >
      {/* Centered content container */}
      <div className="flex flex-col items-center justify-center text-center px-6 py-8 max-w-md">
        {/* Error icon container with circular background */}
        <div
          className="mb-4 rounded-full p-6 transition-all duration-200"
          style={{
            backgroundColor: colors.errorBg,
          }}
        >
          <AlertCircle
            size={48}
            strokeWidth={2}
            style={{ color: colors.errorColor }}
            aria-hidden="true"
          />
        </div>

        {/* Error title */}
        <h3
          className="text-lg font-semibold mb-2"
          style={{ color: colors.text }}
        >
          Unable to Load Chart
        </h3>

        {/* Error message text */}
        <p
          className="text-sm leading-relaxed mb-4"
          style={{ color: colors.textSecondary }}
        >
          {displayMessage}
        </p>

        {/* Retry button - only shown if onRetry callback is provided */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md hover:shadow-lg"
            style={{
              backgroundColor: colors.buttonBg,
              color: colors.buttonText,
              // Use CSS variable for focus ring color
              '--tw-ring-color': colors.buttonBg,
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.buttonHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.buttonBg;
            }}
            aria-label="Retry loading chart data"
          >
            Retry
          </button>
        )}

        {/* Technical error details for debugging (collapsed by default) */}
        {error instanceof Error && error.stack && (
          <details className="mt-4 w-full text-left">
            <summary
              className="text-xs cursor-pointer hover:underline"
              style={{ color: colors.textSecondary }}
            >
              Technical Details
            </summary>
            <pre
              className="mt-2 p-3 rounded-md text-xs overflow-x-auto"
              style={{
                backgroundColor: colors.errorBg,
                color: colors.textSecondary,
                fontFamily: 'monospace',
              }}
            >
              {error.stack}
            </pre>
          </details>
        )}
      </div>

      {/* Screen reader text */}
      <span className="sr-only">
        Error loading chart data: {displayMessage}
        {onRetry && ' Press the Retry button to try again.'}
      </span>
    </div>
  );
}

/**
 * ChartEmptyState Component
 * 
 * Displays an empty state message when no chart data is available.
 * Provides helpful suggestions and guidance for the user.
 * 
 * Requirements:
 * - 12.2: Display empty state message when no data points exist
 * - 12.6: Suggest possible actions (e.g., "Try selecting a different time range")
 * 
 * Features:
 * - Theme-aware colors from ThemeContext (light/dark mode)
 * - Centered content with icon, message, and suggestion text
 * - Configurable height to match parent chart container
 * - Accessible with proper ARIA labels
 * - Default messages with sensible fallbacks
 */

import { useTheme } from '@/contexts/ThemeContext';
import { ChartNoAxesColumn } from 'lucide-react';
import type { ChartEmptyStateProps } from './chartTypes';

export function ChartEmptyState({
  message = 'No data available for this time range',
  suggestion = 'Try selecting a different time range or check back later',
  height = 400,
}: ChartEmptyStateProps) {
  const { theme } = useTheme();

  // Theme-aware colors for empty state
  const colors = theme === 'light'
    ? {
        text: '#1A312C', // Deep Forest Green
        textSecondary: 'rgba(26, 49, 44, 0.6)',
        iconBg: 'rgba(26, 49, 44, 0.06)',
        iconColor: 'rgba(26, 49, 44, 0.4)',
      }
    : {
        text: '#EDEEF0',
        textSecondary: '#9CA3AF',
        iconBg: 'rgba(255, 255, 255, 0.06)',
        iconColor: 'rgba(255, 255, 255, 0.3)',
      };

  // Calculate container height (accept number or string)
  const containerHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className="relative w-full flex items-center justify-center"
      style={{ height: containerHeight }}
      role="status"
      aria-label="No chart data available"
      data-testid="chart-empty"
    >
      {/* Centered content container */}
      <div className="flex flex-col items-center justify-center text-center px-6 py-8 max-w-md">
        {/* Icon container with circular background */}
        <div
          className="mb-4 rounded-full p-6 transition-all duration-200"
          style={{
            backgroundColor: colors.iconBg,
          }}
        >
          <ChartNoAxesColumn
            size={48}
            strokeWidth={1.5}
            style={{ color: colors.iconColor }}
            aria-hidden="true"
          />
        </div>

        {/* Empty state message */}
        <h3
          className="text-lg font-semibold mb-2"
          style={{ color: colors.text }}
        >
          {message}
        </h3>

        {/* Helpful suggestion text */}
        <p
          className="text-sm leading-relaxed"
          style={{ color: colors.textSecondary }}
        >
          {suggestion}
        </p>
      </div>

      {/* Screen reader text */}
      <span className="sr-only">
        No data available. {suggestion}
      </span>
    </div>
  );
}

/**
 * ChartLoadingState Component
 * 
 * Displays an animated skeleton loader while chart data is being fetched.
 * Provides visual feedback with shimmer effect and theme-aware colors.
 * 
 * Requirements:
 * - 12.1: Display loading skeleton during data fetch
 * - 12.5: Match visual style of loading states elsewhere in Dashboard
 * 
 * Features:
 * - Animated shimmer effect using CSS animations
 * - Theme-aware colors from ThemeContext (light/dark mode)
 * - Configurable height to match parent chart container
 * - Prevents layout shift by maintaining chart dimensions
 */

import { useTheme } from '@/contexts/ThemeContext';
import type { ChartLoadingStateProps } from './chartTypes';

export function ChartLoadingState({ height = 400 }: ChartLoadingStateProps) {
  const { theme } = useTheme();

  // Theme-aware colors for skeleton elements
  const colors = theme === 'light'
    ? {
        skeletonBase: 'rgba(26, 49, 44, 0.08)',
        skeletonHighlight: 'rgba(255, 255, 255, 0.6)',
        gridLine: 'rgba(26, 49, 44, 0.06)',
      }
    : {
        skeletonBase: 'rgba(255, 255, 255, 0.06)',
        skeletonHighlight: 'rgba(255, 255, 255, 0.12)',
        gridLine: 'rgba(255, 255, 255, 0.08)',
      };

  // Calculate container height (accept number or string)
  const containerHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: containerHeight }}
      role="status"
      aria-label="Loading chart data"
      data-testid="chart-loading"
    >
      {/* Grid lines background to mimic chart appearance */}
      <div className="absolute inset-0 flex flex-col justify-between py-4">
        {[...Array(5)].map((_, index) => (
          <div
            key={`grid-${index}`}
            className="w-full h-px"
            style={{ backgroundColor: colors.gridLine }}
          />
        ))}
      </div>

      {/* Skeleton bars container */}
      <div className="absolute inset-0 flex items-end justify-around gap-2 px-4 pb-8">
        {/* Generate 8-12 skeleton bars with varying heights */}
        {[65, 45, 80, 55, 90, 40, 70, 50, 75, 60, 85, 48].map((heightPercent, index) => (
          <div
            key={`bar-${index}`}
            className="flex-1 rounded-t-lg relative overflow-hidden"
            style={{
              height: `${heightPercent}%`,
              minWidth: '8px',
              maxWidth: '60px',
              backgroundColor: colors.skeletonBase,
            }}
          >
            {/* Shimmer effect overlay */}
            <div
              className="absolute inset-0 shimmer-animation"
              style={{
                background: `linear-gradient(
                  90deg,
                  transparent,
                  ${colors.skeletonHighlight} 50%,
                  transparent
                )`,
                backgroundSize: '200% 100%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Bottom axis line */}
      <div
        className="absolute bottom-6 left-4 right-4 h-px"
        style={{ backgroundColor: colors.gridLine }}
      />

      {/* Animated line chart overlay (optional alternative visualization) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-40"
        preserveAspectRatio="none"
        viewBox="0 0 400 200"
      >
        <path
          d="M 0,120 Q 50,80 100,100 T 200,90 T 300,110 T 400,95"
          fill="none"
          stroke={colors.skeletonBase}
          strokeWidth="3"
          strokeLinecap="round"
          className="pulse-animation"
        />
      </svg>

      {/* CSS animations defined inline */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.7;
          }
        }

        .shimmer-animation {
          animation: shimmer 2s infinite linear;
        }

        .pulse-animation {
          animation: pulse 2s infinite ease-in-out;
        }
      `}</style>

      {/* Screen reader text */}
      <span className="sr-only">Loading chart data, please wait...</span>
    </div>
  );
}

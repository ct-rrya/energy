/**
 * ChartContainer Component
 * 
 * Wrapper component providing consistent styling and state handling for all chart components.
 * Integrates with ThemeContext for theme-appropriate colors and applies EcoStep Design System styling.
 * 
 * Features:
 * - Conditional rendering of loading, empty, error, or data states
 * - Theme-aware colors (light/dark mode support)
 * - Consistent card styling with rounded corners, shadows, and spacing
 * - Optional header with title, subtitle, and action buttons
 * - Responsive height and layout
 * 
 * Requirements:
 * - 1.1: TypeScript React component with proper props interface
 * - 1.2: Accepts data, loading, error state props
 * - 1.3: Displays loading skeleton when isLoading is true
 * - 1.6: Displays empty state when isEmpty is true
 * - 1.7: Applies theme colors from ThemeContext
 * - 1.8: Responsive and adjusts to container width
 * - 11.1: Uses ThemeContext for current theme state
 * - 11.2: Applies theme-appropriate colors for all elements
 */

import { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { InfoTooltip } from '@/components/common/InfoTooltip';
import { ChartLoadingState } from './ChartLoadingState';
import { ChartEmptyState } from './ChartEmptyState';
import { ChartErrorState } from './ChartErrorState';
import type { ChartContainerProps } from './chartTypes';

export function ChartContainer({
  title,
  subtitle,
  tooltip,
  isLoading = false,
  error = null,
  isEmpty = false,
  onRetry,
  children,
  actions,
  height = 400,
  className = '',
}: ChartContainerProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // ResizeObserver ensures charts refit whenever panel width transitions or resizes
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    let prevWidth = el.getBoundingClientRect().width;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        if (Math.abs(newWidth - prevWidth) > 1) {
          prevWidth = newWidth;
          window.dispatchEvent(new Event('resize'));
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Theme-aware color palette following EcoStep Design System tokens
  const colors = {
    light: {
      cardBg: 'rgba(255, 255, 255, 0.78)',
      text: '#0D1B14',
      textSecondary: '#5B6B62',
      border: 'rgba(255, 255, 255, 0.7)',
      shadow: '8px 10px 24px rgba(30, 80, 50, 0.14), -4px -4px 12px rgba(255, 255, 255, 0.6)',
      shadowHover: '8px 12px 28px rgba(30, 80, 50, 0.18), -4px -4px 12px rgba(255, 255, 255, 0.7)',
    },
    dark: {
      cardBg: 'rgba(255, 255, 255, 0.05)',
      text: '#E4F7EA',
      textSecondary: '#93A89C',
      border: 'rgba(255, 255, 255, 0.09)',
      shadow: '8px 10px 24px rgba(0, 0, 0, 0.35), -4px -4px 12px rgba(255, 255, 255, 0.08)',
      shadowHover: '8px 14px 28px rgba(0, 0, 0, 0.45), -4px -4px 12px rgba(255, 255, 255, 0.1)',
    },
  };

  const themeColors = theme === 'light' ? colors.light : colors.dark;

  // Determine which state to render based on priority:
  // 1. Loading (highest priority)
  // 2. Error
  // 3. Empty
  // 4. Data (default)
  const renderContent = () => {
    if (isLoading) {
      return <ChartLoadingState height={height} />;
    }

    if (error) {
      return <ChartErrorState error={error} onRetry={onRetry} height={height} />;
    }

    if (isEmpty) {
      return <ChartEmptyState height={height} />;
    }

    return children;
  };

  return (
    <div
      ref={containerRef}
      className={`cd transition-all duration-200 ${className}`}
      style={{
        borderRadius: '22px',
        backgroundColor: themeColors.cardBg,
        border: `1px solid ${themeColors.border}`,
        boxShadow: themeColors.shadow,
        padding: '22px 24px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = themeColors.shadowHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = themeColors.shadow;
      }}
      data-testid="chart-container"
      aria-label={`${title} chart`}
      role="region"
    >
      {/* Header Section */}
      <div
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5 sm:gap-4 pb-3 sm:pb-4 mb-3 sm:mb-4"
        style={{ borderBottom: `1px solid var(--line)` }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="font-semibold tracking-tight"
              style={{ fontSize: '16px', color: themeColors.text, marginBottom: '4px' }}
            >
              {title}
            </h3>
            {tooltip && (
              <InfoTooltip
                title={tooltip.title}
                description={tooltip.description}
                analogy={tooltip.analogy}
                technicalNote={tooltip.technicalNote}
                size={16}
              />
            )}
          </div>
          {subtitle && (
            <p
              className="text-xs sm:text-sm leading-relaxed"
              style={{ color: themeColors.textSecondary }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Optional action buttons (e.g., time filter controls) - Full width on mobile */}
        {actions && (
          <div className="w-full sm:w-auto flex items-center">
            {actions}
          </div>
        )}
      </div>

      {/* Content Section - responsive horizontal padding */}
      <div className="px-2 sm:px-6 py-3 sm:py-4">
        {renderContent()}
      </div>
    </div>
  );
}

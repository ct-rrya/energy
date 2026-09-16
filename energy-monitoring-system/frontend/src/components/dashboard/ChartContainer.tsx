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

import { useTheme } from '@/contexts/ThemeContext';
import { ChartLoadingState } from './ChartLoadingState';
import { ChartEmptyState } from './ChartEmptyState';
import { ChartErrorState } from './ChartErrorState';
import type { ChartContainerProps } from './chartTypes';

export function ChartContainer({
  title,
  subtitle,
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

  // Theme-aware color palette following EcoStep Design System
  const colors = {
    light: {
      cardBg: 'rgba(255, 255, 255, 0.45)', // Glassmorphic white
      text: '#1A312C', // Deep Forest Green
      textSecondary: 'rgba(26, 49, 44, 0.7)',
      border: 'rgba(255, 255, 255, 0.55)', // Subtle white border for glass effect
      shadow: '0 8px 30px rgba(26, 49, 44, 0.06)',
      shadowHover: '0 12px 40px rgba(26, 49, 44, 0.1)',
    },
    dark: {
      cardBg: 'rgba(28, 31, 38, 0.7)', // Semi-transparent dark background
      text: '#EDEEF0',
      textSecondary: '#9CA3AF',
      border: 'rgba(42, 46, 55, 0.8)',
      shadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
      shadowHover: '0 12px 40px rgba(0, 0, 0, 0.4)',
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
      className={`transition-all duration-200 ${className}`}
      style={{
        borderRadius: '22px', // Chart container specific border radius per EcoStep Design System
        backgroundColor: themeColors.cardBg,
        border: `1px solid ${themeColors.border}`,
        boxShadow: themeColors.shadow,
        backdropFilter: 'blur(16px)', // Glassmorphic effect
        WebkitBackdropFilter: 'blur(16px)', // Safari support
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
      {/* Header Section - Responsive layout wraps on mobile */}
      <div
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-4 sm:px-6 pt-4 sm:pt-6 pb-4"
        style={{ borderBottom: `1px solid ${themeColors.border}` }}
      >
        <div className="flex-1 min-w-0">
          <h2
            className="text-lg sm:text-xl font-bold mb-1"
            style={{ color: themeColors.text }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-sm"
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

      {/* Content Section */}
      <div className="px-4 sm:px-6 py-4">
        {renderContent()}
      </div>
    </div>
  );
}

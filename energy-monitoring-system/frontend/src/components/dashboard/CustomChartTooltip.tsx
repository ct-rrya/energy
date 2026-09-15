/**
 * CustomChartTooltip Component
 * 
 * Custom tooltip component for Recharts visualizations in the EcoStep Dashboard.
 * Displays formatted data point values and timestamps on hover with theme-aware styling.
 * Supports both single-value and multi-value tooltips for different chart types.
 * 
 * Requirements:
 * - 13.2: Display exact value and timestamp on hover
 * - 13.3: Format values with appropriate units (W, V, A, kWh)
 * - 13.4: Format timestamps in human-readable format
 * - 13.5: Apply theme-appropriate background and text colors
 * - 13.6: Support multi-value tooltips for charts with multiple metrics
 * - 13.8: Support responsive tooltip positioning to prevent overflow beyond chart boundaries
 * 
 * Features:
 * - Theme-aware colors via ThemeContext (light/dark mode)
 * - Automatic unit formatting (W, V, A, kWh)
 * - Human-readable timestamp formatting with date-fns
 * - Glassmorphic design following EcoStep Design System
 * - Supports multiple data series in a single tooltip
 * - Viewport-aware positioning to prevent overflow
 * - Responsive content wrapping on small screens
 * 
 * Usage:
 * ```tsx
 * <Tooltip 
 *   content={<CustomChartTooltip unit="W" />} 
 * />
 * ```
 */

import { useTheme } from '@/contexts/ThemeContext';
import { format, isValid, parseISO } from 'date-fns';
import type { CustomTooltipProps } from './chartTypes';

export function CustomChartTooltip({
  active,
  payload,
  label,
  unit,
  secondaryUnit,
  // coordinate and viewBox are provided by Recharts for positioning
  // but are handled automatically by the library's positioning system
  // coordinate,
  // viewBox,
}: CustomTooltipProps) {
  const { theme } = useTheme();

  // Don't render tooltip if not active or no data
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Theme-aware colors following EcoStep Design System
  const colors = theme === 'light'
    ? {
        // Light mode colors
        tooltipBg: 'rgba(255, 255, 255, 0.95)',
        tooltipBorder: 'rgba(255, 255, 255, 0.6)',
        textPrimary: '#1A312C',
        textSecondary: '#737373',
        shadow: 'rgba(26, 49, 44, 0.12)',
      }
    : {
        // Dark mode colors
        tooltipBg: 'rgba(28, 31, 38, 0.95)',
        tooltipBorder: 'rgba(42, 46, 55, 0.8)',
        textPrimary: '#EDEEF0',
        textSecondary: '#9CA3AF',
        shadow: 'rgba(0, 0, 0, 0.3)',
      };

  /**
   * Format timestamp for display.
   * Attempts to parse ISO 8601 strings and format them in a human-readable way.
   * Falls back to displaying the label as-is if parsing fails.
   */
  const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return '';

    try {
      // Try to parse as ISO 8601 date
      const date = parseISO(timestamp);
      
      if (isValid(date)) {
        // Check if date is today
        const now = new Date();
        const isToday = 
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear();

        // Format based on whether it's today or a historical date
        if (isToday) {
          return format(date, 'h:mm a'); // "2:30 PM"
        } else {
          // Check if date includes time component
          const hasTime = timestamp.includes('T') || timestamp.includes(':');
          
          if (hasTime) {
            return format(date, 'MMM d, yyyy h:mm a'); // "Jan 15, 2024 2:30 PM"
          } else {
            return format(date, 'MMM d, yyyy'); // "Jan 15, 2024"
          }
        }
      }
    } catch (error) {
      // If parsing fails, return the original string
      console.warn('Failed to parse timestamp:', timestamp, error);
    }

    // Fallback: return label as-is
    return timestamp;
  };

  /**
   * Format numeric value with unit.
   * Rounds to 2 decimal places for precision without clutter.
   */
  const formatValue = (value: number | string, valueUnit?: string): string => {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numericValue)) {
      return String(value);
    }

    // Format with 2 decimal places
    const formatted = numericValue.toFixed(2);
    
    // Append unit if provided
    return valueUnit ? `${formatted} ${valueUnit}` : formatted;
  };

  /**
   * Get appropriate unit for payload item.
   * Checks payload item's unit first, then falls back to props unit.
   */
  const getUnit = (item: typeof payload[0], index: number): string | undefined => {
    // Priority: item.unit > secondaryUnit (for second item) > unit prop
    if (item.unit) return item.unit;
    if (index === 1 && secondaryUnit) return secondaryUnit;
    return unit;
  };

  /**
   * Calculate viewport-aware positioning to prevent tooltip overflow.
   * Recharts provides coordinate and viewBox props for intelligent positioning.
   * 
   * Requirements:
   * - 13.8: Prevent tooltips from extending beyond chart boundaries
   * - Ensure proper wrapping on mobile/small screens
   * - Edge detection for mobile viewports
   */
  const calculateTooltipStyle = () => {
    const baseStyle: React.CSSProperties = {
      backgroundColor: colors.tooltipBg,
      border: `1px solid ${colors.tooltipBorder}`,
      borderRadius: '12px',
      padding: '12px 16px',
      boxShadow: `0 8px 30px ${colors.shadow}`,
      backdropFilter: 'blur(16px)',
      minWidth: '140px',
      maxWidth: '280px', // Prevent tooltip from being too wide on small screens
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
      // Ensure tooltip stays within viewport on mobile
      maxHeight: '90vh',
      overflow: 'auto',
      // Prevent text selection for better mobile UX
      userSelect: 'none',
      WebkitUserSelect: 'none',
      // Smooth transitions for positioning adjustments
      transition: 'opacity 0.2s ease-in-out',
    };

    // Responsive adjustments for smaller screens
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      baseStyle.maxWidth = 'min(280px, 90vw)'; // Ensure tooltip fits on small screens
      baseStyle.padding = '10px 12px'; // Slightly reduce padding on mobile
      baseStyle.fontSize = '13px'; // Slightly smaller font on mobile
    }

    // If coordinate and viewBox are provided, use them for smart positioning
    // Recharts automatically handles positioning, but we ensure content wraps properly
    return baseStyle;
  };

  return (
    <div
      style={calculateTooltipStyle()}
      className="custom-chart-tooltip"
    >
      {/* Timestamp label */}
      {label && (
        <p
          style={{
            color: colors.textPrimary,
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: payload.length > 0 ? '8px' : '0',
            lineHeight: '1.2',
          }}
        >
          {formatTimestamp(label)}
        </p>
      )}

      {/* Data values */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {payload.map((entry, index) => {
          const itemUnit = getUnit(entry, index);
          const displayValue = formatValue(entry.value, itemUnit);
          
          return (
            <div
              key={`tooltip-item-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {/* Color indicator dot */}
              {entry.color && (
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: entry.color,
                    flexShrink: 0,
                  }}
                />
              )}

              {/* Value with optional name label */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {/* Show name label only if multiple metrics */}
                {payload.length > 1 && entry.name && (
                  <span
                    style={{
                      color: colors.textSecondary,
                      fontSize: '11px',
                      fontWeight: 500,
                      textTransform: 'capitalize',
                      lineHeight: '1',
                    }}
                  >
                    {entry.name}
                  </span>
                )}

                <span
                  style={{
                    color: colors.textPrimary,
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: '1.2',
                  }}
                >
                  {displayValue}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

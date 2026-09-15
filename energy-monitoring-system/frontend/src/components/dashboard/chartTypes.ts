/**
 * Chart Type Definitions
 * 
 * Shared type definitions for chart components in the EcoStep Dashboard.
 * These types support data visualization, filtering, theming, and tooltips
 * across PowerGenerationChart, VoltageCurrentChart, EnergyPeriodChart, 
 * and CumulativeEnergyChart components.
 */

// ============================================================================
// Chart Data Point Types
// ============================================================================

/**
 * Standard data point structure for all chart components.
 * Represents a single data point with timestamp and measured value.
 * 
 * Used by: All chart components (Power, Voltage/Current, Energy, Cumulative)
 */
export interface ChartDataPoint {
  /** ISO 8601 timestamp or formatted time string */
  timestamp: string;
  /** Measured value (W, V, A, kWh depending on metric) */
  value: number;
  /** Optional human-readable label for the data point */
  label?: string;
  /** Optional cumulative value (used in CumulativeEnergyChart) */
  cumulativeValue?: number;
  /** Optional secondary value for dual-metric charts (e.g., current with voltage) */
  secondaryValue?: number;
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Time range filter options for line charts showing trends over time.
 * 
 * Used by: PowerGenerationChart
 * 
 * - 'today': Last 24 hours with hourly granularity
 * - '7days': Last 7 days with daily granularity
 * - '30days': Last 30 days with daily granularity
 */
export type TimeFilter = 'today' | '7days' | '30days';

/**
 * Period aggregation filter options for bar charts showing energy by period.
 * 
 * Used by: EnergyPeriodChart
 * 
 * - 'hourly': Last 24 hours aggregated by hour
 * - 'daily': Last 30 days aggregated by day
 * - 'weekly': Last 12 weeks aggregated by week
 */
export type PeriodFilter = 'hourly' | 'daily' | 'weekly';

// ============================================================================
// Theme Color Types
// ============================================================================

/**
 * Theme-aware color configuration for chart components.
 * Colors adapt based on light/dark mode from ThemeContext.
 * 
 * Used by: All chart components for consistent theming
 */
export interface ChartThemeColors {
  /** Card background color with glassmorphic effect */
  cardBg: string;
  /** Primary text color for labels and values */
  text: string;
  /** Secondary text color for subtitles and axis labels */
  textSecondary: string;
  /** Border color for card outlines */
  border: string;
  /** Grid line color for chart axes */
  gridLine: string;
  /** Primary chart line/bar color (Muted Teal #428475) */
  primary: string;
  /** Secondary chart color (Fresh Mint #89D7B7) */
  secondary: string;
  /** Accent color for highlights (Amber #F59E0B for current) */
  accent: string;
  /** Error state color (Red #EF4444) */
  error: string;
  /** Shadow color for depth effects */
  shadow: string;
  /** Tooltip background color */
  tooltipBg: string;
  /** Tooltip border color */
  tooltipBorder: string;
}

// ============================================================================
// Tooltip Props Types
// ============================================================================

/**
 * Props for custom Recharts tooltip component.
 * Provides formatted display of data point values on hover.
 * 
 * Used by: CustomChartTooltip component
 */
export interface CustomTooltipProps {
  /** Whether the tooltip is currently active (hovered) */
  active?: boolean;
  /** Array of payload objects from Recharts containing data */
  payload?: Array<{
    /** Name/key of the data field */
    name: string;
    /** Actual value to display */
    value: number | string;
    /** Color for the value indicator */
    color?: string;
    /** Unit label (W, V, A, kWh) */
    unit?: string;
    /** Original data point object */
    payload?: ChartDataPoint;
  }>;
  /** Label text (typically the timestamp) */
  label?: string;
  /** Unit of measurement for formatting values */
  unit?: string;
  /** Optional secondary unit for dual-metric charts */
  secondaryUnit?: string;
  /** Theme colors for styling */
  colors?: ChartThemeColors;
  /** Coordinate position of the tooltip (provided by Recharts for positioning) */
  coordinate?: { x: number; y: number };
  /** ViewBox dimensions of the chart (provided by Recharts for boundary detection) */
  viewBox?: { x: number; y: number; width: number; height: number };
}

// ============================================================================
// Chart Component Props Types
// ============================================================================

/**
 * Base props shared across all chart components.
 * Provides consistent structure for optional styling.
 */
export interface BaseChartProps {
  /** Optional CSS class name for custom styling */
  className?: string;
}

/**
 * Props for PowerGenerationChart component.
 */
export interface PowerGenerationChartProps extends BaseChartProps {
  /** Initial time filter selection (default: 'today') */
  defaultTimeFilter?: TimeFilter;
}

/**
 * Props for VoltageCurrentChart component.
 */
export interface VoltageCurrentChartProps extends BaseChartProps {
  /** Whether to render as single dual-axis chart or two separate charts */
  mode?: 'dual-axis' | 'separate';
}

/**
 * Props for EnergyPeriodChart component.
 */
export interface EnergyPeriodChartProps extends BaseChartProps {
  /** Initial period filter selection (default: 'daily') */
  defaultPeriodFilter?: PeriodFilter;
}

/**
 * Props for CumulativeEnergyChart component.
 */
export interface CumulativeEnergyChartProps extends BaseChartProps {
  /** Number of days to display (default: 30) */
  daysToShow?: number;
}

// ============================================================================
// Chart State Types
// ============================================================================

/**
 * Loading, error, and empty state information for charts.
 * Used to determine which UI state to render.
 */
export interface ChartState {
  /** Whether data is currently being fetched */
  isLoading: boolean;
  /** Error object if data fetching failed */
  error: Error | null;
  /** Whether the dataset is empty (no data points) */
  isEmpty: boolean;
}

/**
 * Data point limit configuration to prevent performance degradation
 * with real-time updates.
 * 
 * Requirement 9.8: Real-time updates with data point limiting
 */
export interface DataPointLimitConfig {
  /** Maximum number of data points to display */
  maxPoints: number;
  /** Strategy for removing old points ('shift' removes oldest, 'sample' downsamples) */
  strategy: 'shift' | 'sample';
}

// ============================================================================
// Chart Container and State Component Props
// ============================================================================

/**
 * Props for ChartContainer wrapper component.
 * Provides consistent styling and state handling for all charts.
 */
export interface ChartContainerProps {
  /** Chart title displayed at the top */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Whether data is currently being fetched */
  isLoading?: boolean;
  /** Error object if data fetching failed */
  error?: Error | null;
  /** Whether the dataset is empty (no data points) */
  isEmpty?: boolean;
  /** Callback function when retry button is clicked */
  onRetry?: () => void;
  /** Chart content to render when data is available */
  children: React.ReactNode;
  /** Optional action elements (e.g., filter buttons) */
  actions?: React.ReactNode;
  /** Chart height in pixels or CSS string */
  height?: number | string;
  /** Optional CSS class name for custom styling */
  className?: string;
}

/**
 * Props for ChartLoadingState component.
 */
export interface ChartLoadingStateProps {
  /** Skeleton height to match chart dimensions */
  height?: number | string;
}

/**
 * Props for ChartEmptyState component.
 */
export interface ChartEmptyStateProps {
  /** Empty state message */
  message?: string;
  /** Helpful suggestion text */
  suggestion?: string;
  /** Container height to match chart dimensions */
  height?: number | string;
}

/**
 * Props for ChartErrorState component.
 */
export interface ChartErrorStateProps {
  /** Error object or error message string */
  error?: Error | string;
  /** Callback function when retry button is clicked */
  onRetry?: () => void;
  /** Container height to match chart dimensions */
  height?: number | string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Time range calculation result for data fetching hooks.
 */
export interface TimeRange {
  /** Start date/time for data query */
  startDate: Date;
  /** End date/time for data query */
  endDate: Date;
  /** Granularity for data aggregation */
  granularity: 'hour' | 'day' | 'week' | 'month';
}

/**
 * Chart data transformation options.
 */
export interface ChartDataTransformOptions {
  /** Whether to calculate cumulative values */
  cumulative?: boolean;
  /** Maximum number of data points to return */
  limit?: number;
  /** Whether to fill gaps in time series */
  fillGaps?: boolean;
}

/**
 * Hero Dashboard Type Definitions
 * 
 * Type definitions for the EcoStep Hero Energy Dashboard redesign.
 * These types support the hero-focused layout with energy output as the primary KPI.
 * 
 * @module hero-dashboard.types
 */

/**
 * Trend Data Point
 * 
 * Represents a single data point in the 24-hour trend graph.
 * Used by MiniTrendGraph to visualize energy patterns.
 */
export interface TrendDataPoint {
  /** ISO 8601 timestamp of the data point */
  timestamp: string;
  /** Energy value in kWh at this timestamp */
  value: number;
}

/**
 * Validation Range
 * 
 * Defines acceptable min/max ranges for sensor data validation.
 * Used to detect and reject out-of-range values before display.
 */
export interface ValidationRange {
  /** Minimum acceptable value (inclusive) */
  min: number;
  /** Maximum acceptable value (inclusive) */
  max: number;
  /** Field name being validated */
  field: string;
}

/**
 * Validation Result
 * 
 * Result of sensor data validation check.
 * Contains validation status and detailed error messages.
 */
export interface ValidationResult {
  /** True if data passed all validation checks */
  isValid: boolean;
  /** Array of validation error messages (empty if valid) */
  errors: string[];
}

/**
 * Trend Direction
 * 
 * Direction of trend change compared to previous period.
 * Determines color coding and icon display.
 */
export type TrendDirection = 'up' | 'down' | 'neutral' | 'no-data';

/**
 * Trend Calculation
 * 
 * Complete trend analysis result including direction, percentage,
 * and visual styling information.
 */
export interface TrendCalculation {
  /** Direction of the trend */
  direction: TrendDirection;
  /** Absolute percentage change (always positive) */
  percentage: number;
  /** Hex color code for trend display */
  color: string;
  /** React icon component for trend direction */
  icon: React.ReactNode;
  /** Human-readable trend label (e.g., "↑ 12.5% vs yesterday") */
  label: string;
}

/**
 * Enhanced Dashboard Metrics
 * 
 * Extended dashboard metrics including hero card data.
 * Adds daily energy, trends, and AI insights to base metrics.
 */
export interface EnhancedDashboardMetrics {
  /** Today's cumulative energy generated (kWh) */
  dailyEnergy: number;
  /** Yesterday's total energy for comparison (kWh) */
  previousDayEnergy: number;
  /** 24-hour trend data points for mini graph */
  energyTrend: TrendDataPoint[];
  /** AI-generated insight text (60-150 characters) */
  aiInsight: string;
  /** Current voltage reading (V) */
  currentVoltage: number;
  /** Current electrical current reading (A) */
  currentCurrent: number;
  /** Current power output (W) */
  currentPower: number;
  /** Today's step count */
  stepCount?: number;
  /** Timestamp of last data update */
  lastUpdate: string;
}

/**
 * System Status Type
 * 
 * System operational state for status badge display.
 */
export type SystemStatusType = 'connected' | 'disconnected' | 'unknown';

/**
 * Hero Energy Card Props
 * 
 * Props interface for the HeroEnergyCard component.
 * Primary KPI display showing daily energy with trend and insights.
 */
export interface HeroEnergyCardProps {
  /** Today's energy value in kWh (undefined during loading) */
  energyValue: number | undefined;
  /** Yesterday's energy value for trend comparison (undefined if unavailable) */
  previousDayEnergy: number | undefined;
  /** Array of 24-hour trend data points */
  trendData: TrendDataPoint[];
  /** AI-generated insight text (undefined if unavailable) */
  aiInsight: string | undefined;
  /** Loading state indicator */
  isLoading: boolean;
  /** Error state indicator */
  isError: boolean;
  /** Callback invoked when user clicks retry button */
  onRetry?: () => void;
}

/**
 * Trend Indicator Props
 * 
 * Props interface for the TrendIndicator component.
 * Displays percentage change with color-coded arrow.
 */
export interface TrendIndicatorProps {
  /** Current period value (undefined if unavailable) */
  currentValue: number | undefined;
  /** Previous period value for comparison (undefined if unavailable) */
  previousValue: number | undefined;
  /** Display format: percentage or absolute difference */
  format?: 'percentage' | 'absolute';
  /** Whether to show directional icon */
  showIcon?: boolean;
}

/**
 * Mini Trend Graph Props
 * 
 * Props interface for the MiniTrendGraph component.
 * Compact 24-hour sparkline visualization.
 */
export interface MiniTrendGraphProps {
  /** Array of trend data points to visualize */
  data: TrendDataPoint[];
  /** Graph height in pixels (max 25% of card height) */
  height?: number;
  /** Whether to show axes and labels */
  showAxes?: boolean;
  /** Line color (defaults to #3ED98A) */
  accentColor?: string;
}

/**
 * AI Insight Section Props
 * 
 * Props interface for the AIInsightSection component.
 * Executive summary text with icon.
 */
export interface AIInsightSectionProps {
  /** Insight text to display (undefined during loading) */
  insight: string | undefined;
  /** Loading state indicator */
  isLoading: boolean;
  /** Maximum character length for insight text */
  maxLength?: number;
}

/**
 * Metrics Column Props
 * 
 * Props interface for the MetricsColumn component.
 * Container for four stacked metric cards.
 */
export interface MetricsColumnProps {
  /** Current voltage reading in V (undefined if unavailable) */
  voltage: number | undefined;
  /** Current electrical current in A (undefined if unavailable) */
  current: number | undefined;
  /** Current power output in W (undefined if unavailable) */
  power: number | undefined;
  /** Today's step count (undefined if unavailable) */
  stepCount: number | undefined;
  /** Loading state indicator */
  isLoading: boolean;
}

/**
 * Enhanced Dashboard Header Props
 * 
 * Props interface for the enhanced DashboardHeader component.
 * Includes date/time, status badge, and connection indicator.
 */
export interface EnhancedDashboardHeaderProps {
  /** Dashboard title text */
  title: string;
  /** Dashboard subtitle text */
  subtitle: string;
  /** System operational status */
  systemStatus: SystemStatusType;
  /** Number of active alerts */
  alertsCount: number;
  /** Whether current user is public viewer */
  isPublicUser: boolean;
  /** WebSocket connection status */
  isWebSocketConnected: boolean;
  /** Callback invoked when alerts button clicked */
  onAlertsClick: () => void;
}

/**
 * Last Known Good Data Cache
 * 
 * Cached sensor readings for fallback during validation failures.
 * Prevents UI flicker when bad data is received.
 */
export interface LastKnownGoodData {
  /** Last valid sensor reading */
  reading?: {
    voltage: number;
    current: number;
    power: number;
    stepCount: number;
    timestamp: string;
  };
  /** Last valid daily metrics */
  metrics?: {
    dailyEnergy: number;
    previousDayEnergy: number;
    energyTrend: TrendDataPoint[];
    aiInsight: string;
    timestamp: string;
  };
}

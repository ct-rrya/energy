/**
 * Dashboard Components Barrel Export
 * 
 * Centralized export for all chart-related components, types, and utilities.
 */

// ============================================================================
// Shared Components
// ============================================================================

export { ChartContainer } from './ChartContainer';
export { ChartLoadingState } from './ChartLoadingState';
export { ChartEmptyState } from './ChartEmptyState';
export { ChartErrorState } from './ChartErrorState';
export { CustomChartTooltip } from './CustomChartTooltip';

// ============================================================================
// Chart Components
// ============================================================================

export { PowerGenerationChart } from './PowerGenerationChart';
export { VoltageCurrentChart } from './VoltageCurrentChart';
export { EnergyPeriodChart } from './EnergyPeriodChart';
export { CumulativeEnergyChart } from './CumulativeEnergyChart';

// ============================================================================
// Types
// ============================================================================

export type {
  ChartDataPoint,
  TimeFilter,
  PeriodFilter,
  ChartThemeColors,
  CustomTooltipProps,
  ChartContainerProps,
  ChartLoadingStateProps,
  ChartEmptyStateProps,
  ChartErrorStateProps,
  PowerGenerationChartProps,
  VoltageCurrentChartProps,
  EnergyPeriodChartProps,
  CumulativeEnergyChartProps,
} from './chartTypes';

// ============================================================================
// Utilities
// ============================================================================

export {
  transformToChartData,
  calculateCumulative,
  limitDataPoints,
  formatChartTimestamp,
  formatValueWithUnit,
  isDatasetEmpty,
  getTimeRangeLabel,
  calculateSummaryStats,
} from './chartUtils';

/**
 * Dashboard Components Barrel Export
 * 
 * Note: ChartsLayoutContainer is excluded from barrel export to enable
 * lazy loading and code splitting (Task 9.3)
 */

// =============================================================================
// Shared Constants from types.ts
// =============================================================================

export {
  // Color Constants
  METRIC_COLORS,
  METRIC_COLORS_DARK,
  STATUS_COLORS,
  
  // Breakpoints
  BREAKPOINTS,
  MEDIA_QUERIES,
  
  // Typography
  METRIC_FONT_SIZES,
  LABEL_TYPOGRAPHY,
  UNIT_TYPOGRAPHY,
  
  // Spacing
  CARD_SPACING,
  
  // Animation
  ANIMATION_DURATIONS,
  ANIMATION_EASINGS,
} from './types';

// =============================================================================
// Existing components
// =============================================================================
export { DashboardCard } from './DashboardCard';
export { StatCard } from './StatCard';
export { StatusBadge } from './StatusBadge';
export { ConnectionIndicator } from './ConnectionIndicator';
export { SystemStatusCard } from './SystemStatusCard';
export { StatsGrid } from './StatsGrid';
export { DashboardSkeleton } from './DashboardSkeleton';
export { EmptyDashboard } from './EmptyDashboard';
export { StepActivityCard } from './StepActivityCard';
export type { StepActivityCardProps } from './StepActivityCard';

// Task 9.1: Removed exports for deprecated components:
// - PageHeader (replaced by DashboardHeader)
// - LiveSensorCard (not in new design)
// - RecentActivityCard (not in new design)
// - QuickActionsCard (replaced by Alerts button in DashboardHeader)

// New redesign components (EcoStep Central Dashboard Redesign)
export { DashboardHeader } from './DashboardHeader';
export type { DashboardHeaderProps, SystemStatusType } from './DashboardHeader';

export { MetricCard } from './MetricCard';
export type { MetricCardProps, MetricColor } from './MetricCard';

export { ElectricalMetricsGrid } from './ElectricalMetricsGrid';
export type { ElectricalMetricsGridProps } from './ElectricalMetricsGrid';

export { StatusIndicator } from './StatusIndicator';
export type { StatusIndicatorProps, StatusType } from './StatusIndicator';

export { SystemStatusCardNew } from './SystemStatusCard.new';
export type { SystemStatusCardNewProps } from './SystemStatusCard.new';

export { SensorNodesEmptyState } from './SensorNodesEmptyState';
export type { SensorNodesEmptyStateProps } from './SensorNodesEmptyState';

// Task 12: Error handling and loading state components
export { MetricCardSkeleton } from './MetricCardSkeleton';
export { SystemStatusCardSkeleton } from './SystemStatusCardSkeleton';
export { StepActivityCardSkeleton } from './StepActivityCardSkeleton';
export { DashboardErrorBoundary } from './DashboardErrorBoundary';
export { DataFetchError } from './DataFetchError';
export type { DataFetchErrorProps } from './DataFetchError';

// ChartsLayoutContainer excluded - lazy loaded in DashboardPage for code splitting

// =============================================================================
// Hero Dashboard Components (EcoStep Hero Energy Dashboard)
// =============================================================================
export { HeroEnergyCard } from './HeroEnergyCard';
export { TrendIndicator } from './TrendIndicator';
export { MiniTrendGraph } from './MiniTrendGraph';
export { AIInsightSection } from './AIInsightSection';
export { MetricsColumn } from './MetricsColumn';
export { HeroCardSkeleton } from './HeroCardSkeleton';

// Lazy loading components (Task 4.2 - Requirement 20.7)
export { MiniTrendGraphLazy } from './MiniTrendGraph.lazy';
export { GraphSkeleton } from './GraphSkeleton';

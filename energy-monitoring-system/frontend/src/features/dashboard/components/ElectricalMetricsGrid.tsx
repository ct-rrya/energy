import { Zap, Activity, TrendingUp } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { MetricCardSkeleton } from './MetricCardSkeleton';

/**
 * Electrical Metrics Grid Props
 * Props for the hero section displaying primary electrical metrics
 */
export interface ElectricalMetricsGridProps {
  /** Current voltage in Volts (V) */
  voltage?: number;
  
  /** Current amperage in Amperes (A) */
  current?: number;
  
  /** Current power output in Watts (W) */
  power?: number;
  
  /** Total energy generated today in kilowatt-hours (kWh) */
  energy?: number;
  
  /** Whether metrics are currently loading */
  isLoading?: boolean;
}

/**
 * Electrical Metrics Grid Component
 * 
 * Hero section showcasing primary electrical metrics in a responsive grid.
 * Displays four key metrics: Voltage, Current, Power, and Energy Today.
 * 
 * Grid Behavior:
 * - Desktop (≥1024px): 4 columns, equal width
 * - Tablet (640-1023px): 2 columns, 2 rows
 * - Mobile (<640px): 1 column, stacked
 * 
 * Features:
 * - Responsive grid layout with CSS Grid
 * - Four metric cards with semantic colors
 * - Icons for visual identification
 * - Loading state support
 * - Empty state handling
 * 
 * Metric Details:
 * - Voltage: Accent green, 1 decimal place, Zap icon
 * - Current: Amber, 2 decimal places, Activity icon
 * - Power: Blue, 1 decimal place, Zap icon
 * - Energy Today: Amber, 2 decimal places, TrendingUp icon
 * 
 * Responsive Typography:
 * - Desktop (≥1024px): 36px metric values
 * - Tablet (640-1023px): 32px metric values
 * - Mobile (<640px): 28px metric values
 * 
 * @component
 * @example
 * ```tsx
 * <ElectricalMetricsGrid
 *   voltage={230.2}
 *   current={12.45}
 *   power={2867.3}
 *   energy={3.42}
 *   isLoading={false}
 * />
 * ```
 */
export function ElectricalMetricsGrid({
  voltage,
  current,
  power,
  energy,
  isLoading = false,
}: ElectricalMetricsGridProps) {
  return (
    <div
      className="
        grid 
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-4
      "
      style={{
        gap: '16px', // Spacing system: grid gap 16px
      }}
      role="region"
      aria-label="Electrical metrics"
    >
      {/* Show skeletons when loading, otherwise show metric cards */}
      {isLoading ? (
        <>
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </>
      ) : (
        <>
          {/* Voltage Metric */}
          <MetricCard
            label="Voltage"
            value={voltage}
            unit="V"
            precision={1}
            color="accent"
            icon={<Zap size={16} />}
          />

          {/* Current Metric */}
          <MetricCard
            label="Current"
            value={current}
            unit="A"
            precision={2}
            color="amber"
            icon={<Activity size={16} />}
          />

          {/* Power Metric */}
          <MetricCard
            label="Power"
            value={power}
            unit="W"
            precision={1}
            color="blue"
            icon={<Zap size={16} />}
          />

          {/* Energy Today Metric */}
          <MetricCard
            label="Energy Today"
            value={energy}
            unit="kWh"
            precision={2}
            color="amber"
            icon={<TrendingUp size={16} />}
          />
        </>
      )}
    </div>
  );
}

import { PowerGenerationChart } from '@/components/dashboard/PowerGenerationChart';
import { VoltageCurrentChart } from '@/components/dashboard/VoltageCurrentChart';
import { EnergyPeriodChart } from '@/components/dashboard/EnergyPeriodChart';
import { CumulativeEnergyChart } from '@/components/dashboard/CumulativeEnergyChart';
import { CapacitorVoltageChart } from '@/components/dashboard/CapacitorVoltageChart';
import { StepsChart } from '@/components/dashboard/StepsChart';
import { useChartRealTimeUpdates } from '../hooks/useChartRealTimeUpdates';

/**
 * ChartsLayoutContainer Component
 * 
 * Responsive layout container for all dashboard analytics charts.
 * 
 * Charts:
 * - Power Generation (full width)
 * - Voltage and Current (2-column)
 * - Energy Period and Cumulative Energy (2-column)
 * - Capacitor Voltage (full width)
 * - Steps (full width)
 * 
 * Layout:
 * - Desktop (≥1024px): PowerGenerationChart full width, secondary charts 2-column grid (50% each)
 * - Tablet (768px-1023px): Adaptive layout based on space
 * - Mobile (<768px): All charts stacked single column (100% width)
 * 
 * Requirements: 7.4, 7.5, 7.6, 7.7, 7.1, 7.2, 7.8
 */
export function ChartsLayoutContainer() {
  // Subscribe to real-time updates for all charts
  useChartRealTimeUpdates();

  return (
    <div className="space-y-6 mt-6">
      {/* Featured Power Generation Chart - Full Width */}
      <div className="w-full">
        <PowerGenerationChart />
      </div>

      {/* Secondary Charts - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Voltage and Current Charts - Left Column on Desktop */}
        <div className="w-full">
          <VoltageCurrentChart />
        </div>

        {/* Energy Charts - Right Column on Desktop */}
        <div className="space-y-4 lg:space-y-6">
          <EnergyPeriodChart />
          <CumulativeEnergyChart />
        </div>
      </div>

      {/* Monitoring Suite Charts - Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Capacitor Voltage Chart */}
        <div className="w-full">
          <CapacitorVoltageChart />
        </div>

        {/* Steps Chart */}
        <div className="w-full">
          <StepsChart />
        </div>
      </div>
    </div>
  );
}

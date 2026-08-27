import { 
  Zap, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Database 
} from 'lucide-react';
import { SummaryCard } from './SummaryCard';
import type { DashboardAnalytics } from '../../types';

/**
 * Summary Grid Props
 */
interface SummaryGridProps {
  analytics: DashboardAnalytics;
}

/**
 * Summary Grid Component
 * 
 * Displays a grid of summary cards with dashboard metrics.
 */
export function SummaryGrid({ analytics }: SummaryGridProps) {
  const { today, yesterday, week, month, system } = analytics;

  return (
    <div className="eco-grid-3">
      {/* Today's Energy */}
      <SummaryCard
        title="Today's Energy"
        value={today.energyKWh}
        unit="kWh"
        icon={Zap}
        iconColor="text-green-600"
        trend={yesterday.trend}
        trendValue={yesterday.change}
      />

      {/* Today's Peak Power */}
      <SummaryCard
        title="Peak Power Today"
        value={today.peakPowerW}
        unit="W"
        icon={TrendingUp}
        iconColor="text-orange-600"
        subtitle={`Avg: ${today.avgPowerW.toFixed(1)}W`}
      />

      {/* This Week */}
      <SummaryCard
        title="This Week"
        value={week.energyKWh}
        unit="kWh"
        icon={Calendar}
        iconColor="text-blue-600"
        subtitle={`${week.daysActive} days active`}
      />

      {/* This Month */}
      <SummaryCard
        title="This Month"
        value={month.energyKWh}
        unit="kWh"
        icon={Activity}
        iconColor="text-purple-600"
        subtitle={`Projected: ${month.projectedKWh.toFixed(1)} kWh`}
      />

      {/* Cost Savings */}
      <SummaryCard
        title="Cost Savings (Month)"
        value={month.costSavings}
        unit="USD"
        icon={DollarSign}
        iconColor="text-green-600"
        subtitle="@$0.12/kWh"
      />

      {/* System Health */}
      <SummaryCard
        title="System Uptime"
        value={system.systemUptime}
        unit="%"
        icon={Database}
        iconColor="text-cyan-600"
        subtitle={`${system.activeSensors} sensors active`}
      />
    </div>
  );
}

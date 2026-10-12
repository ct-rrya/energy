import { Zap, Activity, Gauge, Battery, TrendingUp, Radio } from 'lucide-react';
import { StatCard } from './StatCard';
import { formatEnergy, formatPower, formatNumber } from '@/lib/utils';
import type { DashboardMetrics } from '../types/dashboard.types';

/**
 * Stats Grid Props
 */
interface StatsGridProps {
  metrics: DashboardMetrics;
  isLoading?: boolean;
}

/**
 * Stats Grid Component
 * Grid layout displaying all dashboard statistics
 */
export function StatsGrid({ metrics, isLoading }: StatsGridProps) {
  const batteryVariant: 'danger' | 'success' = metrics.batteryPercentage < 20 ? 'danger' : 'success';

  const stats = [
    {
      id: 'energy',
      icon: TrendingUp,
      title: 'Energy Generated',
      value: isLoading ? '—' : formatEnergy(metrics.currentEnergy),
      unit: '',
      variant: 'success' as const,
      trend: { value: 12.5, direction: 'up' as const },
    },
    {
      id: 'voltage',
      icon: Zap,
      title: 'Voltage',
      value: isLoading ? '—' : formatNumber(metrics.currentVoltage, 2),
      unit: 'V',
      variant: 'info' as const,
    },
    {
      id: 'current',
      icon: Activity,
      title: 'Current',
      value: isLoading ? '—' : formatNumber(metrics.currentCurrent, 2),
      unit: 'A',
      variant: 'warning' as const,
    },
    {
      id: 'power',
      icon: Gauge,
      title: 'Power',
      value: isLoading ? '—' : formatPower(metrics.currentPower),
      unit: '',
      variant: 'default' as const,
    },
    {
      id: 'battery',
      icon: Battery,
      title: 'Battery Level',
      value: isLoading ? '—' : formatNumber(metrics.batteryPercentage, 0),
      unit: '%',
      variant: batteryVariant,
    },
    {
      id: 'daily',
      icon: TrendingUp,
      title: 'Estimated Daily Energy',
      value: isLoading ? '—' : formatEnergy(metrics.estimatedDailyEnergy),
      unit: '',
      variant: 'success' as const,
    },
    {
      id: 'sensors',
      icon: Radio,
      title: 'Active Sensors',
      value: isLoading ? '—' : metrics.activeSensors.toString(),
      unit: '',
      variant: 'info' as const,
    },
    {
      id: 'devices',
      icon: Radio,
      title: 'Connected Devices',
      value: isLoading ? '—' : metrics.connectedDevices.toString(),
      unit: '',
      variant: 'default' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.id}
          icon={stat.icon}
          title={stat.title}
          value={stat.value}
          unit={stat.unit}
          variant={stat.variant}
          trend={stat.trend}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}

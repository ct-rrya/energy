import { Activity, Zap, Gauge } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { formatDateTime } from '@/lib/utils';
import type { SensorReading } from '../types/dashboard.types';

/**
 * Live Sensor Card Props
 */
interface LiveSensorCardProps {
  lastReading?: SensorReading;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

/**
 * Live Sensor Card Component
 * Displays the most recent sensor reading
 */
export function LiveSensorCard({
  lastReading,
  isLoading,
  error,
  onRetry,
}: LiveSensorCardProps) {
  const isEmpty = !lastReading && !isLoading && !error;

  return (
    <DashboardCard
      title="Live Sensor Data"
      subtitle="Most recent sensor reading"
      isLoading={isLoading}
      isEmpty={isEmpty}
      error={error}
      onRetry={onRetry}
    >
      {lastReading && (
        <div className="space-y-4">
          {/* Voltage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Voltage</p>
                <p className="text-lg font-bold text-neutral-900">
                  {lastReading.voltage.toFixed(2)} <span className="text-sm font-normal">V</span>
                </p>
              </div>
            </div>
          </div>

          {/* Current */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50">
                <Activity className="h-5 w-5 text-accent-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Current</p>
                <p className="text-lg font-bold text-neutral-900">
                  {lastReading.current.toFixed(2)} <span className="text-sm font-normal">A</span>
                </p>
              </div>
            </div>
          </div>

          {/* Power */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-50">
                <Gauge className="h-5 w-5 text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Power</p>
                <p className="text-lg font-bold text-neutral-900">
                  {lastReading.power.toFixed(2)} <span className="text-sm font-normal">W</span>
                </p>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="mt-4 border-t border-neutral-200 pt-4">
            <p className="text-xs text-neutral-500">
              Last updated: {formatDateTime(lastReading.timestamp)}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Sensor ID: {lastReading.sensorId.substring(0, 8)}...
            </p>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}

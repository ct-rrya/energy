import { Activity, Zap, Gauge } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { formatDateTime } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { getBorderColor } from '@/styles/design-tokens';
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
 * Determine sensor status based on reading values
 */
function getSensorStatus(reading: SensorReading): {
  label: string;
  variant: 'success' | 'warning' | 'error';
} {
  // Check for error conditions
  if (reading.voltage < 100 || reading.voltage > 250) {
    return { label: 'Error', variant: 'error' };
  }
  
  // Check for warning conditions
  if (reading.current > 15 || reading.power > 3000) {
    return { label: 'Warning', variant: 'warning' };
  }
  
  // Default: healthy
  return { label: 'Healthy', variant: 'success' };
}

/**
 * Live Sensor Card Component
 * Displays the most recent sensor reading with data-first hierarchy
 * 
 * FIXED for Task 22 (Dark Mode):
 * - Changed hardcoded border color to theme-aware getBorderColor()
 * - Now properly supports light and dark mode transitions
 * 
 * Requirements:
 * - 5.1, 5.2, 5.3: Data-first hierarchy with tabular-nums
 * - 8.1-8.4: Semantic badge colors
 * - 12.1-12.7: Dark mode consistency
 */
export function LiveSensorCard({
  lastReading,
  isLoading,
  error,
  onRetry,
}: LiveSensorCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const isEmpty = !lastReading && !isLoading && !error;
  const status = lastReading ? getSensorStatus(lastReading) : null;

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
        <div className="space-y-6">
          {/* Sensor Status Badge */}
          {status && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[13px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Status
              </span>
              <span
                className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border"
                style={{
                  backgroundColor:
                    status.variant === 'success'
                      ? 'rgba(34, 197, 94, 0.1)'
                      : status.variant === 'warning'
                        ? 'rgba(245, 158, 11, 0.1)'
                        : 'rgba(239, 68, 68, 0.1)',
                  color:
                    status.variant === 'success'
                      ? isDark ? '#4ADE80' : '#15803d'
                      : status.variant === 'warning'
                        ? isDark ? '#FCD34D' : '#b45309'
                        : isDark ? '#FCA5A5' : '#b91c1c',
                  borderColor:
                    status.variant === 'success'
                      ? 'rgba(34, 197, 94, 0.2)'
                      : status.variant === 'warning'
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                }}
              >
                {status.label}
              </span>
            </div>
          )}

          {/* Voltage - Data-First Hierarchy */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
              <span className="text-[13px] font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                Voltage
              </span>
            </div>
            <p
              className="text-4xl font-semibold text-neutral-900 dark:text-neutral-50"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {lastReading.voltage.toFixed(2)}{' '}
              <span className="text-xl font-normal text-neutral-600 dark:text-neutral-400">V</span>
            </p>
          </div>

          {/* Current - Data-First Hierarchy */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Activity className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
              <span className="text-[13px] font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                Current
              </span>
            </div>
            <p
              className="text-4xl font-semibold text-neutral-900 dark:text-neutral-50"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {lastReading.current.toFixed(2)}{' '}
              <span className="text-xl font-normal text-neutral-600 dark:text-neutral-400">A</span>
            </p>
          </div>

          {/* Power - Data-First Hierarchy */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Gauge className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
              <span className="text-[13px] font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                Power
              </span>
            </div>
            <p
              className="text-4xl font-semibold text-neutral-900 dark:text-neutral-50"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {lastReading.power.toFixed(2)}{' '}
              <span className="text-xl font-normal text-neutral-600 dark:text-neutral-400">W</span>
            </p>
          </div>

          {/* Timestamp - Theme-aware hairline border separation */}
          <div 
            className="border-t pt-4" 
            style={{ borderColor: getBorderColor(isDark) }}
          >
            <p className="text-xs text-neutral-500 dark:text-neutral-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
              Last updated: {formatDateTime(lastReading.timestamp)}
            </p>
            <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500" style={{ fontVariantNumeric: 'tabular-nums' }}>
              Sensor ID: {lastReading.sensorId.substring(0, 8)}...
            </p>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}

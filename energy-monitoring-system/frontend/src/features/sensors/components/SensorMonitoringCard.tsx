import { Zap, Thermometer, Radio } from 'lucide-react';
import { DashboardCard } from '@/features/dashboard/components';
import { CircularGauge, BatteryIndicator } from './gauges';
import { SignalQualityIndicator, ReadingDisplay, DeviceStatusBadge } from './displays';
import { formatDateTime } from '@/lib/utils';
import type { SensorReading } from '../types/sensor.types';

/**
 * Sensor Monitoring Card Props
 */
interface SensorMonitoringCardProps {
  sensorId: string;
  sensorName: string;
  sensorLocation: string;
  reading?: SensorReading;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

/**
 * Sensor Monitoring Card Component
 * 
 * Displays real-time sensor data with gauges and readings.
 * 
 * Features:
 * - Circular gauges for voltage, current, power
 * - Battery indicator
 * - Signal quality indicator
 * - Device status badge
 * - Temperature and frequency (if available)
 * - Last update timestamp
 */
export function SensorMonitoringCard({
  sensorName,
  sensorLocation,
  reading,
  isLoading,
  error,
  onRetry,
}: SensorMonitoringCardProps) {
  const isEmpty = !reading && !isLoading && !error;

  // Determine if device is online (reading within last 5 minutes)
  const isOnline = reading 
    ? (new Date().getTime() - new Date(reading.timestamp).getTime()) < 300000 
    : false;

  return (
    <DashboardCard
      title={sensorName}
      subtitle={sensorLocation}
      actions={
        reading && (
          <div className="flex items-center gap-2">
            <SignalQualityIndicator
              quality={reading.signalQuality}
              latency={reading.latency}
              showLabel={false}
              size="sm"
            />
            <DeviceStatusBadge isOnline={isOnline} />
          </div>
        )
      }
      isLoading={isLoading}
      isEmpty={isEmpty}
      error={error}
      onRetry={onRetry}
    >
      {reading && (
        <div className="space-y-6">
          {/* Gauges Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Voltage Gauge */}
            <CircularGauge
              value={reading.voltage}
              max={50}
              unit="V"
              label="Voltage"
              color="#3DDC97"
              size="md"
            />

            {/* Current Gauge */}
            <CircularGauge
              value={reading.current}
              max={10}
              unit="A"
              label="Current"
              color="#F59E0B"
              size="md"
            />

            {/* Power Gauge */}
            <CircularGauge
              value={reading.power}
              max={500}
              unit="W"
              label="Power"
              color="#22C55E"
              size="md"
            />
          </div>

          {/* Battery and Additional Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t pt-4" style={{ borderColor: 'rgba(26, 49, 44, 0.08)' }}>
            {/* Left Column - Battery */}
            <div className="flex justify-center">
              <BatteryIndicator
                percentage={reading.batteryPercentage}
                size="md"
                showPercentage
              />
            </div>

            {/* Right Column - Additional Readings */}
            <div className="space-y-3">
              {/* Energy */}
              <ReadingDisplay
                icon={Zap}
                label="Energy Generated"
                value={reading.energy}
                unit="kWh"
                color="text-green-600 dark:text-green-400"
                size="sm"
              />

              {/* Temperature (if available) */}
              {reading.temperature !== undefined && (
                <ReadingDisplay
                  icon={Thermometer}
                  label="Temperature"
                  value={reading.temperature}
                  unit="°C"
                  color="text-amber-600 dark:text-amber-400"
                  size="sm"
                />
              )}

              {/* Frequency (if available) */}
              {reading.frequency !== undefined && (
                <ReadingDisplay
                  icon={Radio}
                  label="Frequency"
                  value={reading.frequency}
                  unit="Hz"
                  color="text-blue-600 dark:text-blue-400"
                  size="sm"
                />
              )}
            </div>
          </div>

          {/* Footer - Timestamp and Source */}
          <div className="border-t pt-3 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400" style={{ borderColor: 'rgba(26, 49, 44, 0.08)' }}>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              Last updated: {formatDateTime(reading.timestamp)}
            </span>
            <span className="flex items-center gap-1">
              {reading.source === 'mock' && (
                <span className="rounded-md border px-2 py-0.5 font-medium" style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  borderColor: 'rgba(245, 158, 11, 0.2)',
                  color: '#92400e'
                }}>
                  Mock Data
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}

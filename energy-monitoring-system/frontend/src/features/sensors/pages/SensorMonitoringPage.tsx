import { Radio } from 'lucide-react';
import { EcoPageHeader, EcoCard, EcoEmptyState } from '@/components/common';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { SensorMonitoringCard } from '../components/SensorMonitoringCard';
import { useSensorReadings, useLiveSensorUpdates } from '../hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sensorsService } from '@/api/services';

/**
 * Sensor Monitoring Page Component
 * Redesigned with EcoStep design system
 */
export function SensorMonitoringPage() {
  const queryClient = useQueryClient();

  // Fetch all sensors
  const {
    data: sensors,
    isLoading: sensorsLoading,
    error: sensorsError,
  } = useQuery({
    queryKey: ['sensors', 'list'],
    queryFn: async () => {
      const response = await sensorsService.getAll();
      return response.data;
    },
  });

  // Fetch latest readings for all sensors
  const {
    data: readings,
    isLoading: readingsLoading,
    error: readingsError,
    refetch: refetchReadings,
  } = useSensorReadings();

  // Subscribe to live updates
  const { isConnected } = useLiveSensorUpdates(() => {
    // Update timestamp when new data arrives
    queryClient.invalidateQueries({ queryKey: ['sensors', 'readings'] });
  });

  // Handle manual refresh
  const handleRefresh = () => {
    refetchReadings();
    queryClient.invalidateQueries({ queryKey: ['sensors'] });
  };

  // Loading state
  const isLoading = sensorsLoading || readingsLoading;
  if (isLoading && !sensors && !readings) {
    return (
      <div className="eco-page-container">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Error state
  const hasError = sensorsError || readingsError;
  if (hasError && !sensors) {
    return (
      <div className="eco-page-container">
        <EcoEmptyState
          icon={Radio}
          title="Unable to Load Sensors"
          description="Could not connect to the backend server. Please ensure the server is running and try again."
          action={
            <button onClick={handleRefresh} className="eco-btn-primary">
              Try Again
            </button>
          }
        />
      </div>
    );
  }

  // Empty state
  if (!sensors || sensors.length === 0) {
    return (
      <div className="eco-page-container">
        <EcoEmptyState
          icon={Radio}
          title="No Sensors Found"
          description="No sensors have been registered yet. Register sensors to start monitoring energy data."
          action={
            <button
              onClick={() => {
                // Navigate to sensor registration (future feature)
                console.log('Navigate to sensor registration');
              }}
              className="eco-btn-primary"
            >
              Register Sensor
            </button>
          }
        />
      </div>
    );
  }

  // Create a map of readings by sensor ID
  const readingsMap = new Map(
    readings?.map((r) => [r.sensorId, r]) || []
  );

  return (
    <div className="eco-page-container">
      {/* Page Header */}
      <EcoPageHeader
        title="Device Monitoring"
        subtitle="Real-time monitoring for all connected energy sensors."
        status={isConnected ? 'connected' : 'disconnected'}
        statusLabel={isConnected ? 'Live' : 'Offline'}
        onRefresh={handleRefresh}
        isRefreshing={readingsLoading}
      />

      <div className="space-y-6">
        {/* Info Card */}
        <EcoCard compact>
          <div className="flex items-start gap-3">
            <div className="eco-icon-container mt-0.5">
              <Radio className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1A312C] dark:text-[#89D7B7] mb-1">
                Real-time Sensor Monitoring
              </p>
              <p className="text-sm text-[rgb(var(--color-neutral-600))]">
                Monitoring {sensors.length} sensor{sensors.length !== 1 ? 's' : ''}. 
                Data updates automatically every 10 seconds and in real-time via WebSocket.
              </p>
            </div>
          </div>
        </EcoCard>

        {/* Sensor Grid */}
        <div className="eco-grid-2">
          {sensors.map((sensor) => {
            const reading = readingsMap.get(sensor.id);

            return (
              <SensorMonitoringCard
                key={sensor.id}
                sensorId={sensor.id}
                sensorName={sensor.name}
                sensorLocation={sensor.location}
                reading={reading}
                isLoading={readingsLoading && !reading}
                error={readingsError ? 'Failed to load sensor data' : undefined}
                onRetry={refetchReadings}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

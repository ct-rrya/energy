import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getThemeColors } from '@/lib/theme';
import {
  Plus,
  Radio,
  RefreshCw,
  Key,
  Trash2,
  Search,
  Filter,
  Circle,
} from 'lucide-react';
import { sensorsService } from '@/api/services/sensors.service';
import { RegisterSensorDialog } from '../components/RegisterSensorDialog';
import { ApiKeyModal } from '../components/ApiKeyModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { showToast } from '@/components/common/Toast';
import type { Sensor, SensorWithApiKey, CreateSensorDto, SensorStatus } from '@/types/sensor.types';

/**
 * Sensors Management Page
 * 
 * Complete sensor management interface for System Administrators
 * - Register new sensors
 * - View all sensors
 * - Edit sensor details
 * - Regenerate API keys
 * - Delete sensors
 */
export function SensorsManagementPage() {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const colors = getThemeColors(theme);
  const queryClient = useQueryClient();

  // Check authorization - Check if user is System Admin
  const isSystemAdmin = !!(isAuthenticated && user && user.role === 'SYSTEM_ADMIN');

  // State
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [apiKeyData, setApiKeyData] = useState<{ apiKey: string; sensorName: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SensorStatus | 'all'>('all');

  // Fetch sensors
  const {
    data: sensorsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sensors', 'management'],
    queryFn: async () => {
      const response = await sensorsService.getAll();
      return response.data;
    },
    enabled: isSystemAdmin, // Only fetch if user is system admin
  });

  const sensors = sensorsData || [];

  // Register sensor mutation
  const registerMutation = useMutation({
    mutationFn: (data: CreateSensorDto) => sensorsService.create(data),
    onSuccess: (response) => {
      const sensorWithKey = response.data as SensorWithApiKey;
      setIsRegisterDialogOpen(false);
      setApiKeyData({
        apiKey: sensorWithKey.apiKey,
        sensorName: sensorWithKey.name,
      });
      queryClient.invalidateQueries({ queryKey: ['sensors'] });
      showToast('Sensor registered successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to register sensor', 'error');
    },
  });

  // Regenerate API key mutation
  const regenerateKeyMutation = useMutation({
    mutationFn: (id: string) => sensorsService.regenerateApiKey(id),
    onSuccess: (response) => {
      const sensorWithKey = response.data as SensorWithApiKey;
      setApiKeyData({
        apiKey: sensorWithKey.apiKey,
        sensorName: sensorWithKey.name,
      });
      queryClient.invalidateQueries({ queryKey: ['sensors'] });
      showToast('API key regenerated successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to regenerate API key', 'error');
    },
  });

  // Delete sensor mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => sensorsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensors'] });
      showToast('Sensor deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete sensor', 'error');
    },
  });

  // Handlers
  const handleRegister = (data: CreateSensorDto) => {
    registerMutation.mutate(data);
  };

  const handleRegenerateKey = (sensor: Sensor) => {
    if (window.confirm(`Regenerate API key for "${sensor.name}"?\n\nThe old key will become invalid immediately. You'll need to update the ESP32 device with the new key.`)) {
      regenerateKeyMutation.mutate(sensor.id);
    }
  };

  const handleDelete = (sensor: Sensor) => {
    if (window.confirm(`Delete sensor "${sensor.name}"?\n\nThis will mark the sensor as inactive. Historical data will be preserved but the device will no longer be able to send new readings.`)) {
      deleteMutation.mutate(sensor.id);
    }
  };

  // Filter sensors
  const filteredSensors = sensors.filter((sensor: Sensor) => {
    const matchesSearch = 
      sensor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sensor.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sensor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get status color
  const getStatusColor = (status: SensorStatus) => {
    switch (status) {
      case 'active':
        return '#10b981'; // green
      case 'inactive':
        return '#6b7280'; // gray
      case 'maintenance':
        return '#f59e0b'; // amber
      default:
        return colors.textSecondary;
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Authorization check
  if (!isSystemAdmin) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div
            className="rounded-lg p-8 text-center"
            style={{
              backgroundColor: colors.cardBackground,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
              style={{
                backgroundColor: theme === 'light' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.2)',
              }}
            >
              <Radio className="w-6 h-6 text-red-500" />
            </div>
            <h3
              className="text-base font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Access Denied
            </h3>
            <p
              className="text-sm"
              style={{ color: colors.textSecondary }}
            >
              This page is only accessible to System Administrators.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div
            className="rounded-lg p-8 text-center"
            style={{
              backgroundColor: colors.cardBackground,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
              style={{
                backgroundColor: theme === 'light' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.2)',
              }}
            >
              <Radio className="w-6 h-6 text-red-500" />
            </div>
            <h3
              className="text-base font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Unable to Load Sensors
            </h3>
            <p
              className="text-sm mb-6"
              style={{ color: colors.textSecondary }}
            >
              Could not connect to the server. Please ensure the server is running and try again.
            </p>
            <button
              onClick={() => refetch()}
              className="px-5 py-2.5 rounded-lg font-medium transition-colors duration-200"
              style={{
                backgroundColor: colors.accent,
                color: 'white',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#35c27b' : '#35c27b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.accent;
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div>
            <h1
              className="text-[32px] font-bold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Sensor Management
            </h1>
            <p
              className="text-sm max-w-2xl"
              style={{ color: colors.textSecondary }}
            >
              Register and manage ESP32 piezoelectric sensors for the EcoStep energy monitoring system.
            </p>
          </div>

          {/* Primary Action */}
          <button
            onClick={() => setIsRegisterDialogOpen(true)}
            className="px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors duration-200 whitespace-nowrap"
            style={{
              backgroundColor: colors.accent,
              color: 'white',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'light' ? '#35c27b' : '#35c27b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.accent;
            }}
          >
            <Plus className="w-5 h-5" strokeWidth={2} />
            <span>Register Sensor</span>
          </button>
        </div>

        {/* Filters and Search */}
        <div
          className="rounded-lg p-6 transition-colors duration-300"
          style={{
            backgroundColor: colors.cardBackground,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Filter
              className="w-4 h-4"
              style={{ color: colors.accent }}
              strokeWidth={2}
            />
            <span
              className="text-base font-semibold"
              style={{ color: colors.textPrimary }}
            >
              Filters
            </span>
            <div className="ml-auto">
              <span
                className="text-sm font-medium px-3 py-1 rounded-md"
                style={{
                  backgroundColor: theme === 'light' ? 'rgba(66, 132, 117, 0.1)' : 'rgba(137, 215, 183, 0.1)',
                  color: colors.accent,
                  border: `1px solid ${theme === 'light' ? 'rgba(66, 132, 117, 0.2)' : 'rgba(137, 215, 183, 0.2)'}`,
                }}
              >
                {filteredSensors.length} {filteredSensors.length === 1 ? 'sensor' : 'sensors'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label
                className="block text-xs font-medium mb-2"
                style={{ color: colors.textSecondary }}
              >
                Search
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: colors.textSecondary }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or location..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label
                className="block text-xs font-medium mb-2"
                style={{ color: colors.textSecondary }}
              >
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SensorStatus | 'all')}
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sensors Table */}
        {filteredSensors.length === 0 ? (
          /* Empty State */
          <div
            className="rounded-lg p-12 text-center transition-colors duration-300"
            style={{
              backgroundColor: colors.cardBackground,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
              style={{
                backgroundColor: theme === 'light' ? 'rgba(66, 132, 117, 0.1)' : 'rgba(137, 215, 183, 0.1)',
              }}
            >
              <Radio
                className="w-6 h-6"
                style={{ color: colors.accent }}
              />
            </div>
            <h3
              className="text-base font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              {searchQuery || statusFilter !== 'all' ? 'No Sensors Match Filters' : 'No Sensors Registered'}
            </h3>
            <p
              className="text-sm mb-6 max-w-md mx-auto"
              style={{ color: colors.textSecondary }}
            >
              {searchQuery || statusFilter !== 'all'
                ? 'No sensors match the current filter criteria. Try adjusting your filters or register a new sensor.'
                : 'Register your first ESP32 piezoelectric sensor to start monitoring energy generation.'}
            </p>
            <button
              onClick={() => setIsRegisterDialogOpen(true)}
              className="px-5 py-2.5 rounded-lg font-medium transition-colors duration-200 inline-flex items-center gap-2"
              style={{
                backgroundColor: colors.accent,
                color: 'white',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#35c27b' : '#35c27b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.accent;
              }}
            >
              <Plus className="w-5 h-5" strokeWidth={2} />
              <span>Register Sensor</span>
            </button>
          </div>
        ) : (
          <div
            className="rounded-lg overflow-hidden transition-colors duration-300"
            style={{
              backgroundColor: colors.cardBackground,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: colors.border }}>
              <h2
                className="text-[20px] font-semibold"
                style={{ color: colors.textPrimary }}
              >
                Registered Sensors
              </h2>
              <button
                onClick={() => refetch()}
                className="p-2 rounded-lg transition-colors"
                style={{ color: colors.textSecondary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.hoverBackground;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <th
                      className="text-left text-xs font-medium px-6 py-4"
                      style={{ color: colors.textSecondary }}
                    >
                      Sensor
                    </th>
                    <th
                      className="text-left text-xs font-medium px-6 py-4"
                      style={{ color: colors.textSecondary }}
                    >
                      Location
                    </th>
                    <th
                      className="text-left text-xs font-medium px-6 py-4"
                      style={{ color: colors.textSecondary }}
                    >
                      Status
                    </th>
                    <th
                      className="text-left text-xs font-medium px-6 py-4"
                      style={{ color: colors.textSecondary }}
                    >
                      Last Seen
                    </th>
                    <th
                      className="text-right text-xs font-medium px-6 py-4"
                      style={{ color: colors.textSecondary }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSensors.map((sensor: Sensor, index: number) => (
                    <tr
                      key={sensor.id}
                      style={{
                        borderBottom: index < filteredSensors.length - 1 ? `1px solid ${colors.border}` : 'none',
                      }}
                      className="transition-colors duration-150"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.hoverBackground;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: theme === 'light' ? 'rgba(66, 132, 117, 0.1)' : 'rgba(137, 215, 183, 0.1)',
                            }}
                          >
                            <Radio
                              className="w-5 h-5"
                              style={{ color: colors.accent }}
                            />
                          </div>
                          <div>
                            <div
                              className="text-sm font-medium"
                              style={{ color: colors.textPrimary }}
                            >
                              {sensor.name}
                            </div>
                            {sensor.metadata?.model && (
                              <div
                                className="text-xs"
                                style={{ color: colors.textSecondary }}
                              >
                                {sensor.metadata.model}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-sm"
                          style={{ color: colors.textPrimary }}
                        >
                          {sensor.location}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Circle
                            className="w-2 h-2 fill-current"
                            style={{ color: getStatusColor(sensor.status) }}
                          />
                          <span
                            className="text-sm capitalize"
                            style={{ color: colors.textPrimary }}
                          >
                            {sensor.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-sm"
                          style={{ color: colors.textSecondary }}
                        >
                          {formatDate(sensor.lastSeenAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRegenerateKey(sensor)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: colors.textSecondary }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.hoverBackground;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title="Regenerate API Key"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sensor)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: colors.textSecondary }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.hoverBackground;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title="Delete Sensor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y" style={{ borderColor: colors.border }}>
              {filteredSensors.map((sensor: Sensor) => (
                <div key={sensor.id} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: theme === 'light' ? 'rgba(66, 132, 117, 0.1)' : 'rgba(137, 215, 183, 0.1)',
                      }}
                    >
                      <Radio
                        className="w-6 h-6"
                        style={{ color: colors.accent }}
                      />
                    </div>
                    <div className="flex-1">
                      <div
                        className="text-sm font-medium mb-1"
                        style={{ color: colors.textPrimary }}
                      >
                        {sensor.name}
                      </div>
                      <div
                        className="text-xs mb-2"
                        style={{ color: colors.textSecondary }}
                      >
                        {sensor.location}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Circle
                          className="w-2 h-2 fill-current"
                          style={{ color: getStatusColor(sensor.status) }}
                        />
                        <span
                          className="text-xs capitalize"
                          style={{ color: colors.textPrimary }}
                        >
                          {sensor.status}
                        </span>
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: colors.textSecondary }}
                      >
                        Last seen: {formatDate(sensor.lastSeenAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRegenerateKey(sensor)}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: colors.hoverBackground,
                        color: colors.textPrimary,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <Key className="w-4 h-4" />
                      Regenerate Key
                    </button>
                    <button
                      onClick={() => handleDelete(sensor)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Register Sensor Dialog */}
      <RegisterSensorDialog
        open={isRegisterDialogOpen}
        onClose={() => setIsRegisterDialogOpen(false)}
        onRegister={handleRegister}
        isRegistering={registerMutation.isPending}
      />

      {/* API Key Modal */}
      {apiKeyData && (
        <ApiKeyModal
          apiKey={apiKeyData.apiKey}
          sensorName={apiKeyData.sensorName}
          onClose={() => setApiKeyData(null)}
        />
      )}
    </div>
  );
}

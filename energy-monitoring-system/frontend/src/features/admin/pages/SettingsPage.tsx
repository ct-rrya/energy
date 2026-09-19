import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { EcoPageHeader } from '@/components/common/EcoPageHeader';
import { EcoCard } from '@/components/common';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { showToast } from '@/components/common/Toast';
import { healthService } from '@/api/services';
import { Server, Database, Activity, Clock, Calendar, RefreshCw } from 'lucide-react';

interface SystemPreferences {
  timezone: string;
  timeFormat: '12-hour' | '24-hour';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY';
  dashboardRefresh: 5 | 10 | 30 | 60;
}

interface HealthStatus {
  status: string;
  version: string;
  environment: string;
  database: {
    status: string;
    state?: string;
    responseTime?: number;
  };
  timestamp: string;
}

/**
 * Admin Settings Page
 * 
 * Provides system preferences and system information.
 */
export function SettingsPage() {
  const { theme } = useTheme();
  const [preferences, setPreferences] = useState<SystemPreferences>({
    timezone: 'Asia/Manila',
    timeFormat: '12-hour',
    dateFormat: 'MM/DD/YYYY',
    dashboardRefresh: 10,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [iotDataStatus, setIotDataStatus] = useState<string>('checking');

  // Colors
  const colors = {
    cardBg: theme === 'light' ? '#FFFFFF' : '#1C1F28',
    textPrimary: theme === 'light' ? '#1F2937' : '#F9FAFB',
    textSecondary: theme === 'light' ? '#6B7280' : '#9CA3AF',
    border: theme === 'light' ? '#E5E7EB' : '#374151',
    inputBg: theme === 'light' ? '#F9FAFB' : '#111419',
    accent: '#10B981',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  };

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ecostep_preferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load preferences:', e);
      }
    }
  }, []);

  // Load health status
  useEffect(() => {
    loadHealthStatus();
    checkIotDataStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadHealthStatus();
      checkIotDataStatus();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadHealthStatus = async () => {
    try {
      const response = await healthService.check();
      setHealthStatus(response.data as any);
      setIsLoadingHealth(false);
    } catch (error) {
      console.error('Failed to load health status:', error);
      setIsLoadingHealth(false);
    }
  };

  const checkIotDataStatus = async () => {
    try {
      const response = await fetch('/api/public/telemetry');
      if (response.ok) {
        const data = await response.json();
        // Check if we have recent data (within last 5 minutes)
        const hasRecentData = data.data && data.data.telemetry && 
          new Date(data.data.telemetry.timestamp).getTime() > Date.now() - 5 * 60 * 1000;
        setIotDataStatus(hasRecentData ? 'receiving' : 'waiting');
      } else {
        setIotDataStatus('unavailable');
      }
    } catch (error) {
      setIotDataStatus('unavailable');
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('ecostep_preferences', JSON.stringify(preferences));
      
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      showToast('Preferences saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save preferences', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'healthy' || status === 'up' || status === 'connected' || status === 'receiving') {
      return colors.success;
    } else if (status === 'degraded' || status === 'waiting') {
      return colors.warning;
    } else {
      return colors.error;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'up': return 'Connected';
      case 'connected': return 'Connected';
      case 'receiving': return 'Receiving data';
      case 'waiting': return 'Waiting for device data';
      case 'unavailable': return 'Unavailable';
      default: return 'Unknown';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <EcoPageHeader
          title="Settings"
          subtitle="Configure EcoStep system behavior and application preferences"
        />

        {/* System Preferences */}
        <EcoCard className="mt-6">
          <div className="mb-6">
            <h2 className="eco-card-title">System Preferences</h2>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Configure general preferences for how EcoStep displays and operates
            </p>
          </div>
          <div className="space-y-6">
            {/* Timezone */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5" style={{ color: colors.textSecondary }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    Timezone
                  </p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    Display timezone for timestamps
                  </p>
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200"
                  style={{
                    backgroundColor: colors.inputBg,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <option value="Asia/Manila">Asia/Manila (PHT)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
            </div>

            {/* Time Format */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5" style={{ color: colors.textSecondary }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    Time Format
                  </p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    12-hour or 24-hour display
                  </p>
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={preferences.timeFormat}
                  onChange={(e) => setPreferences({ ...preferences, timeFormat: e.target.value as '12-hour' | '24-hour' })}
                  className="w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200"
                  style={{
                    backgroundColor: colors.inputBg,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <option value="12-hour">12-hour</option>
                  <option value="24-hour">24-hour</option>
                </select>
              </div>
            </div>

            {/* Date Format */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5" style={{ color: colors.textSecondary }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    Date Format
                  </p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    Date display preference
                  </p>
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={preferences.dateFormat}
                  onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value as 'MM/DD/YYYY' | 'DD/MM/YYYY' })}
                  className="w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200"
                  style={{
                    backgroundColor: colors.inputBg,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                </select>
              </div>
            </div>

            {/* Dashboard Refresh Interval */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5" style={{ color: colors.textSecondary }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    Dashboard Refresh
                  </p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    Auto-refresh interval for live data
                  </p>
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={preferences.dashboardRefresh}
                  onChange={(e) => setPreferences({ ...preferences, dashboardRefresh: Number(e.target.value) as 5 | 10 | 30 | 60 })}
                  className="w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200"
                  style={{
                    backgroundColor: colors.inputBg,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <option value="5">5 seconds</option>
                  <option value="10">10 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="60">60 seconds</option>
                </select>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
              <Button
                onClick={handleSavePreferences}
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        </EcoCard>

        {/* System Information */}
        <EcoCard className="mt-6">
          <div className="mb-6">
            <h2 className="eco-card-title">System Information</h2>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              View EcoStep application and service information
            </p>
          </div>
          <div className="space-y-4">
            {isLoadingHealth ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.accent }} />
                <p className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
                  Loading system information...
                </p>
              </div>
            ) : (
              <>
                {/* Application Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem
                    label="Application"
                    value="EcoStep"
                    colors={colors}
                  />
                  <InfoItem
                    label="Version"
                    value={healthStatus?.version || '1.0.0'}
                    colors={colors}
                  />
                  <InfoItem
                    label="Environment"
                    value={healthStatus?.environment || 'Production'}
                    colors={colors}
                  />
                  {healthStatus && 'system' in healthStatus && (healthStatus as any).system?.uptime && (
                    <InfoItem
                      label="Uptime"
                      value={formatUptime((healthStatus as any).system.uptime)}
                      colors={colors}
                    />
                  )}
                </div>

                {/* Service Status */}
                <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
                  <h4 className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>
                    Service Status
                  </h4>
                  <div className="space-y-3">
                    <StatusItem
                      icon={<Server className="h-4 w-4" />}
                      label="Backend"
                      status={healthStatus?.status || 'unknown'}
                      statusText={getStatusText(healthStatus?.status || 'unavailable')}
                      statusColor={getStatusColor(healthStatus?.status || 'unavailable')}
                      colors={colors}
                    />
                    <StatusItem
                      icon={<Database className="h-4 w-4" />}
                      label="Database"
                      status={healthStatus?.database?.status || 'unknown'}
                      statusText={getStatusText(healthStatus?.database?.state || healthStatus?.database?.status || 'unavailable')}
                      statusColor={getStatusColor(healthStatus?.database?.status || 'unavailable')}
                      responseTime={healthStatus?.database?.responseTime}
                      colors={colors}
                    />
                    <StatusItem
                      icon={<Activity className="h-4 w-4" />}
                      label="IoT Data"
                      status={iotDataStatus}
                      statusText={getStatusText(iotDataStatus)}
                      statusColor={getStatusColor(iotDataStatus)}
                      colors={colors}
                    />
                  </div>
                </div>

                {/* Last Updated */}
                {healthStatus?.timestamp && (
                  <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      Last updated: {new Date(healthStatus.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </EcoCard>
      </div>
    </DashboardLayout>
  );
}

// Helper Components
function InfoItem({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <div>
      <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>
        {label}
      </p>
      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
        {value}
      </p>
    </div>
  );
}

function StatusItem({
  icon,
  label,
  status,
  statusText,
  statusColor,
  responseTime,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  status: string;
  statusText: string;
  statusColor: string;
  responseTime?: number;
  colors: any;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div style={{ color: colors.textSecondary }}>
          {icon}
        </div>
        <span className="text-sm" style={{ color: colors.textPrimary }}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <span className="text-sm font-medium" style={{ color: statusColor }}>
            {statusText}
          </span>
        </div>
        {responseTime !== undefined && (
          <span className="text-xs" style={{ color: colors.textSecondary }}>
            ({responseTime}ms)
          </span>
        )}
      </div>
    </div>
  );
}
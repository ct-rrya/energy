import { useState, useEffect, lazy, Suspense } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/permissions';
import { 
  Zap, 
  Activity,
  Download,
  ChevronDown,
  Settings,
  Bell
} from 'lucide-react';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { useLiveSensorData } from '../hooks/useLiveSensorData';
import { PublicUserBanner } from '@/components/common/PublicUserBanner';
import { getThemeColors, SPACING, TYPOGRAPHY } from '@/lib/theme';

// Task 9.3: Lazy load ChartsLayoutContainer for performance optimization
const ChartsLayoutContainer = lazy(() => import('../components/ChartsLayoutContainer').then(module => ({ default: module.ChartsLayoutContainer })));

/**
 * EcoStep Dashboard Page - Redesigned
 * Clean, consolidated layout with strong visual hierarchy
 */
export function DashboardPage() {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  
  // Determine user role
  const userRole = getUserRole(isAuthenticated, user);
  const isPublicUser = userRole === 'public';

  // Fetch dashboard data
  const {
    data: metrics,
  } = useDashboardMetrics();

  const {
    data: systemStatus,
  } = useSystemHealth();

  const { lastReading } = useLiveSensorData();

  // Filter dropdown state (persisted)
  const [selectedFilter, setSelectedFilter] = useState(() => {
    return localStorage.getItem('dashboard-filter') || 'all';
  });
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Persist filter selection
  useEffect(() => {
    localStorage.setItem('dashboard-filter', selectedFilter);
  }, [selectedFilter]);

  // Use centralized theme colors
  const colors = getThemeColors(theme);

  // Filter options for the compact dropdown
  const filterOptions = [
    { value: 'all', label: 'All Metrics' },
    { value: 'power', label: 'Power & Energy' },
    { value: 'electrical', label: 'Voltage & Current' },
    { value: 'sensors', label: 'Sensor Status' },
    { value: 'alerts', label: 'Alerts & Issues' },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Public User Banner */}
        {isPublicUser && (
          <PublicUserBanner />
        )}
        
        {/* Header Section with Status Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ 
                color: colors.textPrimary,
                fontWeight: TYPOGRAPHY.fontWeight.bold
              }}
            >
              EcoStep Central
            </h1>
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: systemStatus?.database === 'connected' ? colors.success : colors.error }}
              />
              <p 
                className="text-sm sm:text-base"
                style={{ 
                  color: colors.textPrimarySecondary,
                  fontSize: TYPOGRAPHY.fontSize.sm
                }}
              >
                Real-time energy, activity, and system monitoring
              </p>
            </div>
          </div>

          {/* Quick Actions - Actual action buttons */}
          <div className="flex items-center gap-2">
            <button
              disabled={isPublicUser}
              aria-label="Open settings"
              className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg flex items-center gap-2 transition-colors duration-200"
              style={{
                backgroundColor: colors.cardBackground,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
                opacity: isPublicUser ? 0.5 : 1,
                cursor: isPublicUser ? 'not-allowed' : 'pointer',
                pointerEvents: isPublicUser ? 'none' : 'auto',
                fontWeight: TYPOGRAPHY.fontWeight.medium
              }}
              onMouseEnter={(e) => {
                if (!isPublicUser) {
                  e.currentTarget.style.backgroundColor = colors.hoverBackground;
                }
              }}
              onMouseLeave={(e) => {
                if (!isPublicUser) {
                  e.currentTarget.style.backgroundColor = colors.cardBackground;
                }
              }}
              aria-disabled={isPublicUser}
            >
              <Settings className="w-4 h-4 sm:mr-2" aria-hidden="true" />
              <span className="text-sm font-medium hidden sm:inline">Settings</span>
            </button>
            <button
              disabled={isPublicUser}
              aria-label="View alerts (3 unread)"
              className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg flex items-center gap-2 transition-colors duration-200 relative"
              style={{
                backgroundColor: colors.cardBackground,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
                opacity: isPublicUser ? 0.5 : 1,
                cursor: isPublicUser ? 'not-allowed' : 'pointer',
                pointerEvents: isPublicUser ? 'none' : 'auto',
                fontWeight: TYPOGRAPHY.fontWeight.medium
              }}
              onMouseEnter={(e) => {
                if (!isPublicUser) {
                  e.currentTarget.style.backgroundColor = colors.hoverBackground;
                }
              }}
              onMouseLeave={(e) => {
                if (!isPublicUser) {
                  e.currentTarget.style.backgroundColor = colors.cardBackground;
                }
              }}
              aria-disabled={isPublicUser}
            >
              <Bell className="w-4 h-4 sm:mr-2" aria-hidden="true" />
              <span className="text-sm font-medium hidden sm:inline">Alerts</span>
              {/* Only show notification badge for admin users */}
              {!isPublicUser && (
                <div 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: colors.error }}
                >
                  3
                </div>
              )}
            </button>
            <button
              disabled={isPublicUser}
              aria-label="Export data"
              className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg flex items-center gap-2 transition-colors duration-200"
              style={{
                backgroundColor: colors.cardBackground,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
                opacity: isPublicUser ? 0.5 : 1,
                cursor: isPublicUser ? 'not-allowed' : 'pointer',
                pointerEvents: isPublicUser ? 'none' : 'auto',
                fontWeight: TYPOGRAPHY.fontWeight.medium
              }}
              onMouseEnter={(e) => {
                if (!isPublicUser) {
                  e.currentTarget.style.backgroundColor = colors.hoverBackground;
                }
              }}
              onMouseLeave={(e) => {
                if (!isPublicUser) {
                  e.currentTarget.style.backgroundColor = colors.cardBackground;
                }
              }}
              aria-disabled={isPublicUser}
            >
              <Download className="w-4 h-4 sm:mr-2" aria-hidden="true" />
              <span className="text-sm font-medium hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Compact Filter Bar */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full sm:w-auto min-w-[240px] px-4 py-3 rounded-lg flex items-center justify-between gap-3 transition-colors duration-200"
            style={{
              backgroundColor: colors.cardBackground,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
              fontWeight: TYPOGRAPHY.fontWeight.medium
            }}
          >
            <span className="text-sm font-medium">
              {filterOptions.find(opt => opt.value === selectedFilter)?.label}
            </span>
            <ChevronDown 
              className="w-4 h-4 transition-transform duration-200"
              style={{ 
                transform: isFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                color: colors.textPrimarySecondary
              }}
            />
          </button>

          {/* Dropdown Menu */}
          {isFilterOpen && (
            <div 
              className="absolute top-full mt-2 w-full sm:w-auto min-w-[240px] rounded-lg overflow-hidden z-10"
              style={{
                backgroundColor: colors.elevatedBackground,
                border: `1px solid ${colors.border}`,
                boxShadow: colors.shadowLg
              }}
            >
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedFilter(option.value);
                    setIsFilterOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm transition-colors duration-150"
                  style={{
                    color: selectedFilter === option.value ? colors.accent : colors.textPrimary,
                    backgroundColor: selectedFilter === option.value ? (theme === 'light' ? colors.voltageLight : colors.voltageDark) : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedFilter !== option.value) {
                      e.currentTarget.style.backgroundColor = colors.hoverBackground;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedFilter !== option.value) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Primary Metrics - 4 Chips in a row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Voltage */}
          <div 
            className="rounded-3xl p-4 sm:p-6 transition-all duration-200 hover:scale-[1.02]"
            style={{
              backgroundColor: theme === 'light' ? colors.voltageLight : colors.voltageDark,
            }}
          >
            <div 
              className="text-xs sm:text-sm font-medium mb-2"
              style={{ color: colors.textSecondary }}
            >
              Voltage
            </div>
            <div 
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: colors.accent }}
            >
              {lastReading?.voltage?.toFixed(1) || '0.0'}
              <span className="text-base sm:text-lg ml-1" style={{ color: colors.textSecondary }}>V</span>
            </div>
          </div>

          {/* Current */}
          <div 
            className="rounded-3xl p-4 sm:p-6 transition-all duration-200 hover:scale-[1.02]"
            style={{
              backgroundColor: theme === 'light' ? colors.currentLight : colors.currentDark,
            }}
          >
            <div 
              className="text-xs sm:text-sm font-medium mb-2"
              style={{ color: colors.textSecondary }}
            >
              Current
            </div>
            <div 
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: '#F59E0B' }}
            >
              {lastReading?.current?.toFixed(2) || '0.00'}
              <span className="text-base sm:text-lg ml-1" style={{ color: colors.textSecondary }}>A</span>
            </div>
          </div>

          {/* Power */}
          <div 
            className="rounded-3xl p-4 sm:p-6 transition-all duration-200 hover:scale-[1.02]"
            style={{
              backgroundColor: theme === 'light' ? colors.powerLight : colors.powerDark,
            }}
          >
            <div 
              className="text-xs sm:text-sm font-medium mb-2"
              style={{ color: colors.textSecondary }}
            >
              Power
            </div>
            <div 
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: '#3B82F6' }}
            >
              {lastReading?.power?.toFixed(1) || '0.0'}
              <span className="text-base sm:text-lg ml-1" style={{ color: colors.textSecondary }}>W</span>
            </div>
          </div>

          {/* Energy */}
          <div 
            className="rounded-3xl p-4 sm:p-6 transition-all duration-200 hover:scale-[1.02]"
            style={{
              backgroundColor: theme === 'light' ? colors.energyLight : colors.energyDark,
            }}
          >
            <div 
              className="text-xs sm:text-sm font-medium mb-2"
              style={{ color: colors.textSecondary }}
            >
              Energy Today
            </div>
            <div 
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: '#F59E0B' }}
            >
              {metrics?.dailyEnergy?.toFixed(2) || '0.00'}
              <span className="text-base sm:text-lg ml-1" style={{ color: colors.textSecondary }}>kWh</span>
            </div>
          </div>
        </div>

        {/* Secondary Metrics - Step Count and Capacitor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Step Count */}
          <div 
            className="rounded-3xl p-4 sm:p-6 transition-all duration-200 hover:scale-[1.02]"
            style={{
              backgroundColor: theme === 'light' ? colors.voltageLight : colors.voltageDark,
            }}
          >
            <div 
              className="text-xs sm:text-sm font-medium mb-2"
              style={{ color: colors.textSecondary }}
            >
              Step Count
            </div>
            <div 
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: colors.accent }}
            >
              {lastReading?.stepCount !== undefined ? lastReading.stepCount : '—'}
              <span className="text-base sm:text-lg ml-1" style={{ color: colors.textSecondary }}>steps</span>
            </div>
            {!lastReading?.stepCount && (
              <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                No step data available
              </p>
            )}
          </div>

          {/* Capacitor Voltage */}
          <div 
            className="rounded-3xl p-4 sm:p-6 transition-all duration-200 hover:scale-[1.02]"
            style={{
              backgroundColor: theme === 'light' ? colors.powerLight : colors.powerDark,
            }}
          >
            <div 
              className="text-xs sm:text-sm font-medium mb-2"
              style={{ color: colors.textSecondary }}
            >
              Capacitor Voltage
            </div>
            <div 
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: '#3B82F6' }}
            >
              {lastReading?.capacitorVoltage !== undefined ? lastReading.capacitorVoltage.toFixed(1) : '—'}
              <span className="text-base sm:text-lg ml-1" style={{ color: colors.textSecondary }}>V</span>
            </div>
            {!lastReading?.capacitorVoltage && (
              <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                No capacitor data available
              </p>
            )}
          </div>
        </div>

        {/* System Status Indicators */}
        <div 
          className="rounded-3xl p-6 transition-colors duration-300"
          style={{
            backgroundColor: colors.cardBackground,
            boxShadow: theme === 'light' 
              ? '0 4px 20px rgba(0,0,0,0.05)' 
              : 'none'
          }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: colors.textPrimary }}
          >
            System Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Wi-Fi Status */}
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ 
                  backgroundColor: lastReading?.wifiConnected === true 
                    ? colors.accent 
                    : lastReading?.wifiConnected === false 
                    ? '#EF4444' 
                    : colors.textSecondary 
                }}
              />
              <div className="flex-1">
                <p 
                  className="text-sm font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  Wi-Fi
                </p>
                <p 
                  className="text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  {lastReading?.wifiConnected === true 
                    ? 'Connected' 
                    : lastReading?.wifiConnected === false 
                    ? 'Disconnected' 
                    : 'Unknown'}
                </p>
              </div>
            </div>

            {/* Bluetooth Status */}
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ 
                  backgroundColor: lastReading?.bluetoothConnected === true 
                    ? colors.accent 
                    : lastReading?.bluetoothConnected === false 
                    ? '#EF4444' 
                    : colors.textSecondary 
                }}
              />
              <div className="flex-1">
                <p 
                  className="text-sm font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  Bluetooth
                </p>
                <p 
                  className="text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  {lastReading?.bluetoothConnected === true 
                    ? 'Connected' 
                    : lastReading?.bluetoothConnected === false 
                    ? 'Disconnected' 
                    : 'Unknown'}
                </p>
              </div>
            </div>

            {/* Data Transfer Status */}
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0 animate-pulse"
                style={{ 
                  backgroundColor: lastReading 
                    ? colors.accent 
                    : colors.textSecondary 
                }}
              />
              <div className="flex-1">
                <p 
                  className="text-sm font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  Data Transfer
                </p>
                <p 
                  className="text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  {lastReading ? 'Receiving' : 'Waiting for Data'}
                </p>
                {lastReading?.timestamp && (
                  <p 
                    className="text-xs mt-0.5"
                    style={{ color: colors.textSecondary }}
                  >
                    Last: {new Date(lastReading.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Featured Power Output Card - Real-time data only, no placeholder sparkline */}
        <div 
          className="rounded-3xl p-6 transition-all duration-300"
          style={{
            backgroundColor: colors.cardBackground,
            boxShadow: theme === 'light' 
              ? '0 8px 30px rgba(0,0,0,0.08)' 
              : '0 8px 30px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 
                className="text-sm font-medium mb-2"
                style={{ color: colors.textSecondary }}
              >
                Live Power Output
              </h3>
              <div 
                className="text-5xl font-bold"
                style={{ color: colors.accent }}
              >
                {lastReading?.power?.toFixed(1) || '0.0'}
                <span className="text-2xl ml-2" style={{ color: colors.textSecondary }}>Watts</span>
              </div>
            </div>
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: theme === 'light' ? colors.voltageLight : colors.voltageDark,
                color: colors.accent
              }}
            >
              <Zap className="w-7 h-7" strokeWidth={2} />
            </div>
          </div>
          
          {/* Sparkline removed - placeholder data removed per requirements 11.6, 11.7 */}
          {!lastReading && (
            <div className="h-20 flex items-center justify-center">
              <p 
                className="text-sm"
                style={{ color: colors.textSecondary }}
              >
                Waiting for sensor data
              </p>
            </div>
          )}
        </div>

        {/* Charts Section - Full Width Analytics */}
        {/* Task 9.3: Lazy-loaded charts with Suspense boundary for performance */}
        <Suspense fallback={
          <div 
            className="rounded-3xl p-6 animate-pulse"
            style={{
              backgroundColor: colors.cardBackground,
              boxShadow: theme === 'light' 
                ? '0 8px 30px rgba(0,0,0,0.08)' 
                : '0 8px 30px rgba(0,0,0,0.4)',
              height: '400px',
            }}
          >
            <div 
              className="h-6 w-48 rounded mb-2"
              style={{ backgroundColor: theme === 'light' ? '#E5E7EB' : '#2A2E37' }}
            />
            <div 
              className="h-4 w-64 rounded mb-6"
              style={{ backgroundColor: theme === 'light' ? '#E5E7EB' : '#2A2E37' }}
            />
            <div 
              className="h-64 rounded-xl"
              style={{ backgroundColor: theme === 'light' ? '#F9FAFB' : '#12141A' }}
            />
          </div>
        }>
          <ChartsLayoutContainer />
        </Suspense>

        {/* Sensor Nodes / Recent Readings Section - Removed hard-coded data */}
        {/* Real sensor data will be displayed when sensors are connected and transmitting */}
        <div 
          className="rounded-3xl p-6 transition-colors duration-300"
          style={{
            backgroundColor: colors.cardBackground,
            boxShadow: theme === 'light' 
              ? '0 4px 20px rgba(0,0,0,0.05)' 
              : 'none'
          }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: colors.textPrimary }}
          >
            Sensor Nodes
          </h3>

          {/* Empty state for sensor nodes */}
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{
                backgroundColor: theme === 'light' ? 'rgba(26, 49, 44, 0.06)' : 'rgba(255, 255, 255, 0.06)'
              }}
            >
              <Activity 
                className="w-8 h-8"
                style={{
                  color: theme === 'light' ? 'rgba(26, 49, 44, 0.4)' : 'rgba(255, 255, 255, 0.3)'
                }}
              />
            </div>
            <p 
              className="text-sm font-medium mb-2"
              style={{ color: colors.textPrimary }}
            >
              No sensor data available
            </p>
            <p 
              className="text-xs text-center max-w-sm"
              style={{ color: colors.textSecondary }}
            >
              Waiting for sensor data. Connect ESP32 sensors to view real-time node status and readings.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
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
import { ChartsLayoutContainer } from '../components/ChartsLayoutContainer';

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

  // Color system based on theme
  const colors = {
    cardBg: theme === 'light' ? '#FFFFFF' : '#1C1F26',
    text: theme === 'light' ? '#1A1D23' : '#EDEEF0',
    subtext: theme === 'light' ? '#6B7280' : '#9CA3AF',
    accent: theme === 'light' ? '#2FBF71' : '#3ED98A',
    border: theme === 'light' ? '#E5E7EB' : '#2A2E37',
    hoverBg: theme === 'light' ? '#F9FAFB' : '#12141A',
    
    // Metric chips with more subtle colors
    voltageLight: '#E8F8EF',
    voltageDark: '#1E2B24',
    currentLight: '#FEF3E7',
    currentDark: '#2B2620',
    powerLight: '#EAF0FD',
    powerDark: '#1F2430',
    energyLight: '#FEF3E7',
    energyDark: '#2B2520',
  };

  // Filter options for the compact dropdown
  const filterOptions = [
    { value: 'all', label: 'All Metrics' },
    { value: 'power', label: 'Power & Energy' },
    { value: 'electrical', label: 'Voltage & Current' },
    { value: 'sensors', label: 'Sensor Status' },
    { value: 'alerts', label: 'Alerts & Issues' },
  ];

  // Sensor nodes data (mock - replace with actual data)
  const sensorNodes = [
    { 
      id: 1, 
      name: 'Entrance Tile A1', 
      location: 'Main Entrance', 
      status: 'Active',
      voltage: '5.2V',
      current: '0.48A',
      timestamp: '2 min ago',
      statusColor: theme === 'light' ? '#2FBF71' : '#3ED98A',
      statusBg: theme === 'light' ? '#E8F8EF' : '#16261D'
    },
    { 
      id: 2, 
      name: 'Hallway Tile B3', 
      location: 'West Corridor', 
      status: 'Active',
      voltage: '4.8V',
      current: '0.42A',
      timestamp: '5 min ago',
      statusColor: theme === 'light' ? '#2FBF71' : '#3ED98A',
      statusBg: theme === 'light' ? '#E8F8EF' : '#16261D'
    },
    { 
      id: 3, 
      name: 'Lobby Tile C2', 
      location: 'Lobby Area', 
      status: 'Idle',
      voltage: '3.1V',
      current: '0.15A',
      timestamp: '12 min ago',
      statusColor: theme === 'light' ? '#F59E0B' : '#FBBF24',
      statusBg: theme === 'light' ? '#FEF3E7' : '#2B2520'
    },
    { 
      id: 4, 
      name: 'Exit Tile D1', 
      location: 'Emergency Exit', 
      status: 'Offline',
      voltage: '0.0V',
      current: '0.00A',
      timestamp: '45 min ago',
      statusColor: theme === 'light' ? '#EF4444' : '#F87171',
      statusBg: theme === 'light' ? '#FEECEC' : '#2A1717'
    },
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
              className="text-3xl font-bold mb-2"
              style={{ color: colors.text }}
            >
              EcoStep Dashboard
            </h1>
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: systemStatus?.database === 'connected' ? colors.accent : '#EF4444' }}
              />
              <p 
                className="text-sm"
                style={{ color: colors.subtext }}
              >
                System {systemStatus?.database === 'connected' ? 'Online' : 'Offline'} · Real-time monitoring active
              </p>
            </div>
          </div>

          {/* Quick Actions - Actual action buttons */}
          <div className="flex items-center gap-2">
            <button
              disabled={isPublicUser}
              className="px-4 py-2 rounded-xl flex items-center gap-2 transition-colors duration-200"
              style={{
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                opacity: isPublicUser ? 0.5 : 1,
                cursor: isPublicUser ? 'not-allowed' : 'pointer',
                pointerEvents: isPublicUser ? 'none' : 'auto'
              }}
              onMouseEnter={(e) => {
                if (!isPublicUser) {
                  e.currentTarget.style.backgroundColor = colors.hoverBg;
                }
              }}
              onMouseLeave={(e) => {
                if (!isPublicUser) {
                  e.currentTarget.style.backgroundColor = colors.cardBg;
                }
              }}
              aria-disabled={isPublicUser}
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Settings</span>
            </button>
            <button
              disabled={isPublicUser}
              className="px-4 py-2 rounded-xl flex items-center gap-2 transition-colors duration-200 relative"
              style={{
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                opacity: isPublicUser ? 0.5 : 1,
                cursor: isPublicUser ? 'not-allowed' : 'pointer',
                pointerEvents: isPublicUser ? 'none' : 'auto'
              }}
              onMouseEnter={(e) => {
                if (!isPublicUser) {
                  e.currentTarget.style.backgroundColor = colors.hoverBg;
                }
              }}
              onMouseLeave={(e) => {
                if (!isPublicUser) {
                  e.currentTarget.style.backgroundColor = colors.cardBg;
                }
              }}
              aria-disabled={isPublicUser}
            >
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Alerts</span>
              {/* Only show notification badge for admin users */}
              {!isPublicUser && (
                <div 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: '#EF4444' }}
                >
                  3
                </div>
              )}
            </button>
            <button
              disabled={isPublicUser}
              className="px-4 py-2 rounded-xl flex items-center gap-2 transition-colors duration-200"
              style={{
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                opacity: isPublicUser ? 0.5 : 1,
                cursor: isPublicUser ? 'not-allowed' : 'pointer',
                pointerEvents: isPublicUser ? 'none' : 'auto'
              }}
              onMouseEnter={(e) => {
                if (!isPublicUser) {
                  e.currentTarget.style.backgroundColor = colors.hoverBg;
                }
              }}
              onMouseLeave={(e) => {
                if (!isPublicUser) {
                  e.currentTarget.style.backgroundColor = colors.cardBg;
                }
              }}
              aria-disabled={isPublicUser}
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Compact Filter Bar */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full sm:w-auto min-w-[240px] px-4 py-3 rounded-xl flex items-center justify-between gap-3 transition-colors duration-200"
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              color: colors.text
            }}
          >
            <span className="text-sm font-medium">
              {filterOptions.find(opt => opt.value === selectedFilter)?.label}
            </span>
            <ChevronDown 
              className="w-4 h-4 transition-transform duration-200"
              style={{ 
                transform: isFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                color: colors.subtext 
              }}
            />
          </button>

          {/* Dropdown Menu */}
          {isFilterOpen && (
            <div 
              className="absolute top-full mt-2 w-full sm:w-auto min-w-[240px] rounded-xl overflow-hidden z-10"
              style={{
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
                boxShadow: theme === 'light' 
                  ? '0 10px 40px rgba(0,0,0,0.1)' 
                  : '0 10px 40px rgba(0,0,0,0.5)'
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
                    color: selectedFilter === option.value ? colors.accent : colors.text,
                    backgroundColor: selectedFilter === option.value ? (theme === 'light' ? colors.voltageLight : colors.voltageDark) : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedFilter !== option.value) {
                      e.currentTarget.style.backgroundColor = colors.hoverBg;
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Voltage */}
          <div 
            className="rounded-3xl p-6 transition-all duration-200 hover:scale-[1.02]"
            style={{
              backgroundColor: theme === 'light' ? colors.voltageLight : colors.voltageDark,
            }}
          >
            <div 
              className="text-xs font-medium mb-2"
              style={{ color: colors.subtext }}
            >
              Voltage
            </div>
            <div 
              className="text-3xl font-bold"
              style={{ color: colors.accent }}
            >
              {lastReading?.voltage?.toFixed(1) || '0.0'}
              <span className="text-lg ml-1" style={{ color: colors.subtext }}>V</span>
            </div>
          </div>

          {/* Current */}
          <div 
            className="rounded-3xl p-6 transition-all duration-200 hover:scale-[1.02]"
            style={{
              backgroundColor: theme === 'light' ? colors.currentLight : colors.currentDark,
            }}
          >
            <div 
              className="text-xs font-medium mb-2"
              style={{ color: colors.subtext }}
            >
              Current
            </div>
            <div 
              className="text-3xl font-bold"
              style={{ color: '#F59E0B' }}
            >
              {lastReading?.current?.toFixed(2) || '0.00'}
              <span className="text-lg ml-1" style={{ color: colors.subtext }}>A</span>
            </div>
          </div>

          {/* Power */}
          <div 
            className="rounded-3xl p-6 transition-all duration-200 hover:scale-[1.02]"
            style={{
              backgroundColor: theme === 'light' ? colors.powerLight : colors.powerDark,
            }}
          >
            <div 
              className="text-xs font-medium mb-2"
              style={{ color: colors.subtext }}
            >
              Power
            </div>
            <div 
              className="text-3xl font-bold"
              style={{ color: '#3B82F6' }}
            >
              {lastReading?.power?.toFixed(1) || '0.0'}
              <span className="text-lg ml-1" style={{ color: colors.subtext }}>W</span>
            </div>
          </div>

          {/* Energy */}
          <div 
            className="rounded-3xl p-6 transition-all duration-200 hover:scale-[1.02]"
            style={{
              backgroundColor: theme === 'light' ? colors.energyLight : colors.energyDark,
            }}
          >
            <div 
              className="text-xs font-medium mb-2"
              style={{ color: colors.subtext }}
            >
              Energy Today
            </div>
            <div 
              className="text-3xl font-bold"
              style={{ color: '#F59E0B' }}
            >
              {metrics?.dailyEnergy?.toFixed(2) || '0.00'}
              <span className="text-lg ml-1" style={{ color: colors.subtext }}>kWh</span>
            </div>
          </div>
        </div>

        {/* Featured Power Output Card with Sparkline */}
        <div 
          className="rounded-3xl p-6 transition-all duration-300"
          style={{
            backgroundColor: colors.cardBg,
            boxShadow: theme === 'light' 
              ? '0 8px 30px rgba(0,0,0,0.08)' 
              : '0 8px 30px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 
                className="text-sm font-medium mb-2"
                style={{ color: colors.subtext }}
              >
                Live Power Output
              </h3>
              <div 
                className="text-5xl font-bold"
                style={{ color: colors.accent }}
              >
                {lastReading?.power?.toFixed(1) || '0.0'}
                <span className="text-2xl ml-2" style={{ color: colors.subtext }}>Watts</span>
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
          
          {/* Sparkline */}
          <div className="h-20 flex items-end gap-1">
            {[3, 7, 5, 9, 6, 8, 4, 10, 7, 9, 6, 8, 5, 9, 8, 7, 10, 6, 9, 8].map((height, idx) => (
              <div 
                key={idx}
                className="flex-1 rounded-t transition-all duration-300"
                style={{
                  height: `${height * 8}%`,
                  backgroundColor: colors.accent,
                  opacity: 0.6
                }}
              />
            ))}
          </div>
        </div>

        {/* Charts Section - Full Width Analytics */}
        <ChartsLayoutContainer />

        {/* Sensor Nodes / Recent Readings Section */}
        <div 
          className="rounded-3xl p-6 transition-colors duration-300"
          style={{
            backgroundColor: colors.cardBg,
            boxShadow: theme === 'light' 
              ? '0 4px 20px rgba(0,0,0,0.05)' 
              : 'none'
          }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: colors.text }}
          >
            Sensor Nodes
          </h3>

          <div className="space-y-3">
            {sensorNodes.map((node) => (
              <div 
                key={node.id}
                className="rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-200 hover:scale-[1.01]"
                style={{
                  backgroundColor: theme === 'light' ? '#F9FAFB' : '#12141A',
                  border: `1px solid ${colors.border}`,
                }}
              >
                {/* Status Circle */}
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: node.statusColor }}
                />

                {/* Node Info */}
                <div className="flex-1 min-w-0">
                  <div 
                    className="text-sm font-semibold mb-1"
                    style={{ color: colors.text }}
                  >
                    {node.name}
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: colors.subtext }}
                  >
                    {node.location}
                  </div>
                </div>

                {/* Status Pill */}
                <div 
                  className="px-3 py-1 rounded-full text-xs font-medium w-fit"
                  style={{
                    backgroundColor: node.statusBg,
                    color: node.statusColor
                  }}
                >
                  {node.status}
                </div>

                {/* Metadata */}
                <div className="flex gap-6">
                  <div>
                    <div 
                      className="text-[10px] font-medium mb-0.5"
                      style={{ color: colors.subtext }}
                    >
                      READING
                    </div>
                    <div 
                      className="text-xs font-semibold"
                      style={{ color: colors.text }}
                    >
                      {node.voltage} / {node.current}
                    </div>
                  </div>
                  <div>
                    <div 
                      className="text-[10px] font-medium mb-0.5"
                      style={{ color: colors.subtext }}
                    >
                      UPDATED
                    </div>
                    <div 
                      className="text-xs font-semibold"
                      style={{ color: colors.text }}
                    >
                      {node.timestamp}
                    </div>
                  </div>
                </div>

                {/* Action Icons */}
                <div className="flex gap-2">
                  <button 
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
                    style={{
                      backgroundColor: theme === 'light' ? '#FFFFFF' : '#1C1F26',
                      border: `1px solid ${colors.border}`,
                      color: colors.accent
                    }}
                    aria-label="View details"
                  >
                    <Activity className="w-4 h-4" strokeWidth={2} />
                  </button>
                  <button 
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
                    style={{
                      backgroundColor: theme === 'light' ? '#FFFFFF' : '#1C1F26',
                      border: `1px solid ${colors.border}`,
                      color: colors.accent
                    }}
                    aria-label="Download data"
                  >
                    <Download className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

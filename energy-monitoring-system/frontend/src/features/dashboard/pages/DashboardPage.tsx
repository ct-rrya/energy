import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Zap, 
  Activity,
  Battery,
  TrendingUp,
  Users,
  AlertTriangle,
  Settings,
  Download,
  ChevronDown
} from 'lucide-react';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { useLiveSensorData } from '../hooks/useLiveSensorData';

/**
 * Healthcare-Inspired Dashboard Page
 * Two-panel layout: Quick Actions (left) + Main Content (right)
 */
export function DashboardPage() {
  const { theme } = useTheme();

  // Fetch dashboard data
  const {
    data: metrics,
  } = useDashboardMetrics();

  const {
    data: systemStatus,
  } = useSystemHealth();

  const { lastReading } = useLiveSensorData();

  // Quick Actions panel collapse state (persisted)
  const [isQuickActionsExpanded, setIsQuickActionsExpanded] = useState(() => {
    // Default based on screen size
    const isDesktop = window.innerWidth >= 1024;
    const saved = localStorage.getItem('quick-actions-expanded');
    return saved ? JSON.parse(saved) : isDesktop;
  });

  // Persist quick actions state
  useEffect(() => {
    localStorage.setItem('quick-actions-expanded', JSON.stringify(isQuickActionsExpanded));
  }, [isQuickActionsExpanded]);

  // Color system based on theme
  const colors = {
    cardBg: theme === 'light' ? '#FFFFFF' : '#1C1F26',
    text: theme === 'light' ? '#1A1D23' : '#EDEEF0',
    subtext: theme === 'light' ? '#6B7280' : '#9CA3AF',
    accent: theme === 'light' ? '#2FBF71' : '#3ED98A',
    border: theme === 'light' ? '#E5E7EB' : '#2A2E37',
    
    // Pastel chips
    voltageLight: '#E8F8EF',
    voltageDark: '#1E2B24',
    currentLight: '#FDF3E7',
    currentDark: '#2B2620',
    powerLight: '#EAF0FD',
    powerDark: '#1F2430',
    energyLight: '#FEF3E7',
    energyDark: '#2B2520',
  };

  // Quick action cards data
  const quickActions = [
    { icon: Zap, label: 'Live Voltage', value: `${lastReading?.voltage?.toFixed(1) || '0.0'}V`, color: colors.accent },
    { icon: Activity, label: 'Live Current', value: `${lastReading?.current?.toFixed(2) || '0.00'}A`, color: colors.accent },
    { icon: Battery, label: 'Power Output', value: `${lastReading?.power?.toFixed(1) || '0.0'}W`, color: colors.accent },
    { icon: TrendingUp, label: 'Energy Stored', value: `${metrics?.dailyEnergy?.toFixed(2) || '0.00'} kWh`, color: colors.accent },
    { icon: Users, label: 'Foot Traffic', value: '1,247', color: colors.accent },
    { icon: Settings, label: 'System Status', value: systemStatus?.database === 'connected' ? 'Online' : 'Offline', color: colors.accent },
    { icon: AlertTriangle, label: 'Alerts', value: '3', color: '#EF4444' },
    { icon: Download, label: 'Data Export', value: 'Export', color: colors.accent },
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
    <div className="min-h-screen p-8">
      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL - Collapsible Quick Actions */}
        <div className={`transition-all duration-300 ${isQuickActionsExpanded ? 'lg:col-span-4' : 'lg:col-span-4'}`}>
          <div 
            className="rounded-3xl transition-all duration-300 overflow-hidden"
            style={{
              backgroundColor: colors.cardBg,
              boxShadow: theme === 'light' 
                ? '0 4px 20px rgba(0,0,0,0.05)' 
                : 'none',
              height: isQuickActionsExpanded ? 'auto' : '64px'
            }}
          >
            {/* Header with Toggle - Always visible */}
            <div className="flex items-center justify-between px-6 py-5">
              <h2 
                className="text-lg font-semibold truncate"
                style={{ color: colors.text }}
              >
                What do you want to check?
              </h2>
              <button
                onClick={() => setIsQuickActionsExpanded(!isQuickActionsExpanded)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5 flex-shrink-0 ml-4"
                style={{ color: colors.subtext }}
                aria-label={isQuickActionsExpanded ? 'Collapse panel' : 'Expand panel'}
              >
                <div 
                  className="transition-transform duration-250"
                  style={{
                    transform: isQuickActionsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'
                  }}
                >
                  <ChevronDown className="w-5 h-5" strokeWidth={2} />
                </div>
              </button>
            </div>

            {/* Collapsible Content - Only visible when expanded */}
            {isQuickActionsExpanded && (
              <div 
                className="px-6 pb-6 transition-opacity duration-250"
                style={{
                  opacity: isQuickActionsExpanded ? 1 : 0
                }}
              >
                <p 
                  className="text-sm mb-6"
                  style={{ color: colors.subtext }}
                >
                  Select your requirement
                </p>

                {/* Quick Action Grid - 2 columns */}
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      className="rounded-2xl p-4 text-left transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: theme === 'light' ? '#F5F6F8' : '#12141A',
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                        style={{
                          backgroundColor: theme === 'light' ? '#E8F8EF' : '#1E2B24',
                          color: action.color
                        }}
                      >
                        <action.icon className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div 
                        className="text-xs font-medium mb-1"
                        style={{ color: colors.subtext }}
                      >
                        {action.label}
                      </div>
                      <div 
                        className="text-sm font-bold"
                        style={{ color: colors.text }}
                      >
                        {action.value}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - Main Content (expands when left panel collapses) */}
        <div className={`transition-all duration-300 ${isQuickActionsExpanded ? 'lg:col-span-8' : 'lg:col-span-8'} space-y-6`}>
          
          {/* Header */}
          <div>
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ color: colors.text }}
            >
              EcoStep Overview
            </h1>
            <p 
              className="text-sm"
              style={{ color: colors.subtext }}
            >
              Monitor your energy harvesting system in real-time
            </p>
          </div>

          {/* Metric Chips Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Voltage Chip */}
            <div 
              className="rounded-2xl p-4"
              style={{
                backgroundColor: theme === 'light' ? colors.voltageLight : colors.voltageDark,
              }}
            >
              <div 
                className="text-xs font-medium mb-1"
                style={{ color: colors.subtext }}
              >
                Voltage
              </div>
              <div 
                className="text-2xl font-bold"
                style={{ color: colors.accent }}
              >
                {lastReading?.voltage?.toFixed(1) || '0.0'}<span className="text-sm ml-1">V</span>
              </div>
            </div>

            {/* Current Chip */}
            <div 
              className="rounded-2xl p-4"
              style={{
                backgroundColor: theme === 'light' ? colors.currentLight : colors.currentDark,
              }}
            >
              <div 
                className="text-xs font-medium mb-1"
                style={{ color: colors.subtext }}
              >
                Current
              </div>
              <div 
                className="text-2xl font-bold"
                style={{ color: '#F59E0B' }}
              >
                {lastReading?.current?.toFixed(2) || '0.00'}<span className="text-sm ml-1">A</span>
              </div>
            </div>

            {/* Power Chip */}
            <div 
              className="rounded-2xl p-4"
              style={{
                backgroundColor: theme === 'light' ? colors.powerLight : colors.powerDark,
              }}
            >
              <div 
                className="text-xs font-medium mb-1"
                style={{ color: colors.subtext }}
              >
                Power
              </div>
              <div 
                className="text-2xl font-bold"
                style={{ color: '#3B82F6' }}
              >
                {lastReading?.power?.toFixed(1) || '0.0'}<span className="text-sm ml-1">W</span>
              </div>
            </div>

            {/* Energy Chip */}
            <div 
              className="rounded-2xl p-4"
              style={{
                backgroundColor: theme === 'light' ? colors.energyLight : colors.energyDark,
              }}
            >
              <div 
                className="text-xs font-medium mb-1"
                style={{ color: colors.subtext }}
              >
                Energy
              </div>
              <div 
                className="text-2xl font-bold"
                style={{ color: '#F59E0B' }}
              >
                {metrics?.dailyEnergy?.toFixed(2) || '0.00'}<span className="text-sm ml-1">kWh</span>
              </div>
            </div>
          </div>

          {/* Featured Metric Card - Elevated */}
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
                  className="text-sm font-medium mb-1"
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
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: theme === 'light' ? colors.voltageLight : colors.voltageDark,
                  color: colors.accent
                }}
              >
                <Zap className="w-6 h-6" strokeWidth={2} />
              </div>
            </div>
            
            {/* Mini Sparkline Placeholder */}
            <div className="h-16 flex items-end gap-1">
              {[3, 7, 5, 9, 6, 8, 4, 10, 7, 9, 6, 8, 5, 9, 8].map((height, idx) => (
                <div 
                  key={idx}
                  className="flex-1 rounded-t transition-all duration-300"
                  style={{
                    height: `${height * 6}%`,
                    backgroundColor: colors.accent,
                    opacity: 0.6
                  }}
                />
              ))}
            </div>
          </div>

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
              Sensor Nodes / Recent Readings
            </h3>

            <div className="space-y-3">
              {sensorNodes.map((node) => (
                <div 
                  key={node.id}
                  className="rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 hover:scale-[1.01]"
                  style={{
                    backgroundColor: theme === 'light' ? '#F5F6F8' : '#12141A',
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
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: node.statusBg,
                      color: node.statusColor
                    }}
                  >
                    {node.status}
                  </div>

                  {/* Metadata - Two Columns */}
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
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200"
                      style={{
                        backgroundColor: theme === 'light' ? '#FFFFFF' : '#1C1F26',
                        color: colors.accent
                      }}
                    >
                      <Activity className="w-4 h-4" strokeWidth={2} />
                    </button>
                    <button 
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200"
                      style={{
                        backgroundColor: theme === 'light' ? '#FFFFFF' : '#1C1F26',
                        color: colors.accent
                      }}
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
    </div>
  );
}

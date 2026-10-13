
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getUserRole } from '@/lib/permissions';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { useLiveSensorData } from '../hooks/useLiveSensorData';
import { DashboardHeader } from '../components/DashboardHeader';
import { MetricCard } from '../components/MetricCard';
import { DashboardErrorBoundary } from '../components/DashboardErrorBoundary';
import { validateSensorData } from '../utils/validateSensorData';
import { useEffect, useState } from 'react';
import type { SensorReading } from '../types/dashboard.types';

/**
 * EcoStep Dashboard Page - Hero Energy Dashboard Redesign
 * 
 * Real-time monitoring dashboard with hero-focused layout.
 * Energy output (kWh) is the primary KPI displayed prominently in a large hero card.
 * 
 * Layout Structure (Requirements 1.1-1.7, 13.1-13.6):
 * - Header: Title, subtitle, date/time, system status badge
 * - Hero Section (60-65% width): Large energy card with trend, mini graph, and AI insight
 * - Metrics Column (35-40% width): Four stacked metric cards (Voltage, Power, Current, Steps)
 * - Desktop: Side-by-side layout with 24px gap
 * - Tablet: Metrics in 2x2 grid below hero
 * - Mobile: Fully stacked vertical layout
 * 
 * Visual Hierarchy (Requirements 3.1-3.2, 12.7):
 * - Hero card is approximately 2x larger than any individual metric card
 * - Typography size differences establish hierarchy
 * - Clean, data-first design without gradients or glowing effects
 * 
 * Data Handling:
 * - Real-time sensor data via WebSocket (Requirements 16.1-16.10)
 * - Daily energy metrics via REST API (Requirements 17.1-17.7)
 * - Last-known-good data caching for fallback (Requirements 19.2-19.6)
 * - Data validation before rendering (Requirements 16.7-16.10, 17.6)
 * 
 * Requirements: 1.1-1.7, 2.1-2.9, 3.1-3.8, 4.1-4.7, 7.1-7.7, 8.1-8.9, 9.1-9.9, 
 *               10.1-10.9, 11.1-11.10, 12.1-12.9, 13.1-13.6, 
 *               16.1-16.10, 17.1-17.7, 19.2-19.6, 20.1-20.8
 */
function DashboardPageContent() {
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();
  
  // Determine user role (Requirements 18.1-18.7)
  const userRole = getUserRole(isAuthenticated, user);
  const isPublicUser = userRole === 'public';

  // Fetch dashboard data with error and loading states (Requirements 16.1-16.3, 17.1-17.5)
  const { 
    data: metrics,
  } = useDashboardMetrics();
  
  const { 
    data: systemStatus,
  } = useSystemHealth();
  
  const { lastReading, isConnected: isWebSocketConnected } = useLiveSensorData();

  // Last known good data cache for fallback (Requirements 19.2, 19.5)
  const [lastGoodReading, setLastGoodReading] = useState<SensorReading | undefined>(undefined);
  const [lastGoodMetrics, setLastGoodMetrics] = useState<typeof metrics>(undefined);

  // Update cache when new valid data arrives (Requirements 19.4, 19.6)
  useEffect(() => {
    if (lastReading) {
      const validationResult = validateSensorData(lastReading);
      if (validationResult.isValid) {
        setLastGoodReading(lastReading);
      } else {
        console.warn('[Dashboard] Sensor reading validation failed:', validationResult.errors);
      }
    }
  }, [lastReading]);

  useEffect(() => {
    if (metrics && validateMetrics(metrics)) {
      setLastGoodMetrics(metrics);
    }
  }, [metrics]);

  // Metrics validation function (Requirement 17.6)
  const validateMetrics = (data: typeof metrics): boolean => {
    if (!data) return false;
    
    // Validate dailyEnergy is reasonable (0-1000 kWh)
    if (data.dailyEnergy !== undefined && (data.dailyEnergy < 0 || data.dailyEnergy > 1000)) {
      console.warn('[Dashboard] Invalid daily energy value:', data.dailyEnergy);
      return false;
    }
    
    return true;
  };

  // Use cached data as fallback when validation fails (Requirements 19.2, 19.6)
  const displayReading = (() => {
    if (lastReading) {
      const validationResult = validateSensorData(lastReading);
      if (validationResult.isValid) {
        return lastReading;
      }
    }
    return lastGoodReading;
  })();
  
  const displayMetrics = metrics && validateMetrics(metrics)
    ? metrics
    : lastGoodMetrics;

  // Determine system status for header (Requirements 2.6-2.9)
  const getSystemStatus = (): 'connected' | 'disconnected' | 'unknown' => {
    if (systemStatus?.database === 'connected') return 'connected';
    if (systemStatus?.database === 'disconnected') return 'disconnected';
    return 'unknown';
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: theme === 'dark' ? '#0B132B' : '#F5F7FA',
        padding: '16px 24px', // Page padding (Requirements 1.7)
      }}
    >
      <div 
        className="max-w-[1600px] mx-auto"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px', // Reduced section gap for compact layout (Requirements 1.7)
        }}
      >
        
        {/* Dashboard Header with date/time and system status (Requirements 2.1-2.9) */}
        <DashboardHeader
          title="EcoStep Central"
          subtitle="Real-time monitoring of piezoelectric energy harvesting system"
          systemStatus={getSystemStatus()}
          isPublicUser={isPublicUser}
          isWebSocketConnected={isWebSocketConnected}
        />

        {/* Main Metrics Grid - Power as hero, then Steps, Voltage, Current */}
        
        {/* Global responsive layout styles */}
        <style>{`
          /* Mobile: Stacked layout (default) */
          .dashboard-metrics-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          
          .metric-hero-power {
            width: 100%;
          }
          
          .dashboard-secondary-metrics {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          
          /* Tablet: Power hero above, 3 metrics in row below */
          @media (min-width: 768px) and (max-width: 1023px) {
            .dashboard-metrics-grid {
              display: flex;
              flex-direction: column;
              gap: 24px;
            }
            
            .metric-hero-power {
              width: 100%;
            }
            
            .dashboard-secondary-metrics {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
            }
          }
          
          /* Desktop: Power hero (60%) left, 3 metrics stacked (40%) right */
          @media (min-width: 1024px) {
            .dashboard-metrics-grid {
              display: flex;
              flex-direction: row;
              gap: 24px;
            }
            
            .metric-hero-power {
              width: 60%;
              flex-basis: 60%;
              flex-grow: 0;
              flex-shrink: 1;
            }
            
            .dashboard-secondary-metrics {
              width: 40%;
              flex-basis: 40%;
              flex-grow: 0;
              flex-shrink: 1;
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
          }
        `}</style>
        
        <div className="dashboard-metrics-grid">
          
          {/* Hero Power Card - Prominent display */}
          <div className="metric-hero-power">
            <MetricCard
              label="Power Output"
              value={displayReading?.power}
              unit="mW"
              precision={4}
              color="amber"
            />
          </div>

          {/* Secondary Metrics - Steps, Voltage, Current */}
          <div className="dashboard-secondary-metrics">
            
            {/* Step Count */}
            <div className="metric-steps">
              <MetricCard
                label="Steps Today"
                value={displayMetrics?.todayTotalSteps}
                unit=""
                precision={0}
                color="accent"
              />
            </div>

            {/* Voltage */}
            <div className="metric-voltage">
              <MetricCard
                label="Voltage"
                value={displayReading?.voltage}
                unit="V"
                precision={2}
                color="accent"
              />
            </div>

            {/* Current */}
            <div className="metric-current">
              <MetricCard
                label="Current"
                value={displayReading?.current}
                unit="A"
                precision={4}
                color="blue"
              />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

/**
 * Dashboard Page with Error Boundary
 * Wraps DashboardPageContent with error boundary for error handling
 * Requirements: 19.1 - Error boundary at page level
 */
export function DashboardPage() {
  return (
    <DashboardErrorBoundary onReset={() => window.location.reload()}>
      <DashboardPageContent />
    </DashboardErrorBoundary>
  );
}
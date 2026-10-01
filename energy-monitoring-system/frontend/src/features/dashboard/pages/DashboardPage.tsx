
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getUserRole } from '@/lib/permissions';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { useLiveSensorData } from '../hooks/useLiveSensorData';
import { PublicUserBanner } from '@/components/common/PublicUserBanner';
import { DashboardHeader } from '../components/DashboardHeader';
import { HeroEnergyCard } from '../components/HeroEnergyCard';
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
    isLoading: metricsLoading, 
    isError: metricsError,
    refetch: refetchMetrics,
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

  // Show loading state when initial data is loading (Requirement 17.3)
  const isInitialLoading = metricsLoading && !lastGoodMetrics;

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
        
        {/* Public User Banner - Conditionally rendered (Requirements 18.3) */}
        {isPublicUser && <PublicUserBanner />}
        
        {/* Dashboard Header with date/time and system status (Requirements 2.1-2.9) */}
        <DashboardHeader
          title="EcoStep Central"
          subtitle="Real-time monitoring of piezoelectric energy harvesting system"
          systemStatus={getSystemStatus()}
          isPublicUser={isPublicUser}
          isWebSocketConnected={isWebSocketConnected}
        />

        {/* Hero Layout: Hero Card (left) + Metrics Column (right) */}
        {/* Requirements 1.3-1.7, 13.1-13.6, 14.1-14.6 */}
        
        {/* Global responsive layout styles */}
        <style>{`
          /* Mobile: Stacked layout (default) - Requirements 15.1-15.6 */
          /* Requirement 15.1: Stack all components vertically */
          /* Requirement 15.4: Apply 16px vertical spacing between all components */
          .dashboard-hero-layout {
            display: flex;
            flex-direction: column;
            gap: 16px; /* Requirement 15.4: 16px vertical gap */
          }
          
          /* Requirement 15.3: Render hero card at full width */
          .dashboard-hero-section {
            width: 100%;
          }
          
          /* Requirement 15.2: Display metrics in order: Voltage, Power, Current, Steps */
          /* Requirement 15.3: Render each metric card at full width */
          /* Requirement 15.4: Apply 16px vertical spacing between components */
          .dashboard-metrics-section {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 16px; /* Requirement 15.4: 16px vertical gap */
          }
          
          /* Tablet: Hero full width above, metrics in 2x2 grid below */
          /* Requirements 14.1-14.6: 768px - 1023px breakpoint */
          @media (min-width: 768px) and (max-width: 1023px) {
            .dashboard-hero-layout {
              display: flex;
              flex-direction: column;
              gap: 24px; /* Requirement 14.1: Hero above, metrics below */
            }
            
            .dashboard-hero-section {
              width: 100%; /* Requirement 14.1: Hero full width */
            }
            
            .dashboard-metrics-section {
              width: 100%;
              display: grid;
              grid-template-columns: repeat(2, 1fr); /* Requirement 14.2: 2x2 grid */
              grid-template-rows: repeat(2, 1fr);
              gap: 16px; /* Requirement 14.5: 16px grid gap */
            }
            
            /* Requirement 14.3: Voltage in position 1 (row 1, col 1) */
            .metric-voltage {
              grid-row: 1;
              grid-column: 1;
            }
            
            /* Requirement 14.3: Power in position 2 (row 1, col 2) */
            .metric-power {
              grid-row: 1;
              grid-column: 2;
            }
            
            /* Requirement 14.4: Current in position 3 (row 2, col 1) */
            .metric-current {
              grid-row: 2;
              grid-column: 1;
            }
            
            /* Requirement 14.4: Steps in position 4 (row 2, col 2) */
            .metric-steps {
              grid-row: 2;
              grid-column: 2;
            }
          }
          
          /* Desktop: Side-by-side layout */
          /* Requirements 13.1-13.6: 1024px and above */
          @media (min-width: 1024px) {
            .dashboard-hero-layout {
              display: flex;
              flex-direction: row;
              gap: 24px; /* Requirement 1.7: 24px horizontal spacing */
            }
            
            .dashboard-hero-section {
              width: 62%; /* Requirement 1.3: 60-65% width */
              flex-basis: 62%;
              flex-grow: 0;
              flex-shrink: 1;
            }
            
            .dashboard-metrics-section {
              width: 38%; /* Requirement 1.4-1.5: 35-40% width */
              flex-basis: 38%;
              flex-grow: 0;
              flex-shrink: 1;
              display: flex;
              flex-direction: column;
              gap: 16px; /* Requirement 7.3: 16px vertical spacing */
            }
          }
        `}</style>
        
        <div className="dashboard-hero-layout">
          
          {/* Hero Energy Card - Full width on mobile/tablet, 60-65% on desktop */}
          <div className="dashboard-hero-section">
            <HeroEnergyCard
              energyValue={displayMetrics?.dailyEnergy}
              previousDayEnergy={undefined}
              trendData={[]}
              aiInsight={undefined}
              isLoading={isInitialLoading}
              isError={metricsError}
              onRetry={refetchMetrics}
            />
          </div>

          {/* Metrics Section - Stacked on mobile, 2x2 grid on tablet, column on desktop */}
          <div className="dashboard-metrics-section">
            
            {/* Voltage Metric Card (Requirements 8.1-8.9) */}
            {/* Requirement 14.3: Row 1, Column 1 on tablet */}
            <div className="metric-voltage">
              <MetricCard
                label="Voltage"
                value={displayReading?.voltage}
                unit="V"
                precision={1}
                color="accent"
              />
            </div>

            {/* Power Metric Card (Requirements 9.1-9.9) */}
            {/* Requirement 14.3: Row 1, Column 2 on tablet */}
            <div className="metric-power">
              <MetricCard
                label="Power"
                value={displayReading?.power}
                unit="W"
                precision={1}
                color="amber"
              />
            </div>

            {/* Current Metric Card (Requirements 10.1-10.9) */}
            {/* Requirement 14.4: Row 2, Column 1 on tablet */}
            <div className="metric-current">
              <MetricCard
                label="Current"
                value={displayReading?.current}
                unit="A"
                precision={2}
                color="blue"
              />
            </div>

            {/* Step Count Metric Card (Requirements 11.1-11.10) */}
            {/* Requirement 14.4: Row 2, Column 2 on tablet */}
            <div className="metric-steps">
              <MetricCard
                label="Steps Today"
                value={displayReading?.stepCount}
                unit=""
                precision={0}
                color="accent"
                
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
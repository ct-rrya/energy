import { useState, useEffect } from 'react';
import { Zap, Activity, Power, Battery } from 'lucide-react';
import api, { type TelemetryData } from '../../../lib/api';

/**
 * Props for the TelemetryDisplay component
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.9
 */
interface TelemetryDisplayProps {
  refreshInterval?: number; // Default: 10000ms (10s)
  className?: string;
}

/**
 * Responsive CSS styles for TelemetryDisplay
 * Requirements: 4.12 - Mobile-friendly responsive design
 */
const telemetryStyles = `
  @media (max-width: 768px) {
    .telemetry-display {
      padding: 16px !important;
      border-radius: 16px !important;
    }

    .telemetry-display h3 {
      font-size: 18px !important;
    }

    .metric-grid {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
    }

    .metric-card {
      padding: 12px !important;
    }

    .metric-card-icon {
      width: 40px !important;
      height: 40px !important;
    }

    .metric-card-icon svg {
      width: 20px !important;
      height: 20px !important;
    }

    .metric-value {
      font-size: 20px !important;
    }

    .metric-unit {
      font-size: 13px !important;
    }
  }

  @media (max-width: 480px) {
    .telemetry-display {
      padding: 12px !important;
      border-radius: 12px !important;
    }

    .telemetry-display h3 {
      font-size: 16px !important;
    }

    .status-indicator {
      font-size: 12px !important;
      padding: 4px 10px !important;
    }

    .metric-card {
      padding: 10px !important;
      gap: 12px !important;
    }

    .metric-label {
      font-size: 11px !important;
    }

    .metric-value {
      font-size: 18px !important;
    }
  }

  /* Tablet - 2 column grid */
  @media (min-width: 769px) and (max-width: 1024px) {
    .metric-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }

  /* Touch device optimization */
  @media (hover: none) and (pointer: coarse) {
    .metric-card {
      min-height: 80px;
    }
  }

  /* Reduced motion support - Requirement 18.9 */
  @media (prefers-reduced-motion: reduce) {
    .metric-card {
      transition: none !important;
    }
    
    .metric-card:hover {
      transform: none !important;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('telemetry-responsive-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'telemetry-responsive-styles';
  styleSheet.textContent = telemetryStyles;
  document.head.appendChild(styleSheet);
}

/**
 * Format timestamp to relative time (e.g., "Updated 5s ago")
 * 
 * Requirements: 9.2
 */
function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  
  if (diffSeconds < 10) {
    return 'Updated just now';
  } else if (diffSeconds < 60) {
    return `Updated ${diffSeconds}s ago`;
  } else if (diffMinutes === 1) {
    return 'Updated 1 min ago';
  } else if (diffMinutes < 60) {
    return `Updated ${diffMinutes} mins ago`;
  } else {
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) {
      return 'Updated 1 hour ago';
    }
    return `Updated ${diffHours} hours ago`;
  }
}

/**
 * MetricCard Component
 * 
 * Displays a single telemetry metric with icon, label, value, and unit.
 * Styled with glass morphism matching EcoStep design system.
 * Includes ARIA labels for screen reader accessibility.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 12.4, 18.1
 */
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit: string;
  iconBgColor: string;
}

function MetricCard({ icon, label, value, unit, iconBgColor }: MetricCardProps) {
  // Detect reduced motion preference - Requirement 18.9
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      className="metric-card"
      role="article"
      aria-label={`${label}: ${value} ${unit}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        borderRadius: '18px',
        backgroundColor: 'rgba(255, 255, 255, 0.45)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.55)',
        boxShadow: '0 8px 30px rgba(26, 49, 44, 0.06)',
        transition: prefersReducedMotion ? 'none' : 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!prefersReducedMotion) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(26, 49, 44, 0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (!prefersReducedMotion) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(26, 49, 44, 0.06)';
        }
      }}
    >
      {/* Icon Badge */}
      <div
        className="metric-card-icon"
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: iconBgColor,
          boxShadow: '0 4px 12px rgba(26, 49, 44, 0.15)',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Metric Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="metric-label"
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#737373',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '4px',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#1A312C',
            letterSpacing: '-0.025em',
            display: 'flex',
            alignItems: 'baseline',
            gap: '4px',
          }}
        >
          <span className="metric-value">{value}</span>
          <span
            className="metric-unit"
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#737373',
            }}
          >
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * TelemetryDisplay Component
 * 
 * Displays real-time system telemetry data on the landing page.
 * Features:
 * - Auto-refresh polling at configurable interval (default 10s)
 * - Exponential backoff on errors
 * - Offline state handling
 * - Glass morphism design matching EcoStep brand
 * - Animated value transitions
 * - Full keyboard accessibility with ARIA labels
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 3.9, 9.2, 18.1, 18.3, 18.10
 */
export default function TelemetryDisplay({ 
  refreshInterval = 10000, // 10 seconds
  className = '' 
}: TelemetryDisplayProps) {
  // Telemetry data state
  const [telemetryData, setTelemetryData] = useState<TelemetryData | null>(null);
  
  // Loading state (true on first load only)
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Error state for displaying offline message
  const [error, setError] = useState<string | null>(null);
  
  // Dynamic polling interval for exponential backoff
  const [currentInterval, setCurrentInterval] = useState<number>(refreshInterval);
  
  // Previous telemetry data for screen reader announcements
  const [previousData, setPreviousData] = useState<TelemetryData | null>(null);

  /**
   * Fetch telemetry data from backend API
   * 
   * Requirements: 3.6, 3.9
   */
  const fetchTelemetry = async () => {
    try {
      const data = await api.telemetry.getCurrent();
      
      // Success - update data and reset interval
      setPreviousData(telemetryData);
      setTelemetryData(data);
      setError(null);
      setIsLoading(false);
      
      // Reset to normal interval on success
      if (currentInterval !== refreshInterval) {
        setCurrentInterval(refreshInterval);
      }
      
    } catch (err) {
      // Error handling with exponential backoff
      // Requirements: 3.8, 9.2, 18.10
      
      let errorMessage = 'System temporarily unavailable';
      
      if (err instanceof Error) {
        // Extract error message
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsLoading(false);
      
      // Exponential backoff: double the interval on error, max 60s
      // Requirements: 9.2
      setCurrentInterval(prev => Math.min(prev * 2, 60000));
    }
  };

  /**
   * Set up polling interval
   * Fetches data immediately on mount and then at regular intervals
   * Cleanup on unmount
   * 
   * Requirements: 3.9
   */
  useEffect(() => {
    // Fetch immediately on mount
    fetchTelemetry();
    
    // Set up polling interval
    const intervalId = setInterval(() => {
      fetchTelemetry();
    }, currentInterval);
    
    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [currentInterval]); // Re-create interval when currentInterval changes

  /**
   * Render loading state
   * Shown only on initial load
   */
  if (isLoading && !telemetryData) {
    return (
      <div
        className={`telemetry-display ${className}`}
        role="region"
        aria-label="System telemetry loading"
        style={{
          padding: '24px',
          borderRadius: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.55)',
          boxShadow: '0 8px 30px rgba(26, 49, 44, 0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            color: '#737373',
            fontSize: '14px',
          }}
          role="status"
          aria-live="polite"
        >
          Loading telemetry data...
        </div>
      </div>
    );
  }

  /**
   * Render error/offline state
   * Requirements: 3.8, 9.2, 18.10
   */
  if (error && !telemetryData) {
    return (
      <div
        className={`telemetry-display ${className}`}
        role="region"
        aria-label="System telemetry error"
        style={{
          padding: '24px',
          borderRadius: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.55)',
          boxShadow: '0 8px 30px rgba(26, 49, 44, 0.06)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <h3
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#1A312C',
              margin: 0,
            }}
          >
            Real-Time System Status
          </h3>
        </div>

        {/* Offline Message */}
        <div
          role="alert"
          aria-live="assertive"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            textAlign: 'center',
            gap: '12px',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px',
            }}
          >
            <Activity
              size={32}
              color="#EF4444"
              strokeWidth={2}
            />
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1A312C',
            }}
          >
            System Offline
          </div>
          <div
            style={{
              fontSize: '14px',
              color: '#737373',
              maxWidth: '300px',
            }}
          >
            {error}
          </div>
          <div
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(66, 132, 117, 0.1)',
              border: '1px solid rgba(66, 132, 117, 0.2)',
              fontSize: '13px',
              color: '#1E594D',
            }}
            role="status"
            aria-live="polite"
          >
            Retrying in {Math.round(currentInterval / 1000)}s...
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render telemetry data
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 12.4, 18.1, 18.3
   */
  if (!telemetryData) {
    return null;
  }

  return (
    <div
      className={`telemetry-display ${className}`}
      role="region"
      aria-label="Real-time system telemetry"
      style={{
        padding: '24px',
        borderRadius: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.45)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.55)',
        boxShadow: '0 8px 30px rgba(26, 49, 44, 0.06)',
      }}
    >
      {/* Screen reader announcement for data updates - Requirement 18.3 */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        style={{ 
          position: 'absolute', 
          left: '-10000px', 
          width: '1px', 
          height: '1px', 
          overflow: 'hidden' 
        }}
      >
        {previousData && telemetryData && (
          previousData.voltage !== telemetryData.voltage ||
          previousData.current !== telemetryData.current ||
          previousData.power !== telemetryData.power ||
          previousData.energyToday !== telemetryData.energyToday
        ) && `Telemetry updated: Power ${telemetryData.power.toFixed(2)} watts, Energy today ${telemetryData.energyToday.toFixed(3)} kilowatt hours`}
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <h3
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#1A312C',
            margin: 0,
          }}
        >
          ⚡ Real-Time System Status
        </h3>

        {/* Status Indicator */}
        <div
          className="status-indicator"
          role="status"
          aria-label={`System status: ${telemetryData.status}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '10px',
            backgroundColor: telemetryData.status === 'online' 
              ? 'rgba(137, 215, 183, 0.15)' 
              : 'rgba(239, 68, 68, 0.1)',
            border: telemetryData.status === 'online'
              ? '1px solid rgba(137, 215, 183, 0.3)'
              : '1px solid rgba(239, 68, 68, 0.2)',
            fontSize: '13px',
            fontWeight: 500,
            color: telemetryData.status === 'online' ? '#2D7A5F' : '#B91C1C',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: telemetryData.status === 'online' ? '#89D7B7' : '#EF4444',
            }}
          />
          {telemetryData.status === 'online' ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Metric Grid - 2x2 layout, responsive to 1 column on mobile */}
      <div
        className="metric-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        {/* Voltage */}
        <MetricCard
          icon={<Zap size={24} color="#FFFFFF" strokeWidth={2.5} />}
          label="Voltage"
          value={telemetryData.voltage.toFixed(2)}
          unit="V"
          iconBgColor="linear-gradient(135deg, #428475, #2D6559)"
        />

        {/* Current */}
        <MetricCard
          icon={<Activity size={24} color="#FFFFFF" strokeWidth={2.5} />}
          label="Current"
          value={telemetryData.current.toFixed(2)}
          unit="A"
          iconBgColor="linear-gradient(135deg, #89D7B7, #6FC5A0)"
        />

        {/* Power */}
        <MetricCard
          icon={<Power size={24} color="#FFFFFF" strokeWidth={2.5} />}
          label="Power"
          value={telemetryData.power.toFixed(2)}
          unit="W"
          iconBgColor="linear-gradient(135deg, #1A312C, #0F1F1B)"
        />

        {/* Energy Today */}
        <MetricCard
          icon={<Battery size={24} color="#FFFFFF" strokeWidth={2.5} />}
          label="Energy Today"
          value={telemetryData.energyToday.toFixed(3)}
          unit="kWh"
          iconBgColor="linear-gradient(135deg, #428475, #89D7B7)"
        />
      </div>

      {/* Last Updated Timestamp */}
      <div
        style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(26, 49, 44, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '13px',
          color: '#737373',
        }}
        role="status"
        aria-live="polite"
      >
        <div
          aria-hidden="true"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: error ? '#EAB308' : '#89D7B7',
          }}
        />
        {formatTimeAgo(telemetryData.timestamp)}
        {error && (
          <span style={{ color: '#A16207', marginLeft: '4px' }}>
            ({error})
          </span>
        )}
      </div>
    </div>
  );
}

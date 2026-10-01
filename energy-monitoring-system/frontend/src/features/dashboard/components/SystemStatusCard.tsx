import React from 'react';

/**
 * System Status Card Props
 * Props for consolidated system health indicators in the tertiary section
 */
export interface SystemStatusCardProps {
  /** Wi-Fi connection status (true=connected, false=disconnected, undefined=unknown) */
  wifi: boolean | undefined;
  
  /** Bluetooth connection status (true=connected, false=disconnected, undefined=unknown) */
  bluetooth: boolean | undefined;
  
  /** Timestamp of last received data */
  dataTimestamp: string | undefined;
  
  /** Whether any sensor data has been received */
  hasData: boolean;
}

/**
 * System Status Card Component
 * 
 * Displays consolidated system health indicators for IoT connectivity.
 * Shows Wi-Fi status, Bluetooth status, and data transmission activity.
 * 
 * Visual Hierarchy (Tertiary):
 * - Small typography (14px)
 * - Subtle colors
 * - Informational indicators
 * 
 * Status Indicator Colors:
 * - Connected/Active: Accent green (#3ED98A) with pulse animation
 * - Disconnected/Error: Red (#EF4444)
 * - Unknown/Waiting: Gray (#9CA3AF)
 * 
 * Grid Layout:
 * - Desktop: 3 columns (Wi-Fi, Bluetooth, Data Transfer)
 * - Mobile: 1 column, stacked
 * 
 * Requirements: 4.1-4.6, 5.1-5.7
 * 
 * Performance Optimizations:
 * - Wrapped with React.memo to prevent unnecessary re-renders
 * 
 * @component
 * @example
 * ```tsx
 * <SystemStatusCard
 *   wifi={true}
 *   bluetooth={true}
 *   dataTimestamp="2024-01-15T10:30:00Z"
 *   hasData={true}
 * />
 * ```
 */
export const SystemStatusCard = React.memo(function SystemStatusCard({
  wifi,
  bluetooth,
  dataTimestamp,
  hasData,
}: SystemStatusCardProps) {
  return (
    <div 
      className="
        eco-card
        transition-opacity duration-200
      "
      style={{
        padding: '24px', // Spacing system: card padding
        contain: 'layout style', // CSS containment for performance
      }}
    >
      <h3 
        className="
          text-lg font-semibold 
          text-[#1A312C] dark:text-[#F9FAFB]
        "
        style={{
          marginBottom: '24px', // Section gap: 24px
        }}
      >
        System Status
      </h3>

      <div 
        className="grid grid-cols-1 sm:grid-cols-3"
        style={{
          gap: '16px', // Grid gap: 16px
        }}
      >
        {/* Wi-Fi Status */}
        <StatusIndicator
          label="Wi-Fi"
          status={wifi === true ? 'connected' : wifi === false ? 'disconnected' : 'unknown'}
        />

        {/* Bluetooth Status */}
        <StatusIndicator
          label="Bluetooth"
          status={bluetooth === true ? 'connected' : bluetooth === false ? 'disconnected' : 'unknown'}
        />

        {/* Data Transfer Status */}
        <StatusIndicator
          label="Data Transfer"
          status={hasData ? 'active' : 'waiting'}
          timestamp={dataTimestamp}
        />
      </div>
    </div>
  );
});

/**
 * Status Indicator Props
 */
interface StatusIndicatorProps {
  label: string;
  status: 'connected' | 'disconnected' | 'unknown' | 'active' | 'waiting';
  timestamp?: string;
}

/**
 * Status Indicator Component
 * 
 * Individual status indicator with dot, label, and optional timestamp.
 * Used within SystemStatusCard to show Wi-Fi, Bluetooth, and Data Transfer status.
 */
function StatusIndicator({ label, status, timestamp }: StatusIndicatorProps) {
  // Determine status dot color with design system tokens
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'bg-[#3ED98A] dark:bg-[#3ED98A]';
      case 'disconnected':
        return 'bg-[#EF4444]';
      case 'unknown':
      case 'waiting':
      default:
        return 'bg-[#9CA3AF]';
    }
  };

  // Determine status display text
  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'active':
        return 'Active';
      case 'waiting':
        return 'Waiting';
      case 'unknown':
      default:
        return 'Unknown';
    }
  };

  const shouldAnimate = status === 'connected' || status === 'active';

  return (
    <div 
      className="flex items-start gap-3"
      style={{
        transition: 'opacity 200ms ease', // 200ms opacity transitions
      }}
    >
      {/* Status dot: 8px with pulse animation for active states */}
      <div 
        className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${getStatusColor()} ${shouldAnimate ? 'animate-pulse' : ''}`}
        role="status"
        aria-label={`${label}: ${getStatusText()}`}
        style={{
          animation: shouldAnimate ? 'pulse 2s ease-in-out infinite' : 'none',
          willChange: shouldAnimate ? 'opacity' : 'auto', // GPU acceleration for pulse animation
        }}
      />
      
      <div className="flex-1 min-w-0">
        {/* Label - 14px typography */}
        <p 
          className="
            text-sm font-medium 
            text-[#1A312C] dark:text-[#F9FAFB]
          "
          style={{
            fontSize: '14px',
            lineHeight: '1.5',
          }}
        >
          {label}
        </p>
        
        {/* Status value */}
        <p 
          className="
            text-xs 
            text-[#374151] dark:text-[#9CA3AF]
          "
          style={{
            marginTop: '2px',
          }}
        >
          {getStatusText()}
        </p>
        
        {/* Optional timestamp */}
        {timestamp && (
          <p 
            className="
              text-xs 
              text-[#374151] dark:text-[#9CA3AF]
            "
            style={{
              marginTop: '4px',
            }}
          >
            Last: {new Date(timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}

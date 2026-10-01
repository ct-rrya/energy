import { Activity } from 'lucide-react';

/**
 * Sensor Nodes Empty State Props
 */
export interface SensorNodesEmptyStateProps {
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Sensor Nodes Empty State Component
 * 
 * Displays when no sensor data is available. Informs users that the system
 * is waiting for ESP32 sensor connections and data.
 * 
 * Design Specifications:
 * - Activity icon in 64px muted circle
 * - Centered layout with proper spacing
 * - Title: 16px, font-weight: 600
 * - Description: 14px, secondary color, max-width: 420px
 * - Vertical padding: 3rem top/bottom
 * 
 * Requirements: 10.1, 10.3, 10.4
 * 
 * @component
 * @example
 * ```tsx
 * <SensorNodesEmptyState />
 * ```
 */
export function SensorNodesEmptyState({
  className = '',
}: SensorNodesEmptyStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        ${className}
      `}
      style={{
        paddingTop: '3rem', // Vertical padding: 3rem (48px)
        paddingBottom: '3rem',
      }}
    >
      {/* Icon container - 64px muted circle */}
      <div
        className="
          flex items-center justify-center
          rounded-full
          bg-neutral-100 dark:bg-neutral-800
        "
        style={{
          width: '64px',
          height: '64px',
          marginBottom: '16px',
        }}
      >
        <Activity
          size={32}
          className="text-neutral-400 dark:text-neutral-500"
        />
      </div>

      {/* Title - typography system */}
      <h4
        className="
          font-semibold
          text-[#1A312C] dark:text-[#F9FAFB]
        "
        style={{
          fontSize: '16px', // Typography: 16px
          fontWeight: 600,
          marginBottom: '8px',
        }}
      >
        No sensor data available
      </h4>

      {/* Description with max-width constraint and secondary color */}
      <p
        className="
          text-center
          text-[#374151] dark:text-[#9CA3AF]
        "
        style={{
          fontSize: '14px', // Typography: 14px
          maxWidth: '420px',
          lineHeight: '1.6',
        }}
      >
        Waiting for sensor data. Connect ESP32 sensors to view real-time node
        status and readings.
      </p>
    </div>
  );
}

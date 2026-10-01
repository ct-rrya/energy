import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/theme';

/**
 * Status Type
 * Represents the connection or operational status
 */
export type StatusType = 
  | 'connected' 
  | 'disconnected' 
  | 'active' 
  | 'waiting' 
  | 'error' 
  | 'unknown';

/**
 * Status Indicator Props
 * Props for individual status item with dot, label, and optional timestamp
 */
export interface StatusIndicatorProps {
  /** Label for the status item (e.g., "Wi-Fi", "Bluetooth") */
  label: string;
  
  /** Current status state */
  status: StatusType;
  
  /** Optional timestamp for last update/activity */
  timestamp?: string;
  
  /** Optional custom value to display instead of status text */
  value?: string;
}

/**
 * Status Indicator Component
 * 
 * Individual status item displaying connection or operational state.
 * Shows a colored dot, label, status text, and optional timestamp.
 * 
 * Status Colors:
 * - connected/active: Accent green with pulse animation
 * - disconnected/error: Red (#EF4444)
 * - unknown/waiting: Secondary gray
 * 
 * Features:
 * - Semantic status colors
 * - Pulse animation for active states
 * - Timestamp display and formatting
 * - Flexible value display
 * - Accessible labels
 * - Dark mode support
 * 
 * @component
 * @example
 * ```tsx
 * <StatusIndicator
 *   label="Wi-Fi"
 *   status="connected"
 * />
 * 
 * <StatusIndicator
 *   label="Data Transfer"
 *   status="active"
 *   timestamp="2024-01-15T10:30:00Z"
 * />
 * ```
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.4, 8.5**
 */
export function StatusIndicator({
  label,
  status,
  timestamp,
  value,
}: StatusIndicatorProps) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  /**
   * Get display text for status
   */
  const getStatusText = () => {
    if (value) return value;
    
    switch (status) {
      case 'connected':
      case 'active':
        return 'Connected';
      case 'disconnected':
      case 'error':
        return 'Disconnected';
      case 'waiting':
        return 'Waiting';
      default:
        return 'Unknown';
    }
  };

  /**
   * Get semantic color for status dot
   */
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
      case 'active':
        return colors.accent; // Green with pulse
      case 'disconnected':
      case 'error':
        return '#EF4444'; // Red
      case 'waiting':
      case 'unknown':
      default:
        return colors.textSecondary; // Gray
    }
  };

  /**
   * Format timestamp for display
   * Converts ISO timestamp to readable time format (HH:MM:SS)
   */
  const formatTimestamp = (ts: string): string => {
    try {
      const date = new Date(ts);
      if (isNaN(date.getTime())) {
        return ts; // Return original if invalid
      }
      
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return ts;
    }
  };

  const shouldPulse = status === 'connected' || status === 'active';
  const statusColor = getStatusColor();

  return (
    <div 
      className="flex items-start gap-2"
      role="status"
      aria-label={`${label}: ${getStatusText()}`}
    >
      {/* Status Dot */}
      <div 
        className="relative mt-1 flex-shrink-0"
        style={{
          width: '8px',
          height: '8px',
        }}
      >
        <div
          className="rounded-full"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: statusColor,
            animation: shouldPulse ? 'pulse 2s ease-in-out infinite' : 'none',
          }}
        />
        
        {/* Pulse animation styles injected inline for component isolation */}
        {shouldPulse && (
          <style>{`
            @keyframes pulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.5;
              }
            }
          `}</style>
        )}
      </div>

      {/* Status Content */}
      <div className="flex-1 min-w-0">
        <p 
          className="text-sm font-medium"
          style={{ color: colors.textPrimary }}
        >
          {label}
        </p>
        <p 
          className="text-sm"
          style={{ color: colors.textSecondary }}
        >
          {getStatusText()}
        </p>
        
        {/* Optional Timestamp */}
        {timestamp && (
          <p 
            className="text-xs mt-1"
            style={{ color: colors.textMuted }}
          >
            Last: {formatTimestamp(timestamp)}
          </p>
        )}
      </div>
    </div>
  );
}

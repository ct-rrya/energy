import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/theme';
import { StatusIndicator } from './StatusIndicator';
import type { StatusType } from './StatusIndicator';

/**
 * System Status Card Props
 * Props for consolidated system health indicators
 */
export interface SystemStatusCardNewProps {
  /** Wi-Fi connection status (true = connected, false = disconnected, undefined = unknown) */
  wifi: boolean | undefined;
  
  /** Bluetooth connection status (true = connected, false = disconnected, undefined = unknown) */
  bluetooth: boolean | undefined;
  
  /** Timestamp of last data transmission */
  dataTimestamp: string | undefined;
  
  /** Whether any sensor data has been received */
  hasData: boolean;
}

/**
 * System Status Card Component (New Redesign)
 * 
 * Consolidated system health indicators showing connectivity and data transfer status.
 * Displays three status indicators: Wi-Fi, Bluetooth, and Data Transfer.
 * 
 * Grid Layout:
 * - Desktop: 3 columns (horizontal)
 * - Mobile: 1 column (stacked vertically)
 * 
 * Features:
 * - Three status indicators with semantic colors
 * - Wi-Fi connection status
 * - Bluetooth connection status
 * - Data transfer status with timestamp
 * - Responsive grid layout
 * - Supporting tier visual hierarchy
 * - Dark mode support
 * - Empty state handling
 * 
 * Status Mapping:
 * - wifi/bluetooth: true → 'connected', false → 'disconnected', undefined → 'unknown'
 * - dataTransfer: hasData → 'active', !hasData → 'waiting'
 * 
 * Visual Hierarchy:
 * - Tertiary/supporting tier styling
 * - Smaller text, reduced visual weight
 * - Subtle borders and spacing
 * 
 * @component
 * @example
 * ```tsx
 * <SystemStatusCardNew
 *   wifi={true}
 *   bluetooth={true}
 *   dataTimestamp="2024-01-15T10:30:00Z"
 *   hasData={true}
 * />
 * ```
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.5, 7.4, 7.5**
 */
export function SystemStatusCardNew({
  wifi,
  bluetooth,
  dataTimestamp,
  hasData,
}: SystemStatusCardNewProps) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  /**
   * Map boolean status to StatusType
   */
  const getWifiStatus = (): StatusType => {
    if (wifi === true) return 'connected';
    if (wifi === false) return 'disconnected';
    return 'unknown';
  };

  const getBluetoothStatus = (): StatusType => {
    if (bluetooth === true) return 'connected';
    if (bluetooth === false) return 'disconnected';
    return 'unknown';
  };

  const getDataStatus = (): StatusType => {
    return hasData ? 'active' : 'waiting';
  };

  return (
    <div 
      className="rounded-xl border transition-colors duration-200"
      style={{
        backgroundColor: colors.cardBackground,
        borderColor: colors.border,
        padding: '1.5rem', // 24px
      }}
    >
      {/* Card Title - Supporting Tier Typography */}
      <h3 
        className="text-base font-semibold mb-4"
        style={{ color: colors.textPrimary }}
      >
        System Status
      </h3>

      {/* Status Grid - Responsive Layout */}
      <div 
        className="grid gap-4"
        style={{
          // Desktop: 3 columns
          gridTemplateColumns: 'repeat(3, 1fr)',
        }}
      >
        {/* Wi-Fi Status */}
        <StatusIndicator
          label="Wi-Fi"
          status={getWifiStatus()}
        />

        {/* Bluetooth Status */}
        <StatusIndicator
          label="Bluetooth"
          status={getBluetoothStatus()}
        />

        {/* Data Transfer Status */}
        <StatusIndicator
          label="Data Transfer"
          status={getDataStatus()}
          timestamp={dataTimestamp}
        />
      </div>

      {/* Responsive styles for mobile - injected inline for component isolation */}
      <style>{`
        @media (max-width: 639px) {
          .grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

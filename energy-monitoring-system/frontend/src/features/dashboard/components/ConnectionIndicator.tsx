import { cn } from '@/lib/utils';
import type { ConnectionStatus } from '../types/dashboard.types';

/**
 * Connection Indicator Props
 */
interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Connection Indicator Component
 * Displays animated connection status dot
 */
export function ConnectionIndicator({
  status,
  showLabel = true,
  size = 'md',
}: ConnectionIndicatorProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const config = {
    connected: {
      color: 'bg-success-500',
      pulse: true,
      text: 'Live',
    },
    connecting: {
      color: 'bg-warning-500',
      pulse: true,
      text: 'Connecting...',
    },
    disconnected: {
      color: 'bg-neutral-400',
      pulse: false,
      text: 'Offline',
    },
    error: {
      color: 'bg-error-500',
      pulse: false,
      text: 'Error',
    },
  };

  const { color, pulse, text } = config[status];

  return (
    <div className="inline-flex items-center gap-2.5">
      <div className="relative flex items-center justify-center">
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              color
            )}
          />
        )}
        <span
          className={cn(
            'relative inline-flex rounded-full',
            color,
            sizeClasses[size]
          )}
          role="status"
          aria-label={`Connection status: ${text}`}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-semibold text-neutral-700">{text}</span>
      )}
    </div>
  );
}

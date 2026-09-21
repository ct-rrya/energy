import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Device Status Badge Props
 */
interface DeviceStatusBadgeProps {
  isOnline: boolean;
  lastSeen?: string;
  className?: string;
}

/**
 * Device Status Badge Component
 * 
 * Displays online/offline status with semantic colors and animated indicator.
 * Uses semantic green (#22C55E) for online status.
 */
export function DeviceStatusBadge({
  isOnline,
  lastSeen,
  className,
}: DeviceStatusBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1',
        className
      )}
      style={
        isOnline
          ? {
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              color: '#15803d',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '6px',
            }
          : {
              backgroundColor: 'rgba(115, 115, 115, 0.1)',
              color: '#525252',
              border: '1px solid rgba(115, 115, 115, 0.2)',
              borderRadius: '6px',
            }
      }
    >
      {/* Animated dot */}
      <div className="relative flex items-center justify-center">
        {isOnline && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
        )}
        <Circle
          className={cn(
            'h-2 w-2 fill-current',
            isOnline ? 'text-green-500' : 'text-neutral-400'
          )}
        />
      </div>

      {/* Status text */}
      <span className="text-sm font-medium">
        {isOnline ? 'Online' : 'Offline'}
      </span>

      {/* Last seen */}
      {!isOnline && lastSeen && (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {lastSeen}
        </span>
      )}
    </div>
  );
}

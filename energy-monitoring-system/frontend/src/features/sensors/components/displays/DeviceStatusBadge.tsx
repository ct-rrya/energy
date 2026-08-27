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
 * Displays online/offline status with animated indicator.
 */
export function DeviceStatusBadge({
  isOnline,
  lastSeen,
  className,
}: DeviceStatusBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1',
        isOnline ? 'bg-secondary-50 text-secondary-700' : 'bg-neutral-100 text-neutral-600',
        className
      )}
    >
      {/* Animated dot */}
      <div className="relative flex items-center justify-center">
        {isOnline && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary-500 opacity-75" />
        )}
        <Circle
          className={cn(
            'h-2 w-2 fill-current',
            isOnline ? 'text-secondary-500' : 'text-neutral-400'
          )}
        />
      </div>

      {/* Status text */}
      <span className="text-sm font-medium">
        {isOnline ? 'Online' : 'Offline'}
      </span>

      {/* Last seen */}
      {!isOnline && lastSeen && (
        <span className="text-xs text-neutral-500">
          {lastSeen}
        </span>
      )}
    </div>
  );
}

import type { Alert } from '@/types/alert.types';
import { AlertStatus } from '@/types/alert.types';
import { SeverityBadge } from './SeverityBadge';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from '@/lib/utils';
import { MapPin, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Alert Card Props
 */
interface AlertCardProps {
  alert: Alert;
  onClick?: () => void;
}

/**
 * Alert Card Component
 * 
 * Displays an individual alert in a card format.
 * 
 * Features:
 * - Status badge
 * - Severity badge
 * - Sensor location
 * - Timestamp
 * - Click handler
 */
export function AlertCard({ alert, onClick }: AlertCardProps) {
  const isActive = alert.status === AlertStatus.ACTIVE;
  const isAcknowledged = alert.status === AlertStatus.ACKNOWLEDGED;
  const isResolved = alert.status === AlertStatus.RESOLVED;

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border bg-white p-4 transition-all hover:shadow-md cursor-pointer',
        isActive && 'border-l-4 border-l-red-500',
        isAcknowledged && 'border-l-4 border-l-amber-500',
        isResolved && 'border-l-4 border-l-green-500 opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-neutral-900 mb-1 truncate">
            {alert.title}
          </h3>
          <p className="text-sm text-neutral-600 line-clamp-2">
            {alert.description}
          </p>
        </div>
        <SeverityBadge severity={alert.severity} />
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 mt-3">
        {/* Status */}
        <div className="flex items-center gap-1">
          {isActive && <Clock className="h-3 w-3" />}
          {(isAcknowledged || isResolved) && <CheckCircle className="h-3 w-3" />}
          <Badge
            variant={
              isActive ? 'danger' : isAcknowledged ? 'warning' : 'success'
            }
          >
            {alert.status}
          </Badge>
        </div>

        {/* Sensor Location */}
        {alert.sensorLocation && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{alert.sensorLocation}</span>
          </div>
        )}

        {/* Timestamp */}
        <div className="ml-auto">
          {formatDistanceToNow(new Date(alert.createdAt))} ago
        </div>
      </div>

      {/* Acknowledged/Resolved Info */}
      {isAcknowledged && alert.acknowledgedBy && (
        <div className="mt-2 text-xs text-neutral-500 border-t border-neutral-100 pt-2">
          Acknowledged by {alert.acknowledgedBy.name}
        </div>
      )}

      {isResolved && alert.resolvedBy && (
        <div className="mt-2 text-xs text-neutral-500 border-t border-neutral-100 pt-2">
          Resolved by {alert.resolvedBy.name}
        </div>
      )}
    </div>
  );
}

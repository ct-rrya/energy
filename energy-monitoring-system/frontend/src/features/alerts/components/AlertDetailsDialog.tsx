import type { Alert } from '@/types/alert.types';
import { AlertStatus } from '@/types/alert.types';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { SeverityBadge } from './SeverityBadge';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import {
  MapPin,
  Calendar,
  CheckCircle,
  Info,
} from 'lucide-react';

/**
 * Alert Details Dialog Props
 */
interface AlertDetailsDialogProps {
  alert: Alert | null;
  open: boolean;
  onClose: () => void;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  isAcknowledging?: boolean;
  isResolving?: boolean;
}

/**
 * Alert Details Dialog Component
 * 
 * Displays detailed information about an alert and action buttons.
 * 
 * Features:
 * - Full alert details
 * - Acknowledge button
 * - Resolve button
 * - Metadata display
 * - Status history
 */
export function AlertDetailsDialog({
  alert,
  open,
  onClose,
  onAcknowledge,
  onResolve,
  isAcknowledging,
  isResolving,
}: AlertDetailsDialogProps) {
  if (!alert) return null;

  const canAcknowledge = alert.status === AlertStatus.ACTIVE;
  const canResolve = alert.status !== AlertStatus.RESOLVED;

  return (
    <Dialog open={open} onClose={onClose} title="Alert Details" size="lg">
      <div className="space-y-6">
        {/* Header Info */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-xl font-semibold text-neutral-900">
              {alert.title}
            </h3>
            <SeverityBadge severity={alert.severity} />
          </div>
          <p className="text-neutral-600">{alert.description}</p>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-700">Status:</span>
          <Badge
            variant={
              alert.status === AlertStatus.ACTIVE
                ? 'danger'
                : alert.status === AlertStatus.ACKNOWLEDGED
                ? 'warning'
                : 'success'
            }
          >
            {alert.status}
          </Badge>
        </div>

        {/* Alert Type */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-700">Type:</span>
          <Badge variant="default">{alert.type.replace(/_/g, ' ')}</Badge>
        </div>

        {/* Sensor Information */}
        {(alert.sensorName || alert.sensorLocation) && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <h4 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Sensor Information
            </h4>
            <div className="space-y-2">
              {alert.sensorName && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-neutral-500">Name:</span>
                  <span className="font-medium text-neutral-900">
                    {alert.sensorName}
                  </span>
                </div>
              )}
              {alert.sensorLocation && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-neutral-400" />
                  <span className="text-neutral-500">Location:</span>
                  <span className="font-medium text-neutral-900">
                    {alert.sensorLocation}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        {alert.metadata && Object.keys(alert.metadata).length > 0 && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <h4 className="text-sm font-semibold text-neutral-900 mb-3">
              Additional Details
            </h4>
            <dl className="space-y-2">
              {Object.entries(alert.metadata).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 text-sm"
                >
                  <dt className="text-neutral-500 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </dt>
                  <dd className="font-medium text-neutral-900">
                    {typeof value === 'number' && key.toLowerCase().includes('level')
                      ? `${value}%`
                      : typeof value === 'number' && key.toLowerCase().includes('voltage')
                      ? `${value}V`
                      : typeof value === 'number' && key.toLowerCase().includes('current')
                      ? `${value}A`
                      : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Timestamps */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-neutral-600">
            <Calendar className="h-4 w-4" />
            <span>Created:</span>
            <span className="font-medium text-neutral-900">
              {formatDate(new Date(alert.createdAt))}
            </span>
          </div>

          {alert.acknowledgedAt && alert.acknowledgedBy && (
            <div className="flex items-center gap-2 text-neutral-600">
              <CheckCircle className="h-4 w-4 text-amber-600" />
              <span>Acknowledged:</span>
              <span className="font-medium text-neutral-900">
                {formatDate(new Date(alert.acknowledgedAt))} by{' '}
                {alert.acknowledgedBy.name}
              </span>
            </div>
          )}

          {alert.resolvedAt && alert.resolvedBy && (
            <div className="flex items-center gap-2 text-neutral-600">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Resolved:</span>
              <span className="font-medium text-neutral-900">
                {formatDate(new Date(alert.resolvedAt))} by {alert.resolvedBy.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <DialogFooter>
        <Button onClick={onClose} variant="secondary">
          Close
        </Button>
        {canAcknowledge && onAcknowledge && (
          <Button
            onClick={() => onAcknowledge(alert.id)}
            disabled={isAcknowledging}
            variant="secondary"
          >
            {isAcknowledging ? 'Acknowledging...' : 'Acknowledge'}
          </Button>
        )}
        {canResolve && onResolve && (
          <Button
            onClick={() => onResolve(alert.id)}
            disabled={isResolving}
          >
            {isResolving ? 'Resolving...' : 'Resolve'}
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}

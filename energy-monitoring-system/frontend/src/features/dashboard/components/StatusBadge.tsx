import { CheckCircle, AlertCircle, Loader, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConnectionStatus } from '../types/dashboard.types';

/**
 * Status Badge Props
 */
interface StatusBadgeProps {
  status: ConnectionStatus;
  label: string;
  showIcon?: boolean;
}

/**
 * Status Badge Component
 * Displays connection/status indicator with color coding
 */
export function StatusBadge({ status, label, showIcon = true }: StatusBadgeProps) {
  const config = {
    connected: {
      icon: CheckCircle,
      text: 'Connected',
      className: 'bg-secondary-50 text-secondary-700 border-secondary-200',
    },
    connecting: {
      icon: Loader,
      text: 'Connecting',
      className: 'bg-accent-50 text-accent-700 border-accent-200',
    },
    disconnected: {
      icon: AlertCircle,
      text: 'Disconnected',
      className: 'bg-neutral-100 text-neutral-600 border-neutral-300',
    },
    error: {
      icon: XCircle,
      text: 'Error',
      className: 'bg-red-50 text-red-700 border-red-200',
    },
  };

  const { icon: Icon, text, className } = config[status];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium',
        className
      )}
      role="status"
      aria-label={`${label} status: ${text}`}
    >
      {showIcon && (
        <Icon
          className={cn(
            'h-4 w-4',
            status === 'connecting' && 'animate-spin'
          )}
        />
      )}
      <span className="hidden sm:inline">{label}:</span>
      <span className="font-semibold">{text}</span>
    </div>
  );
}

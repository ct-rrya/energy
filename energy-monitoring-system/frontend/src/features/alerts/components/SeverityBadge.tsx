import { AlertSeverity } from '@/types/alert.types';
import { Badge } from '@/components/ui/Badge';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Severity Badge Props
 */
interface SeverityBadgeProps {
  severity: AlertSeverity;
  showIcon?: boolean;
}

/**
 * Severity Badge Component
 * 
 * Displays alert severity with appropriate color and icon.
 * 
 * @example
 * <SeverityBadge severity={AlertSeverity.CRITICAL} />
 */
export function SeverityBadge({ severity, showIcon = true }: SeverityBadgeProps) {
  const severityConfig = {
    [AlertSeverity.INFO]: {
      label: 'Info',
      variant: 'info' as const,
      icon: Info,
    },
    [AlertSeverity.WARNING]: {
      label: 'Warning',
      variant: 'warning' as const,
      icon: AlertTriangle,
    },
    [AlertSeverity.CRITICAL]: {
      label: 'Critical',
      variant: 'danger' as const,
      icon: AlertCircle,
    },
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant}>
      <span className="flex items-center gap-1">
        {showIcon && <Icon className="h-3 w-3" />}
        {config.label}
      </span>
    </Badge>
  );
}

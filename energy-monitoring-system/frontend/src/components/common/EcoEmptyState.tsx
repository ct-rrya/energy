import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * EcoEmptyState Props
 */
interface EcoEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * EcoStep Empty State Component
 * Consistent empty state for all pages
 * 
 * Usage:
 * <EcoEmptyState
 *   icon={FileText}
 *   title="No Reports Found"
 *   description="You haven't generated any reports yet."
 *   action={<button>Generate Report</button>}
 * />
 */
export function EcoEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EcoEmptyStateProps) {
  return (
    <div className="eco-empty-state">
      <div className="eco-empty-icon">
        <Icon className="h-10 w-10" strokeWidth={1.5} />
      </div>
      <h2 className="eco-empty-title">{title}</h2>
      <p className="eco-empty-description">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

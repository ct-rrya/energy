import type { LucideIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils';

/**
 * Empty State Props
 */
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

/**
 * Empty State Component
 * 
 * Displays a friendly empty state with optional action button.
 * 
 * Features:
 * - Optional icon
 * - Title and description
 * - Optional call-to-action button
 * - Consistent styling
 * 
 * @example
 * <EmptyState
 *   icon={FileText}
 *   title="No Reports Found"
 *   description="You haven't generated any reports yet."
 *   action={{
 *     label: "Generate Report",
 *     onClick: () => setDialogOpen(true),
 *     icon: Plus
 *   }}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 px-6 py-12 text-center',
        className
      )}
    >
      {/* Icon */}
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <Icon className="h-8 w-8 text-neutral-400" />
        </div>
      )}

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold text-neutral-900">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mb-6 max-w-md text-sm text-neutral-600">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <Button onClick={action.onClick}>
          {action.icon && <action.icon className="h-4 w-4" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}

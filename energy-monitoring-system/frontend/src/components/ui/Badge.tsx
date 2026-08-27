import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Badge Variant Type
 */
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Badge Props
 */
interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * Badge Component
 * 
 * Displays a small label/badge with different color variants.
 * 
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="danger">Critical</Badge>
 */
export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variantClasses = {
    default: 'bg-neutral-100 text-neutral-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

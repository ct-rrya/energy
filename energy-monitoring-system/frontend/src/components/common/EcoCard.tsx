import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * EcoCard Props
 */
interface EcoCardProps {
  children: ReactNode;
  className?: string;
  compact?: boolean;
  onClick?: () => void;
  hover?: boolean;
}

/**
 * EcoStep Card Component
 * Unified card system for all pages
 * 
 * Usage:
 * <EcoCard>Content</EcoCard>
 * <EcoCard compact>Compact card</EcoCard>
 * <EcoCard onClick={handler} hover>Clickable card</EcoCard>
 */
export function EcoCard({
  children,
  className,
  compact = false,
  onClick,
  hover = false,
}: EcoCardProps) {
  const isClickable = Boolean(onClick);

  return (
    <div
      className={cn(
        compact ? 'eco-card-compact' : 'eco-card',
        isClickable && 'cursor-pointer',
        hover && 'hover:transform hover:-translate-y-0.5',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {children}
    </div>
  );
}

/**
 * EcoCard Header
 */
interface EcoCardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function EcoCardHeader({ title, subtitle, actions }: EcoCardHeaderProps) {
  return (
    <div className="eco-card-header">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="eco-card-title">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-sm text-[rgb(var(--color-neutral-600))]">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

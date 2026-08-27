import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Reading Display Props
 */
interface ReadingDisplayProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  unit?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  isLive?: boolean;
  className?: string;
}

/**
 * Reading Display Component
 * 
 * Displays a single reading value with icon, label, and unit.
 */
export function ReadingDisplay({
  icon: Icon,
  label,
  value,
  unit,
  color = 'text-primary-600',
  size = 'md',
  isLive = false,
  className,
}: ReadingDisplayProps) {
  const sizeConfig = {
    sm: {
      icon: 'h-4 w-4',
      value: 'text-lg',
      label: 'text-xs',
      unit: 'text-xs',
    },
    md: {
      icon: 'h-5 w-5',
      value: 'text-2xl',
      label: 'text-sm',
      unit: 'text-sm',
    },
    lg: {
      icon: 'h-6 w-6',
      value: 'text-3xl',
      label: 'text-base',
      unit: 'text-base',
    },
  };

  const sizes = sizeConfig[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Icon */}
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-50', isLive && 'animate-pulse')}>
        <Icon className={cn(sizes.icon, color)} />
      </div>

      {/* Content */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className={cn('font-bold text-neutral-900', sizes.value)}>
            {typeof value === 'number' ? value.toFixed(2) : value}
          </span>
          {unit && (
            <span className={cn('font-medium text-neutral-500', sizes.unit)}>
              {unit}
            </span>
          )}
        </div>
        <span className={cn('text-neutral-600', sizes.label)}>{label}</span>
      </div>
    </div>
  );
}

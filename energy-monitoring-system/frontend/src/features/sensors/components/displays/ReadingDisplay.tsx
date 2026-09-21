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
  className,
}: ReadingDisplayProps) {
  const sizeConfig = {
    sm: {
      icon: 'h-4 w-4',
      value: 'text-xl', // 20px for secondary metrics
      label: 'text-[13px]',
      unit: 'text-sm',
    },
    md: {
      icon: 'h-4 w-4',
      value: 'text-2xl',
      label: 'text-[13px]',
      unit: 'text-sm',
    },
    lg: {
      icon: 'h-4 w-4', // Icons max 16px
      value: 'text-4xl', // 36px for primary metrics
      label: 'text-[13px]',
      unit: 'text-xl',
    },
  };

  const sizes = sizeConfig[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Icon */}
      <Icon className={cn(sizes.icon, color)} />

      {/* Content */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span 
            className={cn('font-semibold text-neutral-900 dark:text-neutral-50', sizes.value)}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {typeof value === 'number' ? value.toFixed(2) : value}
          </span>
          {unit && (
            <span className={cn('font-medium text-neutral-500 dark:text-neutral-400', sizes.unit)}>
              {unit}
            </span>
          )}
        </div>
        <span className={cn('font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400', sizes.label)}>{label}</span>
      </div>
    </div>
  );
}

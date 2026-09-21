import { Battery, BatteryLow, BatteryMedium, BatteryFull } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Battery Indicator Props
 */
interface BatteryIndicatorProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

/**
 * Battery Indicator Component
 * 
 * Displays battery level with icon and percentage.
 * Color-coded by battery level.
 * 
 * Levels:
 * - Critical: < 20% (red)
 * - Low: 20-50% (yellow)
 * - Medium: 50-80% (blue)
 * - High: > 80% (green)
 */
export function BatteryIndicator({
  percentage,
  size = 'md',
  showPercentage = true,
  className,
}: BatteryIndicatorProps) {
  // Clamp percentage between 0-100
  const level = Math.min(Math.max(percentage, 0), 100);

  // Determine battery icon and color
  const getBatteryConfig = () => {
    if (level < 20) {
      return {
        icon: BatteryLow,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        label: 'Critical',
      };
    } else if (level < 50) {
      return {
        icon: BatteryMedium,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/20',
        label: 'Low',
      };
    } else if (level < 80) {
      return {
        icon: Battery,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        label: 'Medium',
      };
    } else {
      return {
        icon: BatteryFull,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        label: 'High',
      };
    }
  };

  const config = getBatteryConfig();
  const Icon = config.icon;

  // Size configurations
  const sizeConfig = {
    sm: { icon: 'h-5 w-5', text: 'text-sm', container: 'gap-2' },
    md: { icon: 'h-6 w-6', text: 'text-base', container: 'gap-3' },
    lg: { icon: 'h-8 w-8', text: 'text-lg', container: 'gap-4' },
  };

  const sizes = sizeConfig[size];

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Battery Icon with Fill */}
      <div className={cn('relative flex items-center justify-center rounded-lg p-3', config.bgColor)}>
        <Icon className={cn(sizes.icon, config.color)} />
        
        {/* Fill indicator */}
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <div
            className={cn('absolute bottom-0 left-0 right-0 transition-all duration-500', config.bgColor)}
            style={{ height: `${level}%`, opacity: 0.3 }}
          />
        </div>
      </div>

      {/* Percentage */}
      {showPercentage && (
        <div className="mt-2 flex flex-col items-center">
          <div 
            className={cn('font-semibold', config.color, sizes.text)}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {level.toFixed(0)}%
          </div>
          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Battery</div>
        </div>
      )}
    </div>
  );
}

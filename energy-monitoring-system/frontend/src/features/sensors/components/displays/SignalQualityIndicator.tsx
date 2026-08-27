import { Signal, SignalHigh, SignalMedium, SignalLow } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SignalQuality } from '../../types/sensor.types';

/**
 * Signal Quality Indicator Props
 */
interface SignalQualityIndicatorProps {
  quality: SignalQuality;
  latency?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Signal Quality Indicator Component
 * 
 * Displays signal quality with bars and color coding.
 * 
 * Quality levels:
 * - excellent: 4 bars, green
 * - good: 3 bars, blue
 * - fair: 2 bars, yellow
 * - poor: 1 bar, red
 */
export function SignalQualityIndicator({
  quality,
  latency,
  showLabel = true,
  size = 'md',
  className,
}: SignalQualityIndicatorProps) {
  const config = {
    excellent: {
      icon: SignalHigh,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
      bars: 4,
      label: 'Excellent',
    },
    good: {
      icon: Signal,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      bars: 3,
      label: 'Good',
    },
    fair: {
      icon: SignalMedium,
      color: 'text-accent-600',
      bgColor: 'bg-accent-50',
      bars: 2,
      label: 'Fair',
    },
    poor: {
      icon: SignalLow,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      bars: 1,
      label: 'Poor',
    },
  };

  const sizeConfig = {
    sm: { icon: 'h-4 w-4', text: 'text-xs' },
    md: { icon: 'h-5 w-5', text: 'text-sm' },
    lg: { icon: 'h-6 w-6', text: 'text-base' },
  };

  const qualityConfig = config[quality];
  const Icon = qualityConfig.icon;
  const sizes = sizeConfig[size];

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {/* Icon */}
      <div className={cn('rounded-full p-1.5', qualityConfig.bgColor)}>
        <Icon className={cn(sizes.icon, qualityConfig.color)} />
      </div>

      {/* Label and Latency */}
      {showLabel && (
        <div className="flex flex-col">
          <span className={cn('font-medium', qualityConfig.color, sizes.text)}>
            {qualityConfig.label}
          </span>
          {latency !== undefined && (
            <span className="text-xs text-neutral-500">{latency}ms</span>
          )}
        </div>
      )}
    </div>
  );
}

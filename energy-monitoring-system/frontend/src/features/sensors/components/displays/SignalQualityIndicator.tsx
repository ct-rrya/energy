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
      color: '#15803d', // semantic green dark
      bgColor: 'rgba(34, 197, 94, 0.1)',
      borderColor: 'rgba(34, 197, 94, 0.2)',
      bars: 4,
      label: 'Excellent',
    },
    good: {
      icon: Signal,
      color: '#1e40af', // blue dark
      bgColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.2)',
      bars: 3,
      label: 'Good',
    },
    fair: {
      icon: SignalMedium,
      color: '#92400e', // amber dark
      bgColor: 'rgba(245, 158, 11, 0.1)',
      borderColor: 'rgba(245, 158, 11, 0.2)',
      bars: 2,
      label: 'Fair',
    },
    poor: {
      icon: SignalLow,
      color: '#991b1b', // red dark
      bgColor: 'rgba(239, 68, 68, 0.1)',
      borderColor: 'rgba(239, 68, 68, 0.2)',
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
      <div 
        className="rounded-full p-1.5 border"
        style={{
          backgroundColor: qualityConfig.bgColor,
          borderColor: qualityConfig.borderColor,
        }}
      >
        <Icon className={sizes.icon} style={{ color: qualityConfig.color }} />
      </div>

      {/* Label and Latency */}
      {showLabel && (
        <div className="flex flex-col">
          <span className={cn('font-medium', sizes.text)} style={{ color: qualityConfig.color }}>
            {qualityConfig.label}
          </span>
          {latency !== undefined && (
            <span 
              className="text-xs text-neutral-500"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {latency}ms
            </span>
          )}
        </div>
      )}
    </div>
  );
}

import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Summary Card Props
 */
interface SummaryCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  subtitle?: string;
}

/**
 * Summary Card Component
 * Redesigned with EcoStep design system
 */
export function SummaryCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
  subtitle,
}: SummaryCardProps) {
  // Format value
  const displayValue = typeof value === 'number' 
    ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : value;

  // Get trend icon and color
  const getTrendDisplay = () => {
    if (!trend || trendValue === undefined) return null;

    const isPositive = trend === 'up';
    const isNegative = trend === 'down';

    let TrendIcon = Minus;
    let trendColorClass = 'eco-badge-neutral';

    if (isPositive) {
      TrendIcon = TrendingUp;
      trendColorClass = 'eco-badge-success';
    } else if (isNegative) {
      TrendIcon = TrendingDown;
      trendColorClass = 'eco-badge-error';
    }

    return (
      <div className={`eco-badge ${trendColorClass} flex items-center gap-1`}>
        <TrendIcon className="h-3 w-3" strokeWidth={2} />
        <span>{Math.abs(trendValue).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="eco-card-compact">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1">
          <p className="metric-label">{title}</p>
        </div>
        <div className="eco-icon-container">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>

      {/* Value */}
      <div>
        <div className="flex items-baseline gap-2">
          <p className="metric-value-large">{displayValue}</p>
          {unit && <span className="text-base font-medium text-[rgb(var(--color-neutral-500))]">{unit}</span>}
        </div>

        {/* Trend or Subtitle */}
        <div className="mt-3 flex items-center gap-2">
          {getTrendDisplay()}
          {subtitle && !trend && (
            <p className="text-sm text-[rgb(var(--color-neutral-600))]">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

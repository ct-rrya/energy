import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

/**
 * Circular Gauge Props
 */
interface CircularGaugeProps {
  value: number;
  min?: number;
  max: number;
  unit: string;
  label: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

/**
 * Circular Gauge Component
 * 
 * Displays a value as a circular progress gauge using Recharts.
 * 
 * Features:
 * - Animated progress ring
 * - Centered value display
 * - Color-coded by value range
 * - Responsive sizing
 */
export function CircularGauge({
  value,
  min = 0,
  max,
  unit,
  label,
  color = '#3b82f6',
  size = 'md',
  showValue = true,
  className,
}: CircularGaugeProps) {
  // Calculate percentage
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

  // Size configurations
  const sizeConfig = {
    sm: { diameter: 80, innerRadius: 25, outerRadius: 35, fontSize: 'text-sm' },
    md: { diameter: 120, innerRadius: 40, outerRadius: 50, fontSize: 'text-base' },
    lg: { diameter: 160, innerRadius: 55, outerRadius: 65, fontSize: 'text-lg' },
  };

  const config = sizeConfig[size];

  // Data for pie chart
  const data = [
    { name: 'value', value: percentage },
    { name: 'remaining', value: 100 - percentage },
  ];

  // Colors - use restrained background for remaining portion
  const COLORS = [color, 'rgba(26, 49, 44, 0.08)'];

  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      {/* Gauge */}
      <div style={{ width: config.diameter, height: config.diameter }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={-180}
              innerRadius={config.innerRadius}
              outerRadius={config.outerRadius}
              dataKey="value"
              stroke="none"
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center value */}
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div 
              className={cn('font-semibold text-neutral-900 dark:text-neutral-50', config.fontSize)}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {value.toFixed(2)}
            </div>
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{unit}</div>
          </div>
        )}
      </div>

      {/* Label */}
      <div className="mt-2 text-center text-[13px] font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
        {label}
      </div>
    </div>
  );
}

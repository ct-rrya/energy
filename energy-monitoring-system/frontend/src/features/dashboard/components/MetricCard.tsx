import React from 'react';
import { InfoTooltip } from '@/components/common/InfoTooltip';

/**
 * Metric Color Variants
 * Semantic colors for different metric types
 */
export type MetricColor = 'accent' | 'amber' | 'blue' | 'red';

/**
 * Metric Card Props
 * Props for individual metric display with flat, data-first hierarchy
 */
export interface MetricCardProps {
  /** Metric label/name (e.g., "Steps Today", "Energy Today", "Voltage", "Current") */
  label: string;
  
  /** Plain-language name/description (e.g. "Footsteps on Tile", "Total Stored Clean Energy") */
  plainDescription?: string;

  /** Educational tooltip explaining the concept to beginners */
  tooltip?: {
    title: string;
    description: string;
    analogy?: string;
    technicalNote?: string;
    position?: 'top' | 'bottom';
    align?: 'left' | 'center' | 'right';
  };

  /** Numeric value to display (undefined for empty state) */
  value: number | undefined;
  
  /** Unit of measurement (e.g., "V", "mA", "W", "mWh") */
  unit: string;
  
  /** Number of decimal places to display */
  precision: number;
  
  /** Color variant for accent/emphasis */
  color: MetricColor;

  /** Status accent dot color override (brand palette: Steps #19D46A, Energy #A6DC3C, Voltage #13B95C, Current #7FE0A8) */
  dotColor?: string;
  
  /** Optional subtitle/hint text to show below the value (e.g., "No steps yet today", "Awaiting footsteps") */
  subtitle?: string;

  /** @deprecated Removed per design spec: icon tiles removed from stat cards */
  icon?: React.ReactNode;
}

/**
 * MetricCard Component
 * 
 * Individual stat card display with flat, data-first visual hierarchy:
 * - Left-aligned text filling the full card width (zero icon tiles).
 * - Label row: 11px/600 uppercase, letter-spacing .08em, muted, with 8px status dot & 16px tooltip.
 * - Value: 34px / weight 500 / letter-spacing -.02em / tabular-nums, margin-top 8px.
 * - Unit: 15px muted, margin-left 6px, baseline-aligned.
 * - Name: 13px, var(--t), margin-top 6px.
 * - Hint: 12px italic, var(--mu), margin-top 2px.
 * - Compact card padding 18px 22px, radius 22px.
 */
export const MetricCard = React.memo(function MetricCard({
  label,
  plainDescription,
  tooltip,
  value,
  unit,
  precision,
  color,
  dotColor,
  subtitle,
}: MetricCardProps) {
  // Brand status tint palette: Steps #19D46A, Energy #A6DC3C, Voltage #13B95C, Current #7FE0A8
  const activeDotColor = React.useMemo(() => {
    if (dotColor) return dotColor;
    const l = label.toLowerCase();
    if (l.includes('step')) return '#19D46A';
    if (l.includes('energy')) return '#A6DC3C';
    if (l.includes('volt')) return '#13B95C';
    if (l.includes('curr')) return '#7FE0A8';
    if (color === 'amber') return '#A6DC3C';
    if (color === 'blue') return '#7FE0A8';
    if (color === 'red') return '#EF4444';
    return '#19D46A';
  }, [dotColor, label, color]);

  // Color mapping for metric values
  const colorClasses: Record<MetricColor, string> = {
    accent: 'text-[#3DDC97] dark:text-[#3ED98A]',
    amber: 'text-[#F59E0B]',
    blue: 'text-[#3B82F6]',
    red: 'text-[#EF4444]',
  };

  // Memoize formatted value calculation
  const formattedValue = React.useMemo(() => {
    if (value === undefined) {
      return precision > 0 ? '0.' + '0'.repeat(precision) : '0';
    }
    return value.toFixed(precision);
  }, [value, precision]);

  // Memoize empty state checks
  const isEmptyState = value === undefined;
  const isZeroValue = value === 0 || value === undefined;
  const valueOpacity = isEmptyState ? 'opacity-50' : 'opacity-100';

  return (
    <article
      className="cd st stat metric-card-container eco-card hover:opacity-95 transition-opacity duration-200 min-w-0"
      style={{
        padding: '18px 22px',
        borderRadius: '22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '130px',
        boxSizing: 'border-box',
        width: '100%',
        textAlign: 'left',
      }}
    >
      {/* Header: Status Dot + Label (uppercase) ··············· [i] */}
      <header
        className="lb stat-head uppercase tracking-wider flex items-center justify-between w-full"
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '.08em',
          color: 'var(--mu)',
        }}
      >
        <div className="stat-label-wrap flex items-center gap-2 min-w-0 text-[0.8125rem] uppercase tracking-wider">
          <span
            className="stat-dot"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: activeDotColor,
              flexShrink: 0,
            }}
            aria-hidden="true"
          />
          <span className="truncate">{label}</span>
        </div>
        {tooltip && (
          <InfoTooltip
            title={tooltip.title}
            description={tooltip.description}
            analogy={tooltip.analogy}
            technicalNote={tooltip.technicalNote}
            size={16}
            position={tooltip.position ?? 'bottom'}
            align={tooltip.align ?? 'right'}
          />
        )}
      </header>

      {/* Value & Unit: 34px / weight 500 / tabular-nums, unit 15px muted baseline */}
      <div
        className={`v val flex items-baseline ${valueOpacity}`}
        style={{ marginTop: '8px' }}
      >
        <span
          className={`
            text-[2.25rem] font-semibold leading-none
            tabular-nums
            ${colorClasses[color]}
          `}
          style={{
            fontVariantNumeric: 'tabular-nums',
            fontSize: '34px',
            fontWeight: 500,
            letterSpacing: '-.02em',
            color: isZeroValue ? 'var(--mu)' : 'var(--t)',
            lineHeight: 1,
          }}
        >
          {formattedValue}
        </span>
        {unit && (
          <small
            className="text-[1.125rem]"
            style={{
              fontSize: '15px',
              fontWeight: 400,
              color: 'var(--mu)',
              marginLeft: '6px',
            }}
          >
            {unit}
          </small>
        )}
      </div>

      {/* Plain Name: 13px, var(--t), margin-top 6px */}
      {plainDescription && (
        <div
          className="name sub text-[13px] truncate"
          style={{
            fontSize: '13px',
            color: 'var(--t)',
            marginTop: '6px',
            lineHeight: 1.3,
          }}
        >
          {plainDescription}
        </div>
      )}

      {/* Hint: 12px italic, var(--mu), margin-top 2px */}
      {subtitle && (
        <div
          className="hint mt-0.5 text-[12px]"
          style={{
            fontSize: '12px',
            color: 'var(--mu)',
            fontStyle: 'italic',
            marginTop: '2px',
            lineHeight: 1.3,
          }}
        >
          {subtitle}
        </div>
      )}
    </article>
  );
});

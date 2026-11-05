/**
 * Hero Power Card Component - With Power Display, Trend Indicator, and AI Insight
 * 
 * Primary KPI display component showing real-time power output with AI insights.
 * Adapted from HeroEnergyCard to display Power as the main metric.
 * 
 * Layout:
 * - Padding: 32px (desktop), 24px (tablet), 20px (mobile)
 * - Min Height: 400px (desktop), 350px (mobile)
 * - Border Radius: 12px
 * - CSS Containment: layout style
 * - Power Value Typography: 36-48px (mobile), 48-56px (tablet), 56-72px (desktop)
 * - Trend Indicator: Positioned 12px below power value with color-coded arrow
 * - AI Insight: Bottom section with 16px margin above divider
 * - Loading State: Shows HeroCardSkeleton with shimmer animation when isLoading is true
 * - Empty State: Shows Zap icon with "Waiting for data..." message when powerValue is undefined
 * 
 * @component
 * @example
 * ```tsx
 * <HeroPowerCard
 *   powerValue={245.7}
 *   previousPower={220.0}
 *   aiInsight="Power output steady, 12% above baseline"
 *   isLoading={false}
 * />
 * ```
 */

import React, { useMemo } from 'react';
import { TrendIndicator } from './TrendIndicator';
import { AIInsightSection } from './AIInsightSection';
import { HeroCardSkeleton } from './HeroCardSkeleton';
import { InfoTooltip } from '@/components/common/InfoTooltip';
import { getPowerTooltip } from '../utils/metricTooltips';

/**
 * Hero Power Card Props
 */
export interface HeroPowerCardProps {
  /** Current power value in mW (undefined during loading) */
  powerValue: number | undefined;
  /** Previous power value for trend comparison (undefined if unavailable) */
  previousPower?: number | undefined;
  /** AI-generated insight text (undefined if unavailable) */
  aiInsight: string | undefined;
  /** Loading state indicator */
  isLoading: boolean;
  /** Today's total steps count (used to determine if there's any activity today) */
  todaySteps?: number | undefined;
}

/**
 * HeroPowerCard Component
 * 
 * Provides the hero card container with power value display, trend indicator, 
 * and AI insight section with responsive typography.
 */
export const HeroPowerCard = React.memo(
  function HeroPowerCard({
    powerValue,
    previousPower,
    aiInsight,
    isLoading,
    todaySteps,
  }: HeroPowerCardProps) {
    // Memoize formatted value to prevent unnecessary recalculations
    const formattedPower = useMemo(() => {
      // Show "0.0000" when undefined
      if (powerValue === undefined) return '0.0000';
      // Format to 4 decimal places to show small mW values
      return powerValue.toFixed(4);
    }, [powerValue]);

    // Show loading skeleton when isLoading is true
    if (isLoading) {
      return <HeroCardSkeleton />;
    }

    // Determine if there is no activity today
    const hasNoActivityToday = todaySteps === undefined || todaySteps === 0;

    return (
      <div className="cd flex flex-col justify-between">
        {/* Power Value Display Section */}
        <div className="flex flex-col">
          {/* Label "Power Output" with plain-language description & InfoTooltip */}
          <div className="row flex items-center justify-between gap-2">
            <div className="lb flex items-center gap-1.5">
              <span>Power Output</span>
              <InfoTooltip
                title="Power Output"
                description={getPowerTooltip(powerValue, !hasNoActivityToday)}
                ariaLabel="More info: Power Output"
              />
            </div>
            <span className="pill">
              ● {hasNoActivityToday ? 'Standby' : 'Live'}
            </span>
          </div>

          {/* Hero number: 56px/500, letter-spacing -.03em, margin-top 6px; unit <small> 20px muted, margin-left 6px */}
          <div className="n text-[40px] sm:text-[56px] font-[500] tracking-[-0.03em] mt-1.5 flex items-baseline leading-none text-[var(--t)]">
            <span>{formattedPower}</span>
            <small className="text-[16px] sm:text-[20px] text-[var(--mu)] ml-1.5 font-normal">
              mW
            </small>
          </div>

          {/* Subtitle state: 13px muted */}
          <div className="sub text-[13px] text-[var(--mu)] mt-1.5">
            {hasNoActivityToday
              ? 'System at rest. Waiting for footsteps.'
              : 'Instantaneous rate of electricity generation'}
          </div>
        </div>

        {/* Trend Indicator Integration */}
        {previousPower !== undefined && (
          <div className="mt-3">
            <TrendIndicator
              currentValue={powerValue}
              previousValue={previousPower}
              format="percentage"
              showIcon={true}
            />
          </div>
        )}

          {/* AI Insight Section Integration */}
          <AIInsightSection
            insight={aiInsight}
            isLoading={false}
            maxLength={150}
            hasActivity={!hasNoActivityToday}
          />
        </div>
    );
  }
);

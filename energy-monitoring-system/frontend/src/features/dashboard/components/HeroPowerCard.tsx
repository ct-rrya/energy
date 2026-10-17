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
import { Zap } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { TrendIndicator } from './TrendIndicator';
import { AIInsightSection } from './AIInsightSection';
import { HeroCardSkeleton } from './HeroCardSkeleton';

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
    const { theme } = useTheme();
    const isDark = theme === 'dark';

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

    // Determine if we should show empty state
    // Show empty state when there's no activity today (steps = 0 or undefined)
    const hasNoActivityToday = todaySteps === undefined || todaySteps === 0;
    const showEmptyState = hasNoActivityToday && !isLoading;

    // Theme-aware colors for card container
    const cardBgColor = isDark ? '#080E22' : '#FFFFFF';
    const borderColor = isDark
      ? 'rgba(57, 255, 136, 0.12)'
      : 'rgba(11, 19, 43, 0.08)';
    const labelColor = isDark ? '#F5F7FA' : '#0B132B';
    const unitColor = isDark ? '#F5F7FA' : '#0B132B';

    // Apply amber color for power value (using F59E0B - amber)
    const valueColor = isDark ? '#FBBF24' : '#F59E0B';
    
    // Apply 50% opacity when value is undefined
    const valueOpacity = powerValue === undefined ? 0.5 : 1;

    return (
      <>
        {/* Global styles for responsive behavior and typography */}
        <style>{`
          /* Mobile: Default styles */
          .hero-power-card {
            padding: 20px;
            min-height: 350px;
          }
          
          /* Tabular numerals for consistent number width */
          .hero-power-value,
          .hero-power-unit {
            font-variant-numeric: tabular-nums;
          }
          
          /* Responsive typography for power value */
          /* Mobile: 36-48px */
          .hero-power-value {
            font-size: 36px;
            line-height: 1;
            font-weight: 700;
            letter-spacing: -0.02em;
          }
          
          /* Responsive typography for unit */
          /* Mobile: 20px */
          .hero-power-unit {
            font-size: 20px;
            font-weight: 500;
          }
          
          /* Label typography */
          .hero-power-label {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
          }
          
          /* Larger mobile devices: Scale to upper range of 36-48px */
          @media (min-width: 480px) and (max-width: 767px) {
            .hero-power-value {
              font-size: 48px;
            }
            
            .hero-power-unit {
              font-size: 24px;
            }
          }
          
          /* Tablet breakpoint: 768px - 1023px */
          @media (min-width: 768px) {
            .hero-power-card {
              padding: 24px;
              min-height: 400px;
            }
            
            /* Tablet: 48-56px for value */
            .hero-power-value {
              font-size: 48px;
            }
            
            /* Tablet: 26px for unit */
            .hero-power-unit {
              font-size: 26px;
            }
          }
          
          /* Upper tablet range - scale to 56px max */
          @media (min-width: 900px) and (max-width: 1023px) {
            .hero-power-value {
              font-size: 56px;
            }
            
            .hero-power-unit {
              font-size: 28px;
            }
          }
          
          /* Desktop breakpoint: 1024px */
          @media (min-width: 1024px) {
            .hero-power-card {
              padding: 32px;
              min-height: 400px;
            }
            
            /* Desktop: 56-72px for value */
            .hero-power-value {
              font-size: 56px;
            }
            
            /* Desktop: 28px for unit */
            .hero-power-unit {
              font-size: 28px;
            }
          }
          
          /* Extra large desktop: 1280px */
          @media (min-width: 1280px) {
            /* Desktop: 56-72px for value (max) */
            .hero-power-value {
              font-size: 72px;
            }
            
            /* Desktop: 32px for unit (max) */
            .hero-power-unit {
              font-size: 32px;
            }
          }
        `}</style>
        
        <div
          className="hero-power-card rounded-[12px] border"
          style={{
            backgroundColor: cardBgColor,
            borderColor: borderColor,
            // CSS containment for performance
            contain: 'layout style' as const,
          }}
        >
          {/* Empty State - Show when powerValue undefined and not loading */}
          {showEmptyState ? (
            <div 
              className="flex flex-col items-center justify-center gap-4"
              style={{
                minHeight: '350px',
              }}
            >
              {/* Zap icon */}
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                }}
              >
                <Zap 
                  size={40}
                  style={{
                    color: valueColor,
                    opacity: 0.6,
                  }}
                />
              </div>
              
              {/* Empty state message */}
              <div className="text-center">
                <p
                  className="text-[18px] font-semibold"
                  style={{
                    color: labelColor,
                  }}
                >
                  Be the first to interact with EcoStep today!
                </p>
                <p
                  className="text-[14px] mt-2"
                  style={{
                    color: labelColor,
                    opacity: 0.7,
                  }}
                >
                  Start walking on your piezoelectric tiles to generate power
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Power Value Display Section */}
              <div className="flex flex-col gap-3">
                {/* Label "Power Output" */}
                <div 
                  className="hero-power-label"
                  style={{ color: labelColor }}
                >
                  Power Output
                </div>
                
                {/* Power Value and Unit Container */}
                <div className="flex items-baseline gap-2">
                  {/* Power Value Display */}
                  <span
                    className="hero-power-value"
                    style={{
                      color: valueColor,
                      opacity: valueOpacity,
                    }}
                  >
                    {formattedPower}
                  </span>
                  
                  {/* Unit "mW" */}
                  <span
                    className="hero-power-unit"
                    style={{
                      color: unitColor,
                      opacity: valueOpacity,
                    }}
                  >
                    mW
                  </span>
                </div>
              </div>
              
              {/* Trend Indicator Integration */}
              {/* Position below power value with 12px spacing */}
              {previousPower !== undefined && (
                <TrendIndicator
                  currentValue={powerValue}
                  previousValue={previousPower}
                  format="percentage"
                  showIcon={true}
                />
              )}
              
              {/* AI Insight Section Integration */}
              {/* Display AI insight with divider */}
              <AIInsightSection
                insight={aiInsight}
                isLoading={false}
                maxLength={150}
                hasActivity={!hasNoActivityToday}
              />
            </>
          )}
        </div>
      </>
    );
  }
);

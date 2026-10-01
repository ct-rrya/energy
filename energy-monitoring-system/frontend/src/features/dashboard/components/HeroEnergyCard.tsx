/**
 * Hero Energy Card Component - With Energy Display, Trend Indicator, AI Insight, and Loading/Empty States (Tasks 6.1, 6.2, 6.3, 6.5, 6.6)
 * 
 * Primary KPI display component showing daily energy output with trend comparison and AI insights.
 * Includes base structure, energy value display with responsive typography, trend indicator, AI insight section,
 * loading skeleton, and empty state handling.
 * 
 * Layout:
 * - Padding: 32px (desktop), 24px (tablet), 20px (mobile)
 * - Min Height: 400px (desktop), 350px (mobile)
 * - Border Radius: 12px
 * - CSS Containment: layout style
 * - Energy Value Typography: 36-48px (mobile), 48-56px (tablet), 56-72px (desktop)
 * - Trend Indicator: Positioned 12px below energy value with color-coded arrow
 * - AI Insight: Bottom section with 16px margin above divider
 * - Loading State: Shows HeroCardSkeleton with shimmer animation when isLoading is true
 * - Empty State: Shows Zap icon with "Waiting for data..." message when energyValue is undefined
 * 
 * Requirements: 3.1-3.8, 4.1-4.7, 6.1-6.8, 12.5, 12.7, 17.3, 19.8, 20.5
 * 
 * @component
 * @example
 * ```tsx
 * <HeroEnergyCard
 *   energyValue={24.7}
 *   previousDayEnergy={22.0}
 *   trendData={last24Hours}
 *   aiInsight="Peak generation at 2pm today, 15% above average"
 *   isLoading={false}
 *   isError={false}
 *   onRetry={refetchMetrics}
 * />
 * ```
 */

import React, { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import type { HeroEnergyCardProps } from '../types/hero-dashboard.types';
import { TrendIndicator } from './TrendIndicator';
import { AIInsightSection } from './AIInsightSection';
import { HeroCardSkeleton } from './HeroCardSkeleton';

/**
 * HeroEnergyCard Component
 * 
 * Provides the card container with energy value display, trend indicator, 
 * AI insight section, loading skeleton, empty state, and responsive typography.
 * 
 * Requirements:
 * - 3.1: 60-65% width on desktop, approximately 2x area of metric cards
 * - 3.2: Proper sizing and layout
 * - 3.3: Display Energy_Value with typography size between 56px and 72px
 * - 3.4: Display unit "kWh" with typography size between 24px and 32px
 * - 3.5: Use tabular numerals for Energy_Value display
 * - 3.6: Display label "Today's Energy Generated" above Energy_Value
 * - 3.7: Apply accent color #3ED98A to Energy_Value text
 * - 3.8: Display "0.0" with 50% opacity when Energy_Value is undefined
 * - 4.1: Display Trend_Indicator showing percentage change compared to previous day
 * - 4.2: Green color #3ED98A with upward arrow when today exceeds yesterday
 * - 4.3: Amber color #F59E0B with downward arrow when today is less than yesterday
 * - 4.4: Gray color with horizontal line when values are equal
 * - 4.5: Format percentage values to one decimal place
 * - 4.6: Position Trend_Indicator below Energy_Value with 12px spacing
 * - 4.7: Display "No comparison data" with gray color when historical data unavailable
 * - 6.1: Display AI_Insight section at bottom of card
 * - 6.2: Visual separation with horizontal divider
 * - 6.3: Display summary text between 60-150 characters
 * - 6.4: Use muted text color (60% opacity)
 * - 6.5: Use typography size between 13px and 15px
 * - 6.6: Apply 16px padding above divider
 * - 6.7: Display "Analysis in progress" when unavailable
 * - 6.8: Update AI_Insight when new analysis available
 * - 12.5: Border radius between 12px and 16px
 * - 12.7: Establish visual hierarchy through typography size differences
 * - 17.3: Loading skeleton with shimmer animation when isLoading is true
 * - 19.8: Empty state with Zap icon and "Waiting for data..." message when energyValue undefined
 * - 20.5: CSS containment (contain: layout style)
 */
export const HeroEnergyCard = React.memo(
  function HeroEnergyCard({
    energyValue,
    previousDayEnergy,
    trendData,
    aiInsight,
    isLoading,
    isError,
    onRetry,
  }: HeroEnergyCardProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    // Suppress unused variable warnings - will be used in task 6.4
    void trendData;
    void isError;
    void onRetry;

    // Requirement 20.3: Memoize formatted value to prevent unnecessary recalculations
    const formattedEnergy = useMemo(() => {
      // Requirement 3.8: Show "0.0" when undefined
      if (energyValue === undefined) return '0.0';
      // Format to 1 decimal place
      return energyValue.toFixed(1);
    }, [energyValue]);

    // Task 6.6: Show loading skeleton when isLoading is true
    if (isLoading) {
      return <HeroCardSkeleton />;
    }

    // Task 6.6: Determine if we should show empty state
    // Empty state: energyValue is undefined AND not loading
    const showEmptyState = energyValue === undefined && !isLoading;

    // Theme-aware colors for card container
    const cardBgColor = isDark ? '#080E22' : '#FFFFFF';
    const borderColor = isDark
      ? 'rgba(57, 255, 136, 0.12)'
      : 'rgba(11, 19, 43, 0.08)';
    const labelColor = isDark ? '#F5F7FA' : '#0B132B';
    const unitColor = isDark ? '#F5F7FA' : '#0B132B';

    // Requirement 3.7: Apply accent color #39FF88 to Energy_Value
    const valueColor = isDark ? '#39FF88' : '#1FA35C';
    
    // Requirement 3.8: Apply 50% opacity when value is undefined
    const valueOpacity = energyValue === undefined ? 0.5 : 1;

    return (
      <>
        {/* Global styles for responsive behavior and typography */}
        <style>{`
          /* Mobile: Default styles - Requirements 15.5, 15.6 */
          .hero-energy-card {
            padding: 20px; /* Requirement 15.6: 20px card padding on mobile */
            min-height: 350px; /* Requirement 15.6: Reduce hero min-height to 350px on mobile */
          }
          
          /* Requirement 3.5: Tabular numerals for consistent number width */
          .hero-energy-value,
          .hero-energy-unit {
            font-variant-numeric: tabular-nums;
          }
          
          /* Requirement 3.3: Responsive typography for energy value */
          /* Requirement 15.5: Mobile - 36-48px (scale to 36-48px on mobile) */
          .hero-energy-value {
            font-size: 36px;
            line-height: 1;
            font-weight: 700;
            letter-spacing: -0.02em;
          }
          
          /* Requirement 3.4: Responsive typography for unit */
          /* Mobile: 20px */
          .hero-energy-unit {
            font-size: 20px;
            font-weight: 500;
          }
          
          /* Requirement 3.6: Label typography */
          .hero-energy-label {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
          }
          
          /* Larger mobile devices: Scale to upper range of 36-48px */
          /* Requirement 15.5: Scale hero typography to 36-48px */
          @media (min-width: 480px) and (max-width: 767px) {
            .hero-energy-value {
              font-size: 48px; /* Upper range of mobile typography */
            }
            
            .hero-energy-unit {
              font-size: 24px;
            }
          }
          
          /* Tablet breakpoint: 768px - 1023px */
          /* Requirement 14.6: Scale hero typography to 48-56px for tablet */
          @media (min-width: 768px) {
            .hero-energy-card {
              padding: 24px; /* Requirement 14.6: 24px card padding */
              min-height: 400px;
            }
            
            /* Tablet: 48-56px for value (Requirement 14.6) */
            .hero-energy-value {
              font-size: 48px;
            }
            
            /* Tablet: 26px for unit */
            .hero-energy-unit {
              font-size: 26px;
            }
          }
          
          /* Upper tablet range - scale to 56px max */
          @media (min-width: 900px) and (max-width: 1023px) {
            .hero-energy-value {
              font-size: 56px; /* Requirement 14.6: Upper range 48-56px */
            }
            
            .hero-energy-unit {
              font-size: 28px;
            }
          }
          
          /* Desktop breakpoint: 1024px */
          @media (min-width: 1024px) {
            .hero-energy-card {
              padding: 32px;
              min-height: 400px;
            }
            
            /* Desktop: 56-72px for value */
            .hero-energy-value {
              font-size: 56px;
            }
            
            /* Desktop: 28px for unit */
            .hero-energy-unit {
              font-size: 28px;
            }
          }
          
          /* Extra large desktop: 1280px */
          @media (min-width: 1280px) {
            /* Desktop: 56-72px for value (max) */
            .hero-energy-value {
              font-size: 72px;
            }
            
            /* Desktop: 32px for unit (max) */
            .hero-energy-unit {
              font-size: 32px;
            }
          }
        `}</style>
        
        <div
          className="hero-energy-card rounded-[12px] border"
          style={{
            backgroundColor: cardBgColor,
            borderColor: borderColor,
            // Requirement 20.5: CSS containment for performance
            contain: 'layout style' as const,
          }}
        >
          {/* Task 6.6: Empty State - Show when energyValue undefined and not loading */}
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
                  backgroundColor: isDark ? 'rgba(62, 217, 138, 0.1)' : 'rgba(62, 217, 138, 0.1)',
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
                  className="text-[15px] font-medium"
                  style={{
                    color: labelColor,
                  }}
                >
                  Waiting for data...
                </p>
                <p
                  className="text-[13px] mt-1"
                  style={{
                    color: labelColor,
                    opacity: 0.7,
                  }}
                >
                  Energy data will appear once available
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Energy Value Display Section (Task 6.2) */}
              <div className="flex flex-col gap-3">
                {/* Requirement 3.6: Label "Today's Energy Generated" */}
                <div 
                  className="hero-energy-label"
                  style={{ color: labelColor }}
                >
                  Today's Energy Generated
                </div>
                
                {/* Energy Value and Unit Container */}
                <div className="flex items-baseline gap-2">
                  {/* Requirement 3.3, 3.5, 3.7, 3.8: Energy Value Display */}
                  <span
                    className="hero-energy-value"
                    style={{
                      color: valueColor,
                      opacity: valueOpacity,
                    }}
                  >
                    {formattedEnergy}
                  </span>
                  
                  {/* Requirement 3.4: Unit "kWh" */}
                  <span
                    className="hero-energy-unit"
                    style={{
                      color: unitColor,
                      opacity: valueOpacity,
                    }}
                  >
                    kWh
                  </span>
                </div>
              </div>
              
              {/* Task 6.3: Trend Indicator Integration */}
              {/* Requirement 4.6: Position below energy value with 12px spacing */}
              {/* Requirement 4.1-4.7: Display trend with color-coded arrow */}
              <TrendIndicator
                currentValue={energyValue}
                previousValue={previousDayEnergy}
                format="percentage"
                showIcon={true}
              />
              
              {/* Placeholder for remaining section (task 6.4) */}
              {/* Task 6.4: Mini Trend Graph */}
              
              {/* Task 6.5: AI Insight Section Integration */}
              {/* Requirements 6.1-6.8: Display AI insight with divider */}
              {/* Requirement 6.2: Visual separation with horizontal divider */}
              {/* Requirement 6.6: 16px padding above divider (handled in AIInsightSection) */}
              <AIInsightSection
                insight={aiInsight}
                isLoading={false}
                maxLength={150}
              />
            </>
          )}
        </div>
      </>
    );
  }
);

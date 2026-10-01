/**
 * AI Insight Section Component
 * 
 * Executive summary text derived from historical pattern analysis.
 * Displays brief, actionable insights about energy generation patterns.
 * 
 * Visual Design:
 * - Border-top divider with theme-aware opacity
 * - Sparkles icon (✨) with accent green color
 * - Typography: 13-15px responsive
 * - Text color: Muted (#6B7280 light, #9CA3AF dark)
 * - Line height: 1.5
 * - Padding: 16px above divider
 * 
 * Content Guidelines:
 * - Length: 60-150 characters
 * - Tone: Professional, data-driven
 * - Format: Brief, actionable statement
 * - Examples:
 *   ✅ "Peak generation at 2pm today, 15% above average"
 *   ✅ "Energy output steady across morning hours"
 *   ❌ "Amazing performance! You're crushing it!"
 * 
 * Fallback States:
 * - No insight: "Analysis in progress..."
 * - Loading: Skeleton animation
 * - Error: Hide section entirely (not critical data)
 * 
 * Requirements: 6.1-6.8
 * 
 * @component
 * @example
 * ```tsx
 * <AIInsightSection
 *   insight="Peak generation at 2pm today, 15% above average"
 *   isLoading={false}
 *   maxLength={150}
 * />
 * ```
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import type { AIInsightSectionProps } from '../types/hero-dashboard.types';

/**
 * AIInsightSection Component
 * 
 * Executive summary text with pattern insights.
 */
export const AIInsightSection = React.memo(function AIInsightSection({
  insight,
  isLoading,
  maxLength = 150,
}: AIInsightSectionProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Truncate insight text if it exceeds maxLength
  const displayInsight = React.useMemo(() => {
    if (!insight) return 'Analysis in progress...';
    if (insight.length <= maxLength) return insight;
    return insight.slice(0, maxLength - 3) + '...';
  }, [insight, maxLength]);

  // Theme-aware colors
  const borderColor = isDark
    ? 'rgba(137, 215, 183, 0.12)'
    : 'rgba(26, 49, 44, 0.08)';
  const textColor = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <div
      className="border-t pt-4"
      style={{
        borderColor,
        marginTop: '16px',
      }}
    >
      <div className="flex items-start gap-2">
        <Sparkles
          className="w-4 h-4 flex-shrink-0"
          style={{ color: '#3ED98A' }}
          aria-hidden="true"
        />
        <p
          className="text-[13px] sm:text-[14px] lg:text-[15px]"
          style={{
            color: textColor,
            lineHeight: 1.5,
          }}
        >
          {isLoading ? (
            <span className="animate-pulse">Analyzing patterns...</span>
          ) : (
            displayInsight
          )}
        </p>
      </div>
    </div>
  );
});

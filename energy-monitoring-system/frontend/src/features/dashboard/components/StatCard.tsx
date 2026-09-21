import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Stat Card Props
 */
interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  isLoading?: boolean;
}

/**
 * Stat Card Component - Production-Grade Design
 * Displays a single statistic with icon, value, and optional trend
 * 
 * Refactored for Task 22 (Dark Mode):
 * - Removed AI-generated gradients (bg-gradient-to-br)
 * - Added dark mode support with useTheme hook
 * - Flat colors for icon backgrounds
 * - Restrained hover effects (no transform: scale)
 * - Data-first hierarchy with tabular numerals
 * 
 * Requirements:
 * - 1.4, 3.2, 4.4: Remove gradients, use flat colors
 * - 5.1, 5.2, 5.3: Data-first hierarchy, tabular-nums
 * - 6.1-6.5: Icons beside labels (16px), neutral colors
 * - 9.1-9.7: Flat button/badge styling, restrained hover
 * - 12.1-12.7: Comprehensive dark mode support
 */
export function StatCard({
  icon: Icon,
  title,
  value,
  unit,
  trend,
  variant = 'default',
  isLoading,
}: StatCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Flat color variants (NO gradients)
  const variants = {
    default: {
      iconBg: isDark ? 'rgba(156, 163, 175, 0.15)' : 'rgba(66, 132, 117, 0.1)',
      iconColor: isDark ? '#9CA3AF' : '#428475',
      badgeBg: 'rgba(66, 132, 117, 0.1)',
      badgeText: isDark ? '#89D7B7' : '#428475',
      badgeBorder: 'rgba(66, 132, 117, 0.2)',
    },
    success: {
      iconBg: 'rgba(34, 197, 94, 0.1)',
      iconColor: isDark ? '#4ADE80' : '#15803d',
      badgeBg: 'rgba(34, 197, 94, 0.1)',
      badgeText: isDark ? '#4ADE80' : '#15803d',
      badgeBorder: 'rgba(34, 197, 94, 0.2)',
    },
    warning: {
      iconBg: 'rgba(245, 158, 11, 0.1)',
      iconColor: isDark ? '#FCD34D' : '#92400e',
      badgeBg: 'rgba(245, 158, 11, 0.1)',
      badgeText: isDark ? '#FCD34D' : '#92400e',
      badgeBorder: 'rgba(245, 158, 11, 0.2)',
    },
    danger: {
      iconBg: 'rgba(239, 68, 68, 0.1)',
      iconColor: isDark ? '#FCA5A5' : '#991b1b',
      badgeBg: 'rgba(239, 68, 68, 0.1)',
      badgeText: isDark ? '#FCA5A5' : '#991b1b',
      badgeBorder: 'rgba(239, 68, 68, 0.2)',
    },
    info: {
      iconBg: 'rgba(59, 130, 246, 0.1)',
      iconColor: isDark ? '#93C5FD' : '#1e40af',
      badgeBg: 'rgba(59, 130, 246, 0.1)',
      badgeText: isDark ? '#93C5FD' : '#1e40af',
      badgeBorder: 'rgba(59, 130, 246, 0.2)',
    },
  };

  const colors = variants[variant];
  
  const TrendIcon =
    trend?.direction === 'up'
      ? TrendingUp
      : trend?.direction === 'down'
      ? TrendingDown
      : Minus;

  return (
    <div 
      className={cn(
        'rounded-lg p-6 transition-all duration-200',
        'bg-white dark:bg-[#1C1F28]',
        'border border-[rgba(26,49,44,0.08)] dark:border-[rgba(137,215,183,0.12)]',
        'hover:border-[rgba(26,49,44,0.12)] dark:hover:border-[rgba(137,215,183,0.18)]'
      )}
    >
      {/* Icon and Trend */}
      <div className="mb-5 flex items-start justify-between">
        {/* Icon Container - Flat background, NO gradients */}
        <div
          className="flex h-10 w-10 items-center justify-center rounded-md transition-opacity duration-200 hover:opacity-90"
          style={{
            backgroundColor: colors.iconBg,
          }}
        >
          <Icon 
            className="h-5 w-5" 
            strokeWidth={2} 
            style={{ color: colors.iconColor }}
          />
        </div>
        
        {/* Trend Badge - Semantic colors with borders */}
        {trend && !isLoading && (
          <div
            className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium"
            style={{
              backgroundColor: colors.badgeBg,
              color: colors.badgeText,
              borderColor: colors.badgeBorder,
            }}
          >
            <TrendIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Title - Uppercase Label */}
      <div 
        className="mb-2 text-[13px] font-medium uppercase tracking-wide"
        style={{
          color: isDark ? '#9CA3AF' : '#525252',
        }}
      >
        {title}
      </div>

      {/* Value with Unit - Data-First Hierarchy */}
      {isLoading ? (
        <div 
          className="h-9 w-32 animate-pulse rounded-lg"
          style={{
            backgroundColor: isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(229, 229, 229, 0.5)',
          }}
        />
      ) : (
        <div className="flex items-baseline gap-2">
          <span 
            className="text-4xl font-semibold tabular-nums"
            style={{
              color: isDark ? '#F9FAFB' : '#171717',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value}
          </span>
          {unit && (
            <span 
              className="text-base font-medium"
              style={{
                color: isDark ? '#9CA3AF' : '#737373',
              }}
            >
              {unit}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Badge Variant Type
 */
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Badge Shape Type
 */
type BadgeShape = 'rounded' | 'pill';

/**
 * Badge Props
 */
interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  shape?: BadgeShape;
  className?: string;
}

/**
 * Badge Component
 * 
 * Displays a small label/badge with semantic colors and borders.
 * Uses production-grade styling with:
 * - Semantic colors (green: #22C55E, amber: #F59E0B, red: #EF4444, blue: #3B82F6)
 * - rgba backgrounds with 0.1 opacity for subtle fill
 * - 1px solid borders with 0.2 opacity
 * - border-radius: 6px for standard badges (not rounded-full unless truly pill-shaped)
 * - WCAG AA compliant contrast ratios (4.5:1 minimum)
 * - Dark mode support with adjusted colors for readability
 * 
 * Requirements:
 * - 8.1, 8.2, 8.3, 8.4: Semantic color system
 * - 8.5: Border radius (6px for rounded, 9999px for pill)
 * - 8.6: rgba backgrounds with 0.1 opacity
 * - 8.7: 1px solid borders with 0.2 opacity
 * - 17.4: WCAG AA contrast compliance
 * - 12.1-12.7: Dark mode consistency
 * 
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="danger">Critical</Badge>
 * <Badge variant="warning" shape="pill">Warning</Badge>
 */
export function Badge({ 
  children, 
  variant = 'default', 
  shape = 'rounded',
  className 
}: BadgeProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Semantic colors from design tokens with dark mode support
  // Light mode: darker text for contrast on light backgrounds
  // Dark mode: lighter text for contrast on dark backgrounds
  const variantStyles = {
    default: {
      background: isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(82, 82, 82, 0.1)',
      color: isDark ? '#D1D5DB' : '#525252',
      borderColor: isDark ? 'rgba(156, 163, 175, 0.2)' : 'rgba(82, 82, 82, 0.2)',
    },
    success: {
      background: 'rgba(34, 197, 94, 0.1)',
      color: isDark ? '#4ADE80' : '#15803d', // Lighter green in dark mode for contrast
      borderColor: 'rgba(34, 197, 94, 0.2)',
    },
    warning: {
      background: 'rgba(245, 158, 11, 0.1)',
      color: isDark ? '#FCD34D' : '#92400e', // Lighter amber in dark mode for contrast
      borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    danger: {
      background: 'rgba(239, 68, 68, 0.1)',
      color: isDark ? '#FCA5A5' : '#991b1b', // Lighter red in dark mode for contrast
      borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    info: {
      background: 'rgba(59, 130, 246, 0.1)',
      color: isDark ? '#93C5FD' : '#1e40af', // Lighter blue in dark mode for contrast
      borderColor: 'rgba(59, 130, 246, 0.2)',
    },
  };

  const styles = variantStyles[variant];
  const borderRadius = shape === 'pill' ? '9999px' : '6px';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-medium',
        className
      )}
      style={{
        background: styles.background,
        color: styles.color,
        border: `1px solid ${styles.borderColor}`,
        borderRadius: borderRadius,
      }}
    >
      {children}
    </span>
  );
}

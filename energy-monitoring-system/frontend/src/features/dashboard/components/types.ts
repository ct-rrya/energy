/**
 * Dashboard Component Types
 * Consolidated type definitions and shared constants for dashboard redesign components
 * 
 * Note: Component-specific prop interfaces are exported from their respective component files
 * to avoid duplication and maintain single source of truth.
 * 
 * @module dashboard/components/types
 */

// =============================================================================
// Shared Type Definitions
// =============================================================================

/**
 * Metric Color Variants
 * Semantic colors for different metric types
 */
export type MetricColor = 'accent' | 'amber' | 'blue' | 'red';

// =============================================================================
// Color Mapping Constants
// =============================================================================

/**
 * Metric Color Mapping
 * Maps MetricColor types to hex color values
 */
export const METRIC_COLORS: Record<MetricColor, string> = {
  accent: '#3DDC97',  // EcoStep green (light mode)
  amber: '#F59E0B',   // Warning/energy color
  blue: '#3B82F6',    // Info color
  red: '#EF4444',     // Error/alert color
} as const;

/**
 * Metric Color Mapping (Dark Mode)
 * Maps MetricColor types to hex color values for dark mode
 */
export const METRIC_COLORS_DARK: Record<MetricColor, string> = {
  accent: '#3ED98A',  // EcoStep green (dark mode)
  amber: '#F59E0B',   // Same in dark mode
  blue: '#3B82F6',    // Same in dark mode
  red: '#EF4444',     // Same in dark mode
} as const;

/**
 * Status Color Mapping
 * Maps StatusType to hex color values
 */
export const STATUS_COLORS = {
  connected: '#10B981',   // Green
  active: '#10B981',      // Green (same as connected)
  disconnected: '#EF4444', // Red
  error: '#EF4444',       // Red (same as disconnected)
  waiting: '#6B7280',     // Gray
  unknown: '#6B7280',     // Gray (same as waiting)
} as const;

// =============================================================================
// Responsive Breakpoints
// =============================================================================

/**
 * Responsive Breakpoints
 * Standard breakpoints following Tailwind CSS conventions
 */
export const BREAKPOINTS = {
  mobile: { min: 0, max: 639 },
  tablet: { min: 640, max: 1023 },
  desktop: { min: 1024, max: Infinity },
} as const;

/**
 * Breakpoint Media Queries
 * CSS media query strings for responsive design
 */
export const MEDIA_QUERIES = {
  mobile: '@media (max-width: 639px)',
  tablet: '@media (min-width: 640px) and (max-width: 1023px)',
  desktop: '@media (min-width: 1024px)',
  tabletAndAbove: '@media (min-width: 640px)',
  mobileAndTablet: '@media (max-width: 1023px)',
} as const;

// =============================================================================
// Typography Scale
// =============================================================================

/**
 * Typography Scale for Metrics
 * Responsive font sizes for metric values
 */
export const METRIC_FONT_SIZES = {
  desktop: '2.25rem',   // 36px
  tablet: '2rem',       // 32px
  mobile: '1.75rem',    // 28px
} as const;

/**
 * Label Typography
 * Typography settings for metric labels
 */
export const LABEL_TYPOGRAPHY = {
  fontSize: '0.8125rem',      // 13px
  fontWeight: 500,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
} as const;

/**
 * Unit Typography
 * Typography settings for metric units
 */
export const UNIT_TYPOGRAPHY = {
  fontSize: '1.125rem',       // 18px
  fontWeight: 400,
} as const;

// =============================================================================
// Spacing Constants
// =============================================================================

/**
 * Card Spacing
 * Standard spacing values for cards and containers
 */
export const CARD_SPACING = {
  padding: '1.5rem',          // 24px
  gridGap: '1rem',            // 16px
  sectionGap: '1.5rem',       // 24px
  borderRadius: '12px',
} as const;

// =============================================================================
// Animation Constants
// =============================================================================

/**
 * Animation Durations
 * Standard animation timing values
 */
export const ANIMATION_DURATIONS = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  pulse: '2s',
} as const;

/**
 * Animation Easings
 * Standard easing functions
 */
export const ANIMATION_EASINGS = {
  easeInOut: 'ease-in-out',
  easeOut: 'ease-out',
  easeIn: 'ease-in',
} as const;

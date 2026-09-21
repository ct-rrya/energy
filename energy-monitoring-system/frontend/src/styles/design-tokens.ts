/**
 * EcoStep Design System - Design Tokens
 * 
 * Production-grade design tokens for the EcoStep energy monitoring system.
 * Defines colors, spacing, typography, and component configurations.
 * 
 * Usage:
 * ```typescript
 * import { COLORS, SPACING, TYPOGRAPHY, type ComponentStyleProps } from '@/styles/design-tokens';
 * ```
 */

// ============================================================================
// Color System
// ============================================================================

/**
 * EcoStep Brand Colors
 * Flat colors only - NO gradients
 */
export const COLORS = {
  // Primary EcoStep Green (flat, no gradients)
  ecoGreen: '#3DDC97',
  ecoGreenHover: '#35c27b',
  ecoGreenActive: '#2cab6c',
  
  // Neutral Hierarchy (Light Mode)
  neutral: {
    50: '#FAFAFA',   // Subtle background
    100: '#F5F5F5',  // Surface
    200: '#E5E5E5',  // Border
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',  // Primary text
    700: '#404040',
    800: '#262626',
    900: '#171717',  // Headings
  },
  
  // Semantic Colors (flat, NO gradients)
  semantic: {
    green: '#22C55E',   // Healthy/Success
    amber: '#F59E0B',   // Warning
    red: '#EF4444',     // Error/Critical
    blue: '#3B82F6',    // Info (use sparingly)
  },
  
  // Dark Mode
  dark: {
    background: '#0F1116',     // Deep charcoal (page background)
    surface: '#1C1F28',        // Cards (solid, no glassmorphism)
    surfaceElevated: '#23272F', // Elevated surfaces
    border: '#2A2E37',         // Hairline borders
    textPrimary: '#F9FAFB',    // Primary text
    textSecondary: '#9CA3AF',  // Secondary text
    textMuted: '#6B7280',      // Muted text
  },
} as const;

// ============================================================================
// Spacing & Layout
// ============================================================================

/**
 * Spacing tokens
 */
export const SPACING = {
  borderRadius: {
    sm: '6px',    // Small elements (buttons, inputs, badges)
    md: '8px',    // Standard cards
    lg: '12px',   // Large containers
    full: '9999px', // Pills/badges only
  },
  
  // Hairline borders for definition (instead of shadows)
  borders: {
    light: '1px solid rgba(26, 49, 44, 0.08)',
    lightHover: '1px solid rgba(26, 49, 44, 0.15)',
    dark: '1px solid rgba(137, 215, 183, 0.12)',
    darkHover: '1px solid rgba(137, 215, 183, 0.20)',
  },
  
  // Shadows ONLY for floating elements (modals, dropdowns, tooltips)
  shadows: {
    floating: '0 8px 30px rgba(26, 49, 44, 0.08)',
    floatingLarge: '0 12px 40px rgba(26, 49, 44, 0.12)',
    // DO NOT use shadows on cards, buttons, or containers
  },
} as const;

// ============================================================================
// Typography
// ============================================================================

/**
 * Typography tokens for data-first hierarchy
 */
export const TYPOGRAPHY = {
  // Metric displays (data-first)
  metricPrimary: {
    size: '36px',
    weight: 600,
    features: 'tabular-nums', // font-variant-numeric
  },
  
  metricSecondary: {
    size: '20px',
    weight: 600,
    features: 'tabular-nums',
  },
  
  metricLabel: {
    size: '13px',
    weight: 500,
    transform: 'uppercase',
    letterSpacing: '0.05em',
  },
  
  // Page hierarchy
  pageTitle: {
    size: '32px',
    weight: 700,
    letterSpacing: '-0.02em',
  },
  
  sectionTitle: {
    size: '20px',
    weight: 600,
    letterSpacing: '-0.01em',
  },
  
  cardTitle: {
    size: '16px',
    weight: 600,
  },
  
  // Body text
  body: {
    size: '15px',
    weight: 400,
    lineHeight: 1.6,
  },
  
  bodySmall: {
    size: '13px',
    weight: 400,
    lineHeight: 1.5,
  },
} as const;

// ============================================================================
// Component Configuration Types
// ============================================================================

/**
 * Component style props
 * Used for buttons, badges, and other interactive elements
 */
export interface ComponentStyleProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  hasShadow?: boolean;  // Should be false by default (shadows only for floating elements)
  hasGradient?: boolean; // Should ALWAYS be false (no gradients)
  borderRadius?: 'sm' | 'md' | 'lg' | 'full';
}

/**
 * Badge configuration
 * Semantic colors with borders
 */
export interface BadgeConfig {
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  hasBorder: true; // Always add subtle borders
  shape: 'rounded' | 'pill'; // 'rounded' = 6px, 'pill' = 9999px
}

/**
 * Card configuration
 * Solid backgrounds with hairline borders
 */
export interface CardConfig {
  variant: 'default' | 'compact';
  hasBorder: true; // Hairline 1px borders (always true)
  hasGlassmorphism: false; // DEPRECATED - no backdrop-filter
  elevation: 'none' | 'floating'; // 'none' for cards, 'floating' for modals/dropdowns
  borderRadius: '8px' | '12px';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get theme-aware border color
 */
export function getBorderColor(isDark: boolean, isHover = false): string {
  if (isDark) {
    return isHover ? SPACING.borders.darkHover : SPACING.borders.dark;
  }
  return isHover ? SPACING.borders.lightHover : SPACING.borders.light;
}

/**
 * Get semantic color by variant
 */
export function getSemanticColor(variant: BadgeConfig['variant']): string {
  switch (variant) {
    case 'success':
      return COLORS.semantic.green;
    case 'warning':
      return COLORS.semantic.amber;
    case 'error':
      return COLORS.semantic.red;
    case 'info':
      return COLORS.semantic.blue;
    case 'neutral':
    default:
      return COLORS.neutral[600];
  }
}

/**
 * Get text color based on theme
 */
export function getTextColor(isDark: boolean, variant: 'primary' | 'secondary' | 'muted' = 'primary'): string {
  if (isDark) {
    switch (variant) {
      case 'primary':
        return COLORS.dark.textPrimary;
      case 'secondary':
        return COLORS.dark.textSecondary;
      case 'muted':
        return COLORS.dark.textMuted;
    }
  }
  
  switch (variant) {
    case 'primary':
      return COLORS.neutral[900];
    case 'secondary':
      return COLORS.neutral[600];
    case 'muted':
      return COLORS.neutral[500];
  }
}

// ============================================================================
// Design Principles (Documentation)
// ============================================================================

/**
 * EcoStep Design Principles
 * 
 * 1. NO GRADIENTS - Use flat colors exclusively
 * 2. NO GLASSMORPHISM - Solid backgrounds with hairline borders
 * 3. RESTRAINED SHADOWS - Only for floating elements (modals, dropdowns, tooltips)
 * 4. DATA-FIRST HIERARCHY - Numeric values are visual heroes, not icons
 * 5. SEMANTIC COLORS - Colors communicate meaning (green=healthy, amber=warning, red=error)
 * 6. TABULAR NUMERALS - All numeric displays use tabular-nums for alignment
 * 7. HAIRLINE BORDERS - 1px borders for definition, not shadows
 * 8. MODERATE RADIUS - 6-12px range (not 16-20px bubbles)
 * 9. DARK MODE CONSISTENCY - Same hierarchy and spacing as light mode
 * 10. TECHNICAL LANGUAGE - Direct labels, not SaaS marketing speak
 */


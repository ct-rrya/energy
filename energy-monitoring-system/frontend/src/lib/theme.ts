/**
 * EcoStep Design System - Theme Configuration
 * 
 * Centralized color palette and design tokens for consistent UI across the application.
 * Provides layered dark surfaces and cohesive light/dark mode theming.
 */

export type ThemeMode = 'light' | 'dark';

/**
 * EcoStep Color Palette
 * Core brand colors used throughout the application
 */
export const ECOSTEP_COLORS = {
  // Primary Brand Colors
  green: {
    primary: '#2FBF71',      // EcoStep primary green
    light: '#3ED98A',        // Lighter variant for dark mode
    dark: '#228B54',         // Darker variant
    subtle: '#89D7B7',       // Subtle green for accents
  },
  
  // Neutral Grays
  gray: {
    50: '#F9FAFB',
    100: '#F5F6F8',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Warm Background (Light Mode)
  warm: {
    50: '#FFF9F5',
    100: '#FFF4E1',
    200: '#FFEFD5',
    300: '#FFE4BC',
  },
  
  // Dark Surfaces (Dark Mode)
  dark: {
    page: '#0F1116',         // Main page background - deep charcoal
    sidebar: '#161921',      // Sidebar background - elevated dark
    card: '#1C1F28',         // Card surface - slightly lighter
    cardHover: '#22252F',    // Card hover state
    input: '#13151C',        // Input background - darkest
    border: '#2A2E39',       // Subtle borders
    elevated: '#23272F',     // Elevated surfaces
  },
  
  // Semantic Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

/**
 * EcoStep Brand Colors
 * Using the brand-specific colors consistently
 */
export const BRAND_COLORS = {
  // Core EcoStep colors from brand guidelines
  darkGreen: '#1A312C',      // Primary dark green for text/elements
  mediumGreen: '#428475',    // Secondary green for accents
  mintGreen: '#89D7B7',      // Light green for subtle highlights
  warmCream: '#FFF4E1',      // Warm background for light mode
} as const;

/**
 * Theme Configuration
 * Returns theme-specific color values based on current mode
 */
export function getThemeColors(theme: ThemeMode) {
  const isLight = theme === 'light';
  
  return {
    // Page & Layout
    pageBackground: isLight ? BRAND_COLORS.warmCream : ECOSTEP_COLORS.dark.page,
    sidebarBackground: isLight ? '#FFFFFF' : ECOSTEP_COLORS.dark.sidebar,
    
    // Surface Hierarchy
    cardBackground: isLight ? '#FFFFFF' : ECOSTEP_COLORS.dark.card,
    cardHover: isLight ? ECOSTEP_COLORS.gray[50] : ECOSTEP_COLORS.dark.cardHover,
    inputBackground: isLight ? '#FFFFFF' : ECOSTEP_COLORS.dark.input,
    elevatedBackground: isLight ? '#FFFFFF' : ECOSTEP_COLORS.dark.elevated,
    surfaceMuted: isLight ? '#F8FFFE' : ECOSTEP_COLORS.dark.input,  // Nested panels
    
    // Borders
    border: isLight ? ECOSTEP_COLORS.gray[200] : ECOSTEP_COLORS.dark.border,
    borderSubtle: isLight ? ECOSTEP_COLORS.gray[100] : '#1F232B',
    borderStrong: isLight ? ECOSTEP_COLORS.gray[300] : '#33374',
    
    // Typography
    textPrimary: isLight ? BRAND_COLORS.darkGreen : '#F9FAFB',
    textSecondary: isLight ? ECOSTEP_COLORS.gray[600] : ECOSTEP_COLORS.gray[400],
    textTertiary: isLight ? ECOSTEP_COLORS.gray[500] : ECOSTEP_COLORS.gray[500],
    textMuted: isLight ? ECOSTEP_COLORS.gray[400] : ECOSTEP_COLORS.gray[600],
    
    // Navigation (Light mode needs dark text, dark mode needs light text)
    navText: isLight ? BRAND_COLORS.darkGreen : ECOSTEP_COLORS.gray[400],
    navTextHover: isLight ? BRAND_COLORS.mediumGreen : ECOSTEP_COLORS.gray[300],
    navTextActive: '#FFFFFF',
    navIcon: isLight ? BRAND_COLORS.darkGreen : ECOSTEP_COLORS.gray[400],
    navIconActive: '#FFFFFF',
    navIconInactive: isLight ? ECOSTEP_COLORS.gray[500] : ECOSTEP_COLORS.gray[500],
    
    // Accent Colors
    accent: isLight ? BRAND_COLORS.mediumGreen : ECOSTEP_COLORS.green.light,
    accentHover: isLight ? ECOSTEP_COLORS.green.dark : ECOSTEP_COLORS.green.primary,
    accentSubtle: isLight ? 'rgba(137, 215, 183, 0.15)' : 'rgba(62, 217, 138, 0.15)',
    accentLight: isLight ? '#E6F7F0' : 'rgba(62, 217, 138, 0.1)',
    
    // Interactive States
    hoverBackground: isLight ? ECOSTEP_COLORS.gray[50] : 'rgba(255, 255, 255, 0.05)',
    activeBackground: isLight ? BRAND_COLORS.mediumGreen : ECOSTEP_COLORS.green.light,
    focusRing: isLight ? BRAND_COLORS.mediumGreen : ECOSTEP_COLORS.green.light,
    
    // Semantic
    success: ECOSTEP_COLORS.success,
    warning: ECOSTEP_COLORS.warning,
    error: ECOSTEP_COLORS.error,
    info: ECOSTEP_COLORS.info,
    
    // Special
    backdrop: 'rgba(0, 0, 0, 0.5)',
    shadow: isLight 
      ? '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)'
      : '0 2px 8px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.4)',
    shadowLg: isLight
      ? '0 4px 20px rgba(0, 0, 0, 0.08)'
      : '0 4px 20px rgba(0, 0, 0, 0.4)',
    shadowSubtle: isLight
      ? '0 1px 2px rgba(0, 0, 0, 0.05)'
      : '0 1px 2px rgba(0, 0, 0, 0.2)',
  } as const;
}

/**
 * Spacing & Sizing Design Tokens
 */
export const SPACING = {
  sidebarWidth: {
    expanded: 240,
    collapsed: 72,
  },
  sidebarPadding: {
    horizontal: 16,
    vertical: 24,
  },
  navItem: {
    height: 44,
    gap: 12,
    paddingX: 16,
    paddingY: 12,
    borderRadius: 10,
  },
  card: {
    padding: 24,
    borderRadius: 12,
    gap: 16,
  },
  input: {
    height: 44,
    paddingX: 16,
    borderRadius: 8,
  },
} as const;

/**
 * Typography Scale
 */
export const TYPOGRAPHY = {
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

/**
 * Animation & Transition
 */
export const ANIMATION = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

/**
 * Helper function to get theme-aware styles
 */
export function getThemeStyle(theme: ThemeMode) {
  const colors = getThemeColors(theme);
  
  return {
    // Common style objects
    page: {
      backgroundColor: colors.pageBackground,
      color: colors.textPrimary,
      minHeight: '100vh',
      transition: 'background-color 0.3s ease',
    },
    
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: SPACING.card.borderRadius,
      padding: SPACING.card.padding,
      border: `1px solid ${colors.border}`,
      boxShadow: colors.shadow,
    },
    
    input: {
      backgroundColor: colors.inputBackground,
      color: colors.textPrimary,
      border: `1px solid ${colors.border}`,
      borderRadius: SPACING.input.borderRadius,
      height: SPACING.input.height,
      paddingLeft: SPACING.input.paddingX,
      paddingRight: SPACING.input.paddingX,
    },
    
    button: {
      primary: {
        backgroundColor: colors.accent,
        color: '#FFFFFF',
        borderRadius: SPACING.input.borderRadius,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        transition: `all ${ANIMATION.duration.normal} ${ANIMATION.easing.default}`,
      },
      secondary: {
        backgroundColor: 'transparent',
        color: colors.textSecondary,
        border: `1px solid ${colors.border}`,
        borderRadius: SPACING.input.borderRadius,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
      },
    },
  };
}

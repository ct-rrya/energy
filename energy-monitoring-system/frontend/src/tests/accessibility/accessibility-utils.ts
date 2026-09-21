import { render } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

/**
 * Accessibility Testing Utility
 * 
 * Runs axe-core accessibility audits on components
 * and checks for WCAG AA compliance
 */

export interface AccessibilityAuditOptions {
  rules?: Record<string, { enabled: boolean }>;
  runOnly?: {
    type: 'tag';
    values: string[];
  };
}

/**
 * Run accessibility audit on a component
 * @param container - Rendered component container
 * @param options - Optional axe configuration
 * @returns Promise with axe results
 */
export async function runAccessibilityAudit(
  container: HTMLElement,
  options?: AccessibilityAuditOptions
) {
  const results = await axe(container, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      ...options?.runOnly,
    },
    ...options,
  });
  
  return results;
}

/**
 * Test component for accessibility violations
 * @param ui - Component to test
 * @param options - Optional axe configuration
 */
export async function testAccessibility(
  ui: React.ReactElement,
  options?: AccessibilityAuditOptions
): Promise<void> {
  const { container } = render(ui);
  const results = await runAccessibilityAudit(container, options);
  expect(results).toHaveNoViolations();
}

/**
 * Check color contrast ratio
 * @param foreground - Foreground color (RGB)
 * @param background - Background color (RGB)
 * @returns Contrast ratio
 */
export function getContrastRatio(
  foreground: { r: number; g: number; b: number },
  background: { r: number; g: number; b: number }
): number {
  const l1 = getRelativeLuminance(foreground);
  const l2 = getRelativeLuminance(background);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get relative luminance of a color
 */
function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * @param ratio - Contrast ratio
 * @param isLargeText - Whether text is considered large (18pt+ or 14pt+ bold)
 * @returns true if meets WCAG AA
 */
export function meetsWCAGAA(ratio: number, isLargeText = false): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Parse hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

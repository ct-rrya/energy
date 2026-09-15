/**
 * CustomChartTooltip Component Tests
 * 
 * Tests for the custom Recharts tooltip component.
 * Verifies formatting, theming, and multi-value display functionality.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CustomChartTooltip } from './CustomChartTooltip';

// Helper to render with ThemeProvider
const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

describe('CustomChartTooltip', () => {
  describe('Rendering', () => {
    it('should not render when inactive', () => {
      const { container } = renderWithTheme(
        <CustomChartTooltip active={false} payload={[]} label="" />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should not render when payload is empty', () => {
      const { container } = renderWithTheme(
        <CustomChartTooltip active={true} payload={[]} label="" />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render with single value', () => {
      renderWithTheme(
        <CustomChartTooltip
          active={true}
          payload={[
            {
              name: 'power',
              value: 123.456,
              color: '#428475',
            },
          ]}
          label="2024-01-15T14:30:00Z"
          unit="W"
        />
      );

      // Should display formatted value with unit
      expect(screen.getByText(/123.46 W/i)).toBeInTheDocument();
    });

    it('should render with multiple values', () => {
      renderWithTheme(
        <CustomChartTooltip
          active={true}
          payload={[
            {
              name: 'voltage',
              value: 5.12,
              color: '#428475',
            },
            {
              name: 'current',
              value: 2.34,
              color: '#F59E0B',
            },
          ]}
          label="2024-01-15T14:30:00Z"
          unit="V"
          secondaryUnit="A"
        />
      );

      // Should display both values
      expect(screen.getByText(/5.12 V/i)).toBeInTheDocument();
      expect(screen.getByText(/2.34 A/i)).toBeInTheDocument();
    });
  });

  describe('Value Formatting', () => {
    it('should format values to 2 decimal places', () => {
      renderWithTheme(
        <CustomChartTooltip
          active={true}
          payload={[
            {
              name: 'power',
              value: 123.456789,
              color: '#428475',
            },
          ]}
          label="2024-01-15T14:30:00Z"
          unit="W"
        />
      );

      // Should round to 2 decimals
      expect(screen.getByText(/123.46 W/i)).toBeInTheDocument();
    });

    it('should append correct unit for single value', () => {
      renderWithTheme(
        <CustomChartTooltip
          active={true}
          payload={[
            {
              name: 'energy',
              value: 45.67,
              color: '#89D7B7',
            },
          ]}
          label="2024-01-15"
          unit="kWh"
        />
      );

      expect(screen.getByText(/45.67 kWh/i)).toBeInTheDocument();
    });

    it('should use item unit if provided', () => {
      renderWithTheme(
        <CustomChartTooltip
          active={true}
          payload={[
            {
              name: 'power',
              value: 100,
              color: '#428475',
              unit: 'mW',
            },
          ]}
          label="2024-01-15T14:30:00Z"
          unit="W"
        />
      );

      // Should use item.unit ('mW') over prop unit ('W')
      expect(screen.getByText(/100.00 mW/i)).toBeInTheDocument();
    });
  });

  describe('Timestamp Formatting', () => {
    it('should format ISO 8601 timestamp for today', () => {
      // Create a timestamp for today
      const today = new Date();
      today.setHours(14, 30, 0, 0);
      const isoString = today.toISOString();

      renderWithTheme(
        <CustomChartTooltip
          active={true}
          payload={[
            {
              name: 'power',
              value: 100,
              color: '#428475',
            },
          ]}
          label={isoString}
          unit="W"
        />
      );

      // Should format as time only for today (e.g., "2:30 PM")
      expect(screen.getByText(/2:30 PM/i)).toBeInTheDocument();
    });

    it('should format ISO 8601 timestamp for historical date', () => {
      const historicalDate = '2024-01-15T14:30:00Z';

      renderWithTheme(
        <CustomChartTooltip
          active={true}
          payload={[
            {
              name: 'power',
              value: 100,
              color: '#428475',
            },
          ]}
          label={historicalDate}
          unit="W"
        />
      );

      // Should format as full date and time
      expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
    });

    it('should handle date-only timestamps', () => {
      const dateOnly = '2024-01-15';

      renderWithTheme(
        <CustomChartTooltip
          active={true}
          payload={[
            {
              name: 'energy',
              value: 50,
              color: '#89D7B7',
            },
          ]}
          label={dateOnly}
          unit="kWh"
        />
      );

      // Should format as date only (no time)
      expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
    });

    it('should fallback to original label if parsing fails', () => {
      const customLabel = 'Week 3';

      renderWithTheme(
        <CustomChartTooltip
          active={true}
          payload={[
            {
              name: 'energy',
              value: 200,
              color: '#89D7B7',
            },
          ]}
          label={customLabel}
          unit="kWh"
        />
      );

      // Should display original label
      expect(screen.getByText('Week 3')).toBeInTheDocument();
    });
  });

  describe('Multi-Value Display', () => {
    it('should show metric names for multiple values', () => {
      renderWithTheme(
        <CustomChartTooltip
          active={true}
          payload={[
            {
              name: 'voltage',
              value: 5.0,
              color: '#428475',
            },
            {
              name: 'current',
              value: 2.5,
              color: '#F59E0B',
            },
          ]}
          label="2024-01-15T14:30:00Z"
          unit="V"
          secondaryUnit="A"
        />
      );

      // Should display metric names
      expect(screen.getByText('voltage')).toBeInTheDocument();
      expect(screen.getByText('current')).toBeInTheDocument();
    });

    it('should not show metric name for single value', () => {
      renderWithTheme(
        <CustomChartTooltip
          active={true}
          payload={[
            {
              name: 'power',
              value: 100,
              color: '#428475',
            },
          ]}
          label="2024-01-15T14:30:00Z"
          unit="W"
        />
      );

      // Should not display metric name when only one value
      expect(screen.queryByText('power')).not.toBeInTheDocument();
    });

    it('should use secondaryUnit for second value', () => {
      renderWithTheme(
        <CustomChartTooltip
          active={true}
          payload={[
            {
              name: 'voltage',
              value: 5.0,
              color: '#428475',
            },
            {
              name: 'current',
              value: 2.5,
              color: '#F59E0B',
            },
          ]}
          label="2024-01-15T14:30:00Z"
          unit="V"
          secondaryUnit="A"
        />
      );

      // First value uses unit prop
      expect(screen.getByText(/5.00 V/i)).toBeInTheDocument();
      // Second value uses secondaryUnit prop
      expect(screen.getByText(/2.50 A/i)).toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    it('should render color indicator dots for values', () => {
      const { container } = renderWithTheme(
        <CustomChartTooltip
          active={true}
          payload={[
            {
              name: 'power',
              value: 100,
              color: '#428475',
            },
          ]}
          label="2024-01-15T14:30:00Z"
          unit="W"
        />
      );

      // Should have a colored dot indicator
      const colorDot = container.querySelector('[style*="background-color"]');
      expect(colorDot).toBeInTheDocument();
    });

    it('should render multiple color indicators for multiple values', () => {
      const { container } = renderWithTheme(
        <CustomChartTooltip
          active={true}
          payload={[
            {
              name: 'voltage',
              value: 5.0,
              color: '#428475',
            },
            {
              name: 'current',
              value: 2.5,
              color: '#F59E0B',
            },
          ]}
          label="2024-01-15T14:30:00Z"
          unit="V"
          secondaryUnit="A"
        />
      );

      // Should have two colored dot indicators
      const colorDots = container.querySelectorAll('[style*="border-radius: 50%"]');
      expect(colorDots.length).toBe(2);
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate structure for screen readers', () => {
      const { container } = renderWithTheme(
        <CustomChartTooltip
          active={true}
          payload={[
            {
              name: 'power',
              value: 123.45,
              color: '#428475',
            },
          ]}
          label="2024-01-15T14:30:00Z"
          unit="W"
        />
      );

      // Should have tooltip container with class
      const tooltip = container.querySelector('.custom-chart-tooltip');
      expect(tooltip).toBeInTheDocument();
    });
  });
});

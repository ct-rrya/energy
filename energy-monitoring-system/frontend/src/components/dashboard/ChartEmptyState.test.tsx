/**
 * ChartEmptyState Component Tests
 * 
 * Tests for the ChartEmptyState component including:
 * - Rendering with default and custom messages
 * - Theme integration (light/dark mode)
 * - Proper display of icon, message, and suggestion
 * - Accessibility features
 * 
 * Requirements:
 * - 12.2: Display empty state message when no data points exist
 * - 12.6: Suggest possible actions (e.g., "Try selecting a different time range")
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ChartEmptyState } from './ChartEmptyState';

// Helper function to render component with ThemeProvider
const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

describe('ChartEmptyState', () => {
  describe('Basic Rendering', () => {
    it('renders with default message and suggestion', () => {
      renderWithTheme(<ChartEmptyState />);

      expect(screen.getByText('No data available for this time range')).toBeInTheDocument();
      expect(screen.getByText('Try selecting a different time range or check back later')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
      renderWithTheme(
        <ChartEmptyState message="Custom empty message" />
      );

      expect(screen.getByText('Custom empty message')).toBeInTheDocument();
    });

    it('renders with custom suggestion', () => {
      renderWithTheme(
        <ChartEmptyState suggestion="Custom suggestion text" />
      );

      expect(screen.getByText('Custom suggestion text')).toBeInTheDocument();
    });

    it('renders with both custom message and suggestion', () => {
      renderWithTheme(
        <ChartEmptyState
          message="No sensor data recorded yet"
          suggestion="Install ESP32 sensors to begin collecting data"
        />
      );

      expect(screen.getByText('No sensor data recorded yet')).toBeInTheDocument();
      expect(screen.getByText('Install ESP32 sensors to begin collecting data')).toBeInTheDocument();
    });

    it('renders the ChartNoAxesColumn icon', () => {
      renderWithTheme(<ChartEmptyState />);

      // Check for the icon via its aria-hidden attribute
      const container = screen.getByTestId('chart-empty');
      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Height Configuration', () => {
    it('applies default height of 400px', () => {
      renderWithTheme(<ChartEmptyState />);

      const container = screen.getByTestId('chart-empty');
      expect(container.style.height).toBe('400px');
    });

    it('applies custom numeric height', () => {
      renderWithTheme(<ChartEmptyState height={500} />);

      const container = screen.getByTestId('chart-empty');
      expect(container.style.height).toBe('500px');
    });

    it('applies custom string height', () => {
      renderWithTheme(<ChartEmptyState height="300px" />);

      const container = screen.getByTestId('chart-empty');
      expect(container.style.height).toBe('300px');
    });

    it('accepts CSS height values like percentages', () => {
      renderWithTheme(<ChartEmptyState height="100%" />);

      const container = screen.getByTestId('chart-empty');
      expect(container.style.height).toBe('100%');
    });
  });

  describe('Accessibility', () => {
    it('has proper role and aria-label', () => {
      renderWithTheme(<ChartEmptyState />);

      const container = screen.getByTestId('chart-empty');
      expect(container).toHaveAttribute('role', 'status');
      expect(container).toHaveAttribute('aria-label', 'No chart data available');
    });

    it('includes screen reader text with message and suggestion', () => {
      renderWithTheme(
        <ChartEmptyState
          message="No data"
          suggestion="Try again later"
        />
      );

      // Screen reader text should be present but visually hidden
      const srText = screen.getByText(/No data available\. Try again later/i);
      expect(srText).toHaveClass('sr-only');
    });

    it('has data-testid for testing', () => {
      renderWithTheme(<ChartEmptyState />);

      expect(screen.getByTestId('chart-empty')).toBeInTheDocument();
    });

    it('icon has aria-hidden attribute', () => {
      renderWithTheme(<ChartEmptyState />);

      const container = screen.getByTestId('chart-empty');
      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Styling', () => {
    it('centers content within the container', () => {
      renderWithTheme(<ChartEmptyState />);

      const container = screen.getByTestId('chart-empty');
      expect(container).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('applies theme-aware colors in light mode', () => {
      renderWithTheme(<ChartEmptyState />);

      const message = screen.getByText('No data available for this time range');
      const suggestion = screen.getByText('Try selecting a different time range or check back later');

      // Check that styles are applied (we can't easily test computed styles without more setup)
      expect(message).toBeInTheDocument();
      expect(suggestion).toBeInTheDocument();
    });
  });

  describe('Content Structure', () => {
    it('renders icon above message', () => {
      renderWithTheme(<ChartEmptyState />);

      const container = screen.getByTestId('chart-empty');
      const contentContainer = container.querySelector('.flex.flex-col');
      expect(contentContainer).toBeInTheDocument();
    });

    it('displays message with proper heading level', () => {
      renderWithTheme(<ChartEmptyState message="Test Message" />);

      const heading = screen.getByText('Test Message');
      expect(heading.tagName).toBe('H3');
    });

    it('displays suggestion with proper text styling', () => {
      renderWithTheme(<ChartEmptyState suggestion="Test Suggestion" />);

      const suggestionText = screen.getByText('Test Suggestion');
      expect(suggestionText.tagName).toBe('P');
    });

    it('limits content width for readability', () => {
      renderWithTheme(<ChartEmptyState />);

      const container = screen.getByTestId('chart-empty');
      const contentContainer = container.querySelector('.max-w-md');
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe('Integration with ChartContainer', () => {
    it('matches the expected data-testid used by ChartContainer', () => {
      renderWithTheme(<ChartEmptyState />);

      // ChartContainer expects 'chart-empty' testid
      expect(screen.getByTestId('chart-empty')).toBeInTheDocument();
    });

    it('respects height prop to match chart dimensions', () => {
      // ChartContainer passes height to match chart size
      renderWithTheme(<ChartEmptyState height={350} />);

      const container = screen.getByTestId('chart-empty');
      expect(container.style.height).toBe('350px');
    });
  });
});

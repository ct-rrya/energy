/**
 * ChartContainer Component Tests
 * 
 * Tests for the ChartContainer wrapper component including:
 * - Rendering with different states (loading, error, empty, data)
 * - Theme integration
 * - User interactions (retry button)
 * - Proper display of title, subtitle, and actions
 * 
 * Requirements:
 * - 1.2: Accepts data, loading, error state props
 * - 1.3: Displays loading skeleton when isLoading is true
 * - 1.6: Displays empty state when isEmpty is true
 * - 1.7: Applies theme colors from ThemeContext
 * - 12.3: Displays error message and retry button when error occurs
 * - 12.4: Retry button triggers onRetry callback
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ChartContainer } from './ChartContainer';

// Helper function to render component with ThemeProvider
const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

describe('ChartContainer', () => {
  describe('Basic Rendering', () => {
    it('renders with title and children when no state flags are set', () => {
      renderWithTheme(
        <ChartContainer title="Test Chart">
          <div data-testid="chart-content">Chart Content</div>
        </ChartContainer>
      );

      expect(screen.getByText('Test Chart')).toBeInTheDocument();
      expect(screen.getByTestId('chart-content')).toBeInTheDocument();
    });

    it('renders title and subtitle', () => {
      renderWithTheme(
        <ChartContainer title="Test Chart" subtitle="This is a subtitle">
          <div>Content</div>
        </ChartContainer>
      );

      expect(screen.getByText('Test Chart')).toBeInTheDocument();
      expect(screen.getByText('This is a subtitle')).toBeInTheDocument();
    });

    it('renders action elements when provided', () => {
      renderWithTheme(
        <ChartContainer
          title="Test Chart"
          actions={<button data-testid="action-button">Filter</button>}
        >
          <div>Content</div>
        </ChartContainer>
      );

      expect(screen.getByTestId('action-button')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('displays loading state when isLoading is true', () => {
      renderWithTheme(
        <ChartContainer title="Test Chart" isLoading={true}>
          <div data-testid="chart-content">Chart Content</div>
        </ChartContainer>
      );

      expect(screen.getByTestId('chart-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument();
    });

    it('prioritizes loading state over error state', () => {
      renderWithTheme(
        <ChartContainer title="Test Chart" isLoading={true} error={new Error('Test error')}>
          <div data-testid="chart-content">Chart Content</div>
        </ChartContainer>
      );

      expect(screen.getByTestId('chart-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-error')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error state when error is provided', () => {
      renderWithTheme(
        <ChartContainer title="Test Chart" error={new Error('Test error')}>
          <div data-testid="chart-content">Chart Content</div>
        </ChartContainer>
      );

      expect(screen.getByTestId('chart-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to Load Chart Data')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument();
    });

    it('displays retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      renderWithTheme(
        <ChartContainer title="Test Chart" error={new Error('Test error')} onRetry={onRetry}>
          <div>Content</div>
        </ChartContainer>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      
      renderWithTheme(
        <ChartContainer title="Test Chart" error={new Error('Test error')} onRetry={onRetry}>
          <div>Content</div>
        </ChartContainer>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('prioritizes error state over empty state', () => {
      renderWithTheme(
        <ChartContainer title="Test Chart" error={new Error('Test error')} isEmpty={true}>
          <div data-testid="chart-content">Chart Content</div>
        </ChartContainer>
      );

      expect(screen.getByTestId('chart-error')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-empty')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('displays empty state when isEmpty is true', () => {
      renderWithTheme(
        <ChartContainer title="Test Chart" isEmpty={true}>
          <div data-testid="chart-content">Chart Content</div>
        </ChartContainer>
      );

      expect(screen.getByTestId('chart-empty')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument();
    });

    it('shows empty state message', () => {
      renderWithTheme(
        <ChartContainer title="Test Chart" isEmpty={true}>
          <div>Content</div>
        </ChartContainer>
      );

      expect(screen.getByText('No data available for this time range')).toBeInTheDocument();
    });
  });

  describe('State Priority', () => {
    it('follows correct state priority: loading > error > empty > data', () => {
      const { rerender } = renderWithTheme(
        <ChartContainer
          title="Test Chart"
          isLoading={true}
          error={new Error('Error')}
          isEmpty={true}
        >
          <div data-testid="chart-content">Content</div>
        </ChartContainer>
      );

      // Loading should be shown
      expect(screen.getByTestId('chart-loading')).toBeInTheDocument();

      // Remove loading, error should show
      rerender(
        <ThemeProvider>
          <ChartContainer title="Test Chart" error={new Error('Error')} isEmpty={true}>
            <div data-testid="chart-content">Content</div>
          </ChartContainer>
        </ThemeProvider>
      );
      expect(screen.getByTestId('chart-error')).toBeInTheDocument();

      // Remove error, empty should show
      rerender(
        <ThemeProvider>
          <ChartContainer title="Test Chart" isEmpty={true}>
            <div data-testid="chart-content">Content</div>
          </ChartContainer>
        </ThemeProvider>
      );
      expect(screen.getByTestId('chart-empty')).toBeInTheDocument();

      // Remove empty, content should show
      rerender(
        <ThemeProvider>
          <ChartContainer title="Test Chart">
            <div data-testid="chart-content">Content</div>
          </ChartContainer>
        </ThemeProvider>
      );
      expect(screen.getByTestId('chart-content')).toBeInTheDocument();
    });
  });

  describe('Styling and Theming', () => {
    it('applies custom className', () => {
      renderWithTheme(
        <ChartContainer title="Test Chart" className="custom-class">
          <div>Content</div>
        </ChartContainer>
      );

      const container = screen.getByTestId('chart-container');
      expect(container).toHaveClass('custom-class');
    });

    it('applies glassmorphic styling in light mode', () => {
      renderWithTheme(
        <ChartContainer title="Test Chart">
          <div>Content</div>
        </ChartContainer>
      );

      const container = screen.getByTestId('chart-container');
      const styles = window.getComputedStyle(container);
      
      // Check for backdrop filter (glassmorphic effect)
      expect(container.style.backdropFilter).toBe('blur(16px)');
      expect(container.style.borderRadius).toBe('22px');
    });

    it('renders properly with custom height', () => {
      renderWithTheme(
        <ChartContainer title="Test Chart" height={500} isLoading={true}>
          <div>Content</div>
        </ChartContainer>
      );

      // Loading state should receive the custom height
      const loadingState = screen.getByTestId('chart-loading');
      expect(loadingState).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper data-testid for testing', () => {
      renderWithTheme(
        <ChartContainer title="Test Chart">
          <div>Content</div>
        </ChartContainer>
      );

      expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    });

    it('maintains heading hierarchy with h2 for title', () => {
      renderWithTheme(
        <ChartContainer title="Test Chart">
          <div>Content</div>
        </ChartContainer>
      );

      const heading = screen.getByText('Test Chart');
      expect(heading.tagName).toBe('H2');
    });
  });
});

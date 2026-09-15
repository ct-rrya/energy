/**
 * ChartErrorState Component Tests
 * 
 * Tests for the ChartErrorState component to verify:
 * - Error message display
 * - Retry button functionality
 * - Theme-aware styling
 * - Accessibility features
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChartErrorState } from './ChartErrorState';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Helper function to render with theme provider
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('ChartErrorState', () => {
  it('renders error message with Error object', () => {
    const error = new Error('Network request failed');
    renderWithTheme(<ChartErrorState error={error} />);

    expect(screen.getByText('Unable to Load Chart')).toBeInTheDocument();
    expect(screen.getByText('Network request failed')).toBeInTheDocument();
  });

  it('renders error message with string', () => {
    const error = 'API endpoint not found';
    renderWithTheme(<ChartErrorState error={error} />);

    expect(screen.getByText('Unable to Load Chart')).toBeInTheDocument();
    expect(screen.getByText('API endpoint not found')).toBeInTheDocument();
  });

  it('renders default error message when error is undefined', () => {
    renderWithTheme(<ChartErrorState />);

    expect(screen.getByText('Unable to Load Chart')).toBeInTheDocument();
    expect(screen.getByText('Failed to load chart data')).toBeInTheDocument();
  });

  it('renders retry button when onRetry prop is provided', () => {
    const onRetry = vi.fn();
    renderWithTheme(<ChartErrorState error="Test error" onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /retry loading chart data/i });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveTextContent('Try Again');
  });

  it('does not render retry button when onRetry prop is not provided', () => {
    renderWithTheme(<ChartErrorState error="Test error" />);

    const retryButton = screen.queryByRole('button', { name: /retry loading chart data/i });
    expect(retryButton).not.toBeInTheDocument();
  });

  it('calls onRetry callback when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderWithTheme(<ChartErrorState error="Test error" onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /retry loading chart data/i });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders AlertCircle icon', () => {
    renderWithTheme(<ChartErrorState error="Test error" />);

    // Check for the error alert role
    const alertDiv = screen.getByRole('alert');
    expect(alertDiv).toBeInTheDocument();
  });

  it('applies custom height prop', () => {
    const { container } = renderWithTheme(
      <ChartErrorState error="Test error" height={500} />
    );

    const errorContainer = container.querySelector('[data-testid="chart-error"]');
    expect(errorContainer).toHaveStyle({ height: '500px' });
  });

  it('applies string height prop', () => {
    const { container } = renderWithTheme(
      <ChartErrorState error="Test error" height="350px" />
    );

    const errorContainer = container.querySelector('[data-testid="chart-error"]');
    expect(errorContainer).toHaveStyle({ height: '350px' });
  });

  it('has proper ARIA attributes for accessibility', () => {
    renderWithTheme(<ChartErrorState error="Connection timeout" />);

    const alertDiv = screen.getByRole('alert');
    expect(alertDiv).toHaveAttribute('aria-live', 'assertive');
    expect(alertDiv).toHaveAttribute('aria-label', 'Chart data loading error');

    // Check for screen reader text
    const srText = screen.getByText(/Error loading chart data: Connection timeout/i, {
      selector: '.sr-only',
    });
    expect(srText).toBeInTheDocument();
  });

  it('includes retry instruction in screen reader text when onRetry is provided', () => {
    const onRetry = vi.fn();
    renderWithTheme(<ChartErrorState error="Test error" onRetry={onRetry} />);

    const srText = screen.getByText(/Press the Try Again button to retry loading the data/i, {
      selector: '.sr-only',
    });
    expect(srText).toBeInTheDocument();
  });

  it('has proper test ID for component identification', () => {
    const { container } = renderWithTheme(<ChartErrorState error="Test error" />);

    const errorContainer = container.querySelector('[data-testid="chart-error"]');
    expect(errorContainer).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardErrorBoundary } from './DashboardErrorBoundary';

// Component that throws an error for testing
function ThrowError() {
  throw new Error('Test error message');
}

// Component that renders normally
function NormalComponent() {
  return <div>Normal content</div>;
}

describe('DashboardErrorBoundary', () => {
  // Suppress console.error during tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error occurs', () => {
    render(
      <DashboardErrorBoundary>
        <NormalComponent />
      </DashboardErrorBoundary>
    );
    
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders error UI when error is caught', () => {
    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays error message from caught error', () => {
    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders retry button when error occurs', () => {
    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );
    
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls onReset when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    
    render(
      <DashboardErrorBoundary onReset={onReset}>
        <ThrowError />
      </DashboardErrorBoundary>
    );
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);
    
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;
    
    render(
      <DashboardErrorBoundary fallback={customFallback}>
        <ThrowError />
      </DashboardErrorBoundary>
    );
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('displays error icon in default UI', () => {
    const { container } = render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );
    
    // Check for AlertTriangle icon
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('applies dashboard design system styling', () => {
    const { container } = render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );
    
    const errorContainer = container.firstChild;
    expect(errorContainer).toHaveClass('bg-[#FFF4E1]', 'dark:bg-[#0F1116]');
  });
});

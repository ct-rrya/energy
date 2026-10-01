import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataFetchError } from './DataFetchError';

describe('DataFetchError', () => {
  it('renders error message', () => {
    render(
      <DataFetchError
        message="Failed to load data"
        onRetry={() => {}}
      />
    );
    
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('uses default message when not provided', () => {
    render(
      <DataFetchError
        onRetry={() => {}}
      />
    );
    
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    
    render(
      <DataFetchError
        message="Failed to load data"
        onRetry={onRetry}
      />
    );
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows loading state when retrying', () => {
    render(
      <DataFetchError
        message="Failed to load data"
        onRetry={() => {}}
        isRetrying={true}
      />
    );
    
    expect(screen.getByText('Retrying...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disables retry button when retrying', () => {
    render(
      <DataFetchError
        message="Failed to load data"
        onRetry={() => {}}
        isRetrying={true}
      />
    );
    
    const retryButton = screen.getByRole('button');
    expect(retryButton).toBeDisabled();
  });

  it('has proper aria attributes for accessibility', () => {
    const { container } = render(
      <DataFetchError
        message="Failed to load data"
        onRetry={() => {}}
      />
    );
    
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('displays error icon', () => {
    const { container } = render(
      <DataFetchError
        message="Failed to load data"
        onRetry={() => {}}
      />
    );
    
    // Check for AlertCircle icon
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});

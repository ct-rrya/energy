import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MetricCardSkeleton } from './MetricCardSkeleton';

describe('MetricCardSkeleton', () => {
  it('renders with proper aria attributes for accessibility', () => {
    const { container } = render(<MetricCardSkeleton />);
    const skeleton = container.querySelector('[aria-busy="true"]');
    
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-label', 'Loading metric');
  });

  it('applies pulse animation to skeleton elements', () => {
    const { container } = render(<MetricCardSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('maintains card structure matching MetricCard', () => {
    const { container } = render(<MetricCardSkeleton />);
    const card = container.querySelector('.eco-card');
    
    expect(card).toBeInTheDocument();
    expect(card).toHaveStyle({ padding: '24px' });
  });

  it('renders label and value skeleton placeholders', () => {
    const { container } = render(<MetricCardSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    
    // Should have 2 skeletons: label and value
    expect(skeletons.length).toBe(2);
  });
});

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StepActivityCardSkeleton } from './StepActivityCardSkeleton';

describe('StepActivityCardSkeleton', () => {
  it('renders with proper aria attributes for accessibility', () => {
    const { container } = render(<StepActivityCardSkeleton />);
    const skeleton = container.querySelector('[aria-busy="true"]');
    
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-label', 'Loading step activity');
  });

  it('applies pulse animation to skeleton elements', () => {
    const { container } = render(<StepActivityCardSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('maintains card structure matching StepActivityCard', () => {
    const { container } = render(<StepActivityCardSkeleton />);
    const card = container.querySelector('.eco-card');
    
    expect(card).toBeInTheDocument();
    expect(card).toHaveStyle({ padding: '24px' });
  });

  it('applies max-width constraint matching StepActivityCard', () => {
    const { container } = render(<StepActivityCardSkeleton />);
    const card = container.querySelector('.eco-card');
    
    expect(card).toHaveStyle({ maxWidth: '400px' });
  });

  it('renders label and value skeleton placeholders', () => {
    const { container } = render(<StepActivityCardSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    
    // Should have 2 skeletons: label and value
    expect(skeletons.length).toBe(2);
  });

  it('applies theme-aware styling', () => {
    const { container } = render(<StepActivityCardSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    
    // Check for dark mode classes
    skeletons.forEach(skeleton => {
      expect(skeleton.className).toMatch(/dark:/);
    });
  });
});

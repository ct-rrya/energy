import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SystemStatusCardSkeleton } from './SystemStatusCardSkeleton';

describe('SystemStatusCardSkeleton', () => {
  it('renders with proper aria attributes for accessibility', () => {
    const { container } = render(<SystemStatusCardSkeleton />);
    const skeleton = container.querySelector('[aria-busy="true"]');
    
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-label', 'Loading system status');
  });

  it('applies pulse animation to skeleton elements', () => {
    const { container } = render(<SystemStatusCardSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    
    // Should have multiple pulse elements (title + 3 indicators with labels/values)
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('maintains card structure matching SystemStatusCard', () => {
    const { container } = render(<SystemStatusCardSkeleton />);
    const card = container.querySelector('.eco-card');
    
    expect(card).toBeInTheDocument();
    expect(card).toHaveStyle({ padding: '24px' });
  });

  it('renders three status indicator skeletons', () => {
    const { container } = render(<SystemStatusCardSkeleton />);
    
    // Should have 3 status indicator skeletons (Wi-Fi, Bluetooth, Data Transfer)
    const indicators = container.querySelectorAll('.flex.items-start.gap-3');
    expect(indicators.length).toBe(3);
  });

  it('applies responsive grid layout', () => {
    const { container } = render(<SystemStatusCardSkeleton />);
    const grid = container.querySelector('.grid');
    
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain('grid-cols-1');
    expect(grid?.className).toContain('sm:grid-cols-3');
  });

  it('renders title skeleton', () => {
    const { container } = render(<SystemStatusCardSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    
    // First pulse element should be the title
    const titleSkeleton = pulseElements[0];
    expect(titleSkeleton).toBeInTheDocument();
  });

  it('renders status dot skeletons for each indicator', () => {
    const { container } = render(<SystemStatusCardSkeleton />);
    const statusDots = container.querySelectorAll('.rounded-full');
    
    // Should have 3 status dots (one per indicator)
    expect(statusDots.length).toBe(3);
    
    // Each dot should be 8px circle
    statusDots.forEach(dot => {
      expect(dot).toHaveStyle({ width: '8px', height: '8px' });
    });
  });

  it('applies theme-aware styling', () => {
    const { container } = render(<SystemStatusCardSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    
    // Check for dark mode classes
    skeletons.forEach(skeleton => {
      expect(skeleton.className).toMatch(/dark:/);
    });
  });
});

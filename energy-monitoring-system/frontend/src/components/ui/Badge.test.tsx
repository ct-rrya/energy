import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

// Create a mock function that can be updated per test
const mockUseTheme = vi.fn();

// Mock the theme context
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => mockUseTheme(),
}));

describe('Badge Component', () => {
  // Set default theme to light before each test
  beforeEach(() => {
    mockUseTheme.mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });
  });

  describe('Task 6.1: Semantic color system', () => {
    it('should use green semantic color (#22C55E) for success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.querySelector('span');
      
      expect(badge).toHaveStyle({
        background: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.2)',
      });
    });

    it('should use amber semantic color (#F59E0B) for warning variant', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.querySelector('span');
      
      expect(badge).toHaveStyle({
        background: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.2)',
      });
    });

    it('should use red semantic color (#EF4444) for danger variant', () => {
      const { container } = render(<Badge variant="danger">Error</Badge>);
      const badge = container.querySelector('span');
      
      expect(badge).toHaveStyle({
        background: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.2)',
      });
    });

    it('should use blue semantic color (#3B82F6) for info variant', () => {
      const { container } = render(<Badge variant="info">Info</Badge>);
      const badge = container.querySelector('span');
      
      expect(badge).toHaveStyle({
        background: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.2)',
      });
    });

    it('should use rgba backgrounds with 0.1 opacity (Requirement 8.6)', () => {
      const { container } = render(<Badge variant="success">Active</Badge>);
      const badge = container.querySelector('span');
      const bgStyle = badge?.style.background;
      
      expect(bgStyle).toContain('0.1');
    });

    it('should add 1px solid borders with 0.2 opacity (Requirements 8.4, 8.7)', () => {
      const { container } = render(<Badge variant="success">Active</Badge>);
      const badge = container.querySelector('span');
      
      expect(badge).toHaveStyle({
        border: '1px solid rgba(34, 197, 94, 0.2)',
      });
    });
  });

  describe('Task 6.2: Badge shape and borders', () => {
    it('should use border-radius 6px for standard badges (Requirement 8.5)', () => {
      const { container } = render(<Badge variant="success">Active</Badge>);
      const badge = container.querySelector('span');
      
      expect(badge).toHaveStyle({
        borderRadius: '6px',
      });
    });

    it('should use border-radius 9999px only for pill badges (Requirement 8.5)', () => {
      const { container } = render(
        <Badge variant="success" shape="pill">Pill Badge</Badge>
      );
      const badge = container.querySelector('span');
      
      expect(badge).toHaveStyle({
        borderRadius: '9999px',
      });
    });

    it('should default to rounded shape when no shape is specified', () => {
      const { container } = render(<Badge variant="success">Default</Badge>);
      const badge = container.querySelector('span');
      
      expect(badge).toHaveStyle({
        borderRadius: '6px',
      });
    });
  });

  describe('Accessibility and contrast (Requirement 17.4)', () => {
    it('should render text content correctly', () => {
      render(<Badge variant="success">Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should use darker text colors in light mode for contrast', () => {
      const { container } = render(<Badge variant="success">Active</Badge>);
      const badge = container.querySelector('span');
      
      // Light mode should use dark green text (#15803d) for contrast
      expect(badge).toHaveStyle({
        color: '#15803d',
      });
    });
  });

  describe('Dark mode support (Requirement 12)', () => {
    it('should adjust colors for dark mode', () => {
      mockUseTheme.mockReturnValue({ 
        theme: 'dark', 
        toggleTheme: vi.fn() 
      });

      const { container } = render(<Badge variant="success">Active</Badge>);
      const badge = container.querySelector('span');
      
      // Dark mode should use lighter green text for contrast
      expect(badge).toHaveStyle({
        color: '#4ADE80',
      });
    });
  });

  describe('Component variants', () => {
    it('should render default variant', () => {
      const { container } = render(<Badge>Default</Badge>);
      const badge = container.querySelector('span');
      
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveStyle({
        background: 'rgba(82, 82, 82, 0.1)',
      });
    });

    it('should allow custom className', () => {
      const { container } = render(
        <Badge variant="success" className="custom-class">Custom</Badge>
      );
      const badge = container.querySelector('span');
      
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('Requirements validation', () => {
    it('should NOT use arbitrary colors (Requirement 8.7)', () => {
      // All variants should use semantic colors from design tokens
      const variants = ['success', 'warning', 'danger', 'info', 'default'] as const;
      
      variants.forEach(variant => {
        const { container } = render(<Badge variant={variant}>{variant}</Badge>);
        const badge = container.querySelector('span');
        const bgStyle = badge?.style.background;
        
        // Should use rgba with semantic colors, not arbitrary purple, orange, etc.
        expect(bgStyle).toMatch(/rgba\(\d+, \d+, \d+, 0\.1\)/);
      });
    });

    it('should have visible borders on all variants (Requirement 8.4)', () => {
      const variants = ['success', 'warning', 'danger', 'info', 'default'] as const;
      
      variants.forEach(variant => {
        const { container } = render(<Badge variant={variant}>{variant}</Badge>);
        const badge = container.querySelector('span');
        const borderStyle = badge?.style.border;
        
        expect(borderStyle).toContain('1px solid');
      });
    });
  });
});

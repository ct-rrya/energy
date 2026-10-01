/**
 * AIInsightSection Component Tests
 * 
 * Verifies Requirements 6.1-6.8:
 * - 6.1: Component structure and props acceptance
 * - 6.2: Sparkles icon with #3ED98A color
 * - 6.3: Muted text color (#6B7280 light, #9CA3AF dark)
 * - 6.4: Border-top divider with theme-aware color
 * - 6.5: 13-15px responsive typography
 * - 6.6: 16px padding above divider
 * - 6.7: "Analysis in progress..." when insight is undefined
 * - 6.8: Update when new insights become available
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AIInsightSection } from './AIInsightSection';

// Mock ThemeContext
const mockUseTheme = vi.fn();
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => mockUseTheme(),
}));

describe('AIInsightSection Component', () => {
  beforeEach(() => {
    // Default to light theme
    mockUseTheme.mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });
  });

  describe('Requirement 6.1 - Component Structure and Props', () => {
    it('should accept insight, isLoading, and maxLength props', () => {
      const { rerender } = render(
        <AIInsightSection
          insight="Peak generation at 2pm today"
          isLoading={false}
          maxLength={150}
        />
      );

      expect(screen.getByText('Peak generation at 2pm today')).toBeInTheDocument();

      // Test prop updates
      rerender(
        <AIInsightSection
          insight="Energy output steady across morning hours"
          isLoading={false}
          maxLength={150}
        />
      );

      expect(screen.getByText('Energy output steady across morning hours')).toBeInTheDocument();
    });

    it('should default maxLength to 150 when not provided', () => {
      const longInsight = 'a'.repeat(200);
      render(
        <AIInsightSection
          insight={longInsight}
          isLoading={false}
        />
      );

      const displayedText = screen.getByText(/a+\.\.\./);
      expect(displayedText.textContent?.length).toBe(150); // 147 chars + '...'
    });
  });

  describe('Requirement 6.2 - Sparkles Icon with #3ED98A Color', () => {
    it('should render Sparkles icon with accent green color', () => {
      const { container } = render(
        <AIInsightSection
          insight="Test insight"
          isLoading={false}
        />
      );

      // Find the Sparkles icon (lucide-react renders as SVG)
      const sparklesIcon = container.querySelector('svg');
      expect(sparklesIcon).toBeInTheDocument();
      expect(sparklesIcon).toHaveClass('lucide-sparkles');
      expect(sparklesIcon).toHaveStyle({ color: '#3ED98A' });
    });

    it('should have aria-hidden attribute on icon', () => {
      const { container } = render(
        <AIInsightSection
          insight="Test insight"
          isLoading={false}
        />
      );

      const sparklesIcon = container.querySelector('svg');
      expect(sparklesIcon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Requirement 6.3 - Muted Text Color', () => {
    it('should use #6B7280 color in light mode', () => {
      mockUseTheme.mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });

      render(
        <AIInsightSection
          insight="Test insight"
          isLoading={false}
        />
      );

      const text = screen.getByText('Test insight');
      expect(text).toHaveStyle({ color: '#6B7280' });
    });

    it('should use #9CA3AF color in dark mode', () => {
      mockUseTheme.mockReturnValue({ theme: 'dark', toggleTheme: vi.fn() });

      render(
        <AIInsightSection
          insight="Test insight"
          isLoading={false}
        />
      );

      const text = screen.getByText('Test insight');
      expect(text).toHaveStyle({ color: '#9CA3AF' });
    });
  });

  describe('Requirement 6.4 - Border-top Divider with Theme-aware Color', () => {
    it('should render border-top with light theme color', () => {
      mockUseTheme.mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });

      const { container } = render(
        <AIInsightSection
          insight="Test insight"
          isLoading={false}
        />
      );

      const divider = container.querySelector('.border-t');
      expect(divider).toHaveStyle({
        borderColor: 'rgba(26, 49, 44, 0.08)',
      });
    });

    it('should render border-top with dark theme color', () => {
      mockUseTheme.mockReturnValue({ theme: 'dark', toggleTheme: vi.fn() });

      const { container } = render(
        <AIInsightSection
          insight="Test insight"
          isLoading={false}
        />
      );

      const divider = container.querySelector('.border-t');
      expect(divider).toHaveStyle({
        borderColor: 'rgba(137, 215, 183, 0.12)',
      });
    });
  });

  describe('Requirement 6.5 - 13-15px Responsive Typography', () => {
    it('should apply responsive typography classes', () => {
      render(
        <AIInsightSection
          insight="Test insight"
          isLoading={false}
        />
      );

      const text = screen.getByText('Test insight');
      expect(text).toHaveClass('text-[13px]', 'sm:text-[14px]', 'lg:text-[15px]');
    });

    it('should have line-height of 1.5', () => {
      render(
        <AIInsightSection
          insight="Test insight"
          isLoading={false}
        />
      );

      const text = screen.getByText('Test insight');
      expect(text).toHaveStyle({ lineHeight: 1.5 });
    });
  });

  describe('Requirement 6.6 - 16px Padding Above Divider', () => {
    it('should apply 16px padding-top to divider section', () => {
      const { container } = render(
        <AIInsightSection
          insight="Test insight"
          isLoading={false}
        />
      );

      const divider = container.querySelector('.border-t');
      expect(divider).toHaveClass('pt-4'); // pt-4 = 16px in Tailwind
    });

    it('should apply 16px margin-top', () => {
      const { container } = render(
        <AIInsightSection
          insight="Test insight"
          isLoading={false}
        />
      );

      const divider = container.querySelector('.border-t');
      expect(divider).toHaveStyle({ marginTop: '16px' });
    });
  });

  describe('Requirement 6.7 - Show "Analysis in progress..." when insight is undefined', () => {
    it('should display fallback text when insight is undefined', () => {
      render(
        <AIInsightSection
          insight={undefined}
          isLoading={false}
        />
      );

      expect(screen.getByText('Analysis in progress...')).toBeInTheDocument();
    });

    it('should display "Analyzing patterns..." when loading', () => {
      render(
        <AIInsightSection
          insight="Test insight"
          isLoading={true}
        />
      );

      expect(screen.getByText('Analyzing patterns...')).toBeInTheDocument();
      expect(screen.queryByText('Test insight')).not.toBeInTheDocument();
    });

    it('should apply animate-pulse class when loading', () => {
      render(
        <AIInsightSection
          insight={undefined}
          isLoading={true}
        />
      );

      const loadingText = screen.getByText('Analyzing patterns...');
      expect(loadingText).toHaveClass('animate-pulse');
    });
  });

  describe('Requirement 6.8 - Update when new insights become available', () => {
    it('should update displayed insight when prop changes', () => {
      const { rerender } = render(
        <AIInsightSection
          insight="Initial insight"
          isLoading={false}
        />
      );

      expect(screen.getByText('Initial insight')).toBeInTheDocument();

      rerender(
        <AIInsightSection
          insight="Updated insight"
          isLoading={false}
        />
      );

      expect(screen.queryByText('Initial insight')).not.toBeInTheDocument();
      expect(screen.getByText('Updated insight')).toBeInTheDocument();
    });

    it('should transition from loading to loaded state', () => {
      const { rerender } = render(
        <AIInsightSection
          insight={undefined}
          isLoading={true}
        />
      );

      expect(screen.getByText('Analyzing patterns...')).toBeInTheDocument();

      rerender(
        <AIInsightSection
          insight="Peak generation at 2pm today"
          isLoading={false}
        />
      );

      expect(screen.queryByText('Analyzing patterns...')).not.toBeInTheDocument();
      expect(screen.getByText('Peak generation at 2pm today')).toBeInTheDocument();
    });
  });

  describe('Text Truncation', () => {
    it('should truncate text exceeding maxLength', () => {
      const longInsight = 'This is a very long insight that exceeds the maximum length and should be truncated';
      
      render(
        <AIInsightSection
          insight={longInsight}
          isLoading={false}
          maxLength={50}
        />
      );

      const displayedText = screen.getByText(/This is a very long insight.*\.\.\./);
      expect(displayedText.textContent).toBe(longInsight.slice(0, 47) + '...');
      expect(displayedText.textContent?.length).toBe(50);
    });

    it('should not truncate text within maxLength', () => {
      const shortInsight = 'Short insight';
      
      render(
        <AIInsightSection
          insight={shortInsight}
          isLoading={false}
          maxLength={150}
        />
      );

      expect(screen.getByText('Short insight')).toBeInTheDocument();
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
    });
  });

  describe('Layout and Spacing', () => {
    it('should use flex layout with gap-2 for icon and text', () => {
      const { container } = render(
        <AIInsightSection
          insight="Test insight"
          isLoading={false}
        />
      );

      const flexContainer = container.querySelector('.flex.items-start.gap-2');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should have flex-shrink-0 on icon to prevent shrinking', () => {
      const { container } = render(
        <AIInsightSection
          insight="Test insight"
          isLoading={false}
        />
      );

      const sparklesIcon = container.querySelector('svg');
      expect(sparklesIcon).toHaveClass('flex-shrink-0');
    });
  });

  describe('Component Memoization', () => {
    it('should be wrapped with React.memo', () => {
      // React.memo wraps the component, verify it's memoized by checking type
      expect(AIInsightSection.$$typeof).toBe(Symbol.for('react.memo'));
    });
  });

  describe('Content Guidelines Validation', () => {
    it('should display professional, data-driven insights', () => {
      const professionalInsights = [
        'Peak generation at 2pm today, 15% above average',
        'Energy output steady across morning hours',
        'Voltage levels optimal throughout the day',
      ];

      professionalInsights.forEach((insight) => {
        const { unmount } = render(
          <AIInsightSection
            insight={insight}
            isLoading={false}
          />
        );
        
        expect(screen.getByText(insight)).toBeInTheDocument();
        unmount();
      });
    });
  });
});

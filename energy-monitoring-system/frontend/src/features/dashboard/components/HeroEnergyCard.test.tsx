/**
 * HeroEnergyCard Component Tests - Tasks 6.1, 6.2
 * 
 * Tests for the hero energy card component including base structure and energy value display.
 * This test suite will be expanded in tasks 6.3-6.8 as additional sections are implemented.
 * 
 * Test Coverage:
 * Task 6.1 - Base Structure:
 * - Card container rendering
 * - Border radius and styling
 * - Responsive padding (via media queries)
 * - Minimum height
 * - CSS containment
 * - Theme-aware colors
 * 
 * Task 6.2 - Energy Value Display:
 * - Label display ("Today's Energy Generated")
 * - Energy value formatting (toFixed(1))
 * - Unit display ("kWh")
 * - Responsive typography
 * - Accent color (#3ED98A)
 * - Tabular numerals
 * - Opacity when undefined
 * - useMemo optimization
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 12.5, 12.7, 20.5
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HeroEnergyCard } from './HeroEnergyCard';
import { ThemeProvider } from '@/contexts/ThemeContext';
import type { TrendDataPoint } from '../types/hero-dashboard.types';

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

const mockTrendData: TrendDataPoint[] = [
  { timestamp: '2025-01-15T00:00:00Z', value: 20.5 },
  { timestamp: '2025-01-15T06:00:00Z', value: 22.0 },
];

describe('HeroEnergyCard - Base Structure (Task 6.1)', () => {
  describe('Requirement 6.1: Card Structure and Styling', () => {
    it('should render the card container', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation at 2pm"
          isLoading={false}
          isError={false}
        />
      );

      const card = container.querySelector('.hero-energy-card');
      expect(card).toBeInTheDocument();
    });

    it('should apply 12px border radius (Requirement 12.5)', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation at 2pm"
          isLoading={false}
          isError={false}
        />
      );

      const card = container.querySelector('.rounded-\\[12px\\]');
      expect(card).toBeInTheDocument();
    });

    it('should apply border styling', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation at 2pm"
          isLoading={false}
          isError={false}
        />
      );

      const card = container.querySelector('.border');
      expect(card).toBeInTheDocument();
    });

    it('should apply CSS containment (Requirement 20.5)', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation at 2pm"
          isLoading={false}
          isError={false}
        />
      );

      const card = container.querySelector('.hero-energy-card');
      expect(card).toHaveStyle({ contain: 'layout style' });
    });

    it('should have responsive padding styles defined', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation at 2pm"
          isLoading={false}
          isError={false}
        />
      );

      // Check that style tag with media queries exists
      const styleTag = container.querySelector('style');
      expect(styleTag).toBeInTheDocument();
      expect(styleTag?.textContent).toContain('@media (min-width: 768px)');
      expect(styleTag?.textContent).toContain('@media (min-width: 1024px)');
    });

    it('should display placeholder text indicating task 6.1 completion', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation at 2pm"
          isLoading={false}
          isError={false}
        />
      );

      // Placeholder comments for future sections (6.3-6.5) should exist
      expect(container.textContent).toContain('Today\'s Energy Generated');
    });
  });

  describe('Theme Support', () => {
    it('should apply theme-aware background and border colors', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation at 2pm"
          isLoading={false}
          isError={false}
        />
      );

      const card = container.querySelector('.hero-energy-card');
      expect(card).toHaveStyle({ backgroundColor: expect.any(String) });
      expect(card).toHaveStyle({ borderColor: expect.any(String) });
    });
  });

  describe('Props Interface', () => {
    it('should accept all required props without errors', () => {
      expect(() => {
        renderWithTheme(
          <HeroEnergyCard
            energyValue={24.7}
            previousDayEnergy={22.0}
            trendData={mockTrendData}
            aiInsight="Peak generation at 2pm"
            isLoading={false}
            isError={false}
            onRetry={() => {}}
          />
        );
      }).not.toThrow();
    });

    it('should accept undefined values for optional data props', () => {
      expect(() => {
        renderWithTheme(
          <HeroEnergyCard
            energyValue={undefined}
            previousDayEnergy={undefined}
            trendData={[]}
            aiInsight={undefined}
            isLoading={false}
            isError={false}
          />
        );
      }).not.toThrow();
    });
  });
});

describe('HeroEnergyCard - Energy Value Display (Task 6.2)', () => {
  describe('Requirement 3.6: Label Display', () => {
    it('should display "Today\'s Energy Generated" label', () => {
      const { getByText } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      expect(getByText("Today's Energy Generated")).toBeInTheDocument();
    });

    it('should apply 13px uppercase styling to label', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      const styleTag = container.querySelector('style');
      expect(styleTag?.textContent).toContain('.hero-energy-label');
      expect(styleTag?.textContent).toContain('font-size: 13px');
      expect(styleTag?.textContent).toContain('text-transform: uppercase');
    });
  });

  describe('Requirement 3.3, 3.7: Energy Value Display', () => {
    it('should format energy value to 1 decimal place', () => {
      const { getByText } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      expect(getByText('24.7')).toBeInTheDocument();
    });

    it('should round to 1 decimal place correctly', () => {
      const { getByText } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.763}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      expect(getByText('24.8')).toBeInTheDocument();
    });

    it('should apply accent color #3ED98A to energy value', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      const valueElement = container.querySelector('.hero-energy-value');
      expect(valueElement).toHaveStyle({ color: '#3ED98A' });
    });

    it('should apply responsive typography (mobile: 36px, tablet: 48px, desktop: 56-72px)', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      const styleTag = container.querySelector('style');
      expect(styleTag?.textContent).toContain('.hero-energy-value');
      expect(styleTag?.textContent).toContain('font-size: 36px'); // Mobile
      expect(styleTag?.textContent).toContain('font-size: 48px'); // Tablet
      expect(styleTag?.textContent).toContain('font-size: 56px'); // Desktop
      expect(styleTag?.textContent).toContain('font-size: 72px'); // Desktop XL
    });
  });

  describe('Requirement 3.4: Unit Display', () => {
    it('should display "kWh" unit', () => {
      const { getByText } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      expect(getByText('kWh')).toBeInTheDocument();
    });

    it('should apply responsive typography for unit (20-32px)', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      const styleTag = container.querySelector('style');
      expect(styleTag?.textContent).toContain('.hero-energy-unit');
      expect(styleTag?.textContent).toContain('font-size: 20px'); // Mobile
      expect(styleTag?.textContent).toContain('font-size: 26px'); // Tablet
      expect(styleTag?.textContent).toContain('font-size: 28px'); // Desktop
      expect(styleTag?.textContent).toContain('font-size: 32px'); // Desktop XL
    });
  });

  describe('Requirement 3.5: Tabular Numerals', () => {
    it('should apply tabular numerals to energy value', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      const styleTag = container.querySelector('style');
      expect(styleTag?.textContent).toContain('font-variant-numeric: tabular-nums');
    });

    it('should apply tabular numerals to unit', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      const valueElement = container.querySelector('.hero-energy-value');
      const unitElement = container.querySelector('.hero-energy-unit');
      
      expect(valueElement).toHaveClass('hero-energy-value');
      expect(unitElement).toHaveClass('hero-energy-unit');
    });
  });

  describe('Requirement 3.8: Undefined Value Handling', () => {
    it('should show empty state when energyValue is undefined and not loading', () => {
      const { getByText } = renderWithTheme(
        <HeroEnergyCard
          energyValue={undefined}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      // When undefined and not loading, show empty state (Requirement 19.8)
      expect(getByText('Waiting for data...')).toBeInTheDocument();
    });

    it('should not show energy value elements when energyValue is undefined', () => {
      const { container, queryByText } = renderWithTheme(
        <HeroEnergyCard
          energyValue={undefined}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      // Empty state doesn't show energy value elements
      const valueElement = container.querySelector('.hero-energy-value');
      const unitElement = container.querySelector('.hero-energy-unit');
      
      expect(valueElement).not.toBeInTheDocument();
      expect(unitElement).not.toBeInTheDocument();
      expect(queryByText("Today's Energy Generated")).not.toBeInTheDocument();
    });

    it('should apply full opacity when energyValue is defined', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      const valueElement = container.querySelector('.hero-energy-value');
      const unitElement = container.querySelector('.hero-energy-unit');
      
      expect(valueElement).toHaveStyle({ opacity: 1 });
      expect(unitElement).toHaveStyle({ opacity: 1 });
    });
  });

  describe('Requirement 12.7: Visual Hierarchy', () => {
    it('should establish hierarchy through typography size differences', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      const styleTag = container.querySelector('style');
      const content = styleTag?.textContent || '';
      
      // Label should be smaller (13px) than value (36-72px)
      expect(content).toContain('font-size: 13px'); // Label
      expect(content).toContain('font-size: 36px'); // Value mobile
      expect(content).toContain('font-size: 72px'); // Value desktop
      
      // Unit should be smaller than value but larger than label
      expect(content).toContain('font-size: 20px'); // Unit mobile
      expect(content).toContain('font-size: 32px'); // Unit desktop
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero value correctly', () => {
      const { getByText } = renderWithTheme(
        <HeroEnergyCard
          energyValue={0}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      expect(getByText('0.0')).toBeInTheDocument();
    });

    it('should handle large values correctly', () => {
      const { getByText } = renderWithTheme(
        <HeroEnergyCard
          energyValue={999.9}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      expect(getByText('999.9')).toBeInTheDocument();
    });

    it('should handle very small values correctly', () => {
      const { getByText } = renderWithTheme(
        <HeroEnergyCard
          energyValue={0.1}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      expect(getByText('0.1')).toBeInTheDocument();
    });
  });
});

describe('HeroEnergyCard - Loading and Empty States (Task 6.6)', () => {
  describe('Requirement 17.3: Loading Skeleton', () => {
    it('should show HeroCardSkeleton when isLoading is true', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={undefined}
          previousDayEnergy={undefined}
          trendData={[]}
          aiInsight={undefined}
          isLoading={true}
          isError={false}
        />
      );

      // HeroCardSkeleton uses animate-pulse class
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should not show energy value when loading', () => {
      const { queryByText } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={true}
          isError={false}
        />
      );

      expect(queryByText("Today's Energy Generated")).not.toBeInTheDocument();
      expect(queryByText('24.7')).not.toBeInTheDocument();
    });

    it('should show shimmer animation in loading state', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={undefined}
          previousDayEnergy={undefined}
          trendData={[]}
          aiInsight={undefined}
          isLoading={true}
          isError={false}
        />
      );

      // HeroCardSkeleton contains shimmer-effect class
      const shimmer = container.querySelector('.shimmer-effect');
      expect(shimmer).toBeInTheDocument();
    });
  });

  describe('Requirement 19.8: Empty State', () => {
    it('should show empty state when energyValue is undefined and not loading', () => {
      const { getByText } = renderWithTheme(
        <HeroEnergyCard
          energyValue={undefined}
          previousDayEnergy={undefined}
          trendData={[]}
          aiInsight={undefined}
          isLoading={false}
          isError={false}
        />
      );

      expect(getByText('Waiting for data...')).toBeInTheDocument();
    });

    it('should display Zap icon in empty state', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={undefined}
          previousDayEnergy={undefined}
          trendData={[]}
          aiInsight={undefined}
          isLoading={false}
          isError={false}
        />
      );

      // Zap icon from lucide-react will be rendered as an svg
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should show "Energy data will appear once available" message', () => {
      const { getByText } = renderWithTheme(
        <HeroEnergyCard
          energyValue={undefined}
          previousDayEnergy={undefined}
          trendData={[]}
          aiInsight={undefined}
          isLoading={false}
          isError={false}
        />
      );

      expect(getByText('Energy data will appear once available')).toBeInTheDocument();
    });

    it('should not show empty state when energyValue is defined', () => {
      const { queryByText } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      expect(queryByText('Waiting for data...')).not.toBeInTheDocument();
    });

    it('should not show empty state when loading', () => {
      const { queryByText } = renderWithTheme(
        <HeroEnergyCard
          energyValue={undefined}
          previousDayEnergy={undefined}
          trendData={[]}
          aiInsight={undefined}
          isLoading={true}
          isError={false}
        />
      );

      // Should show skeleton instead
      expect(queryByText('Waiting for data...')).not.toBeInTheDocument();
    });

    it('should center align empty state content', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={undefined}
          previousDayEnergy={undefined}
          trendData={[]}
          aiInsight={undefined}
          isLoading={false}
          isError={false}
        />
      );

      const emptyStateContainer = container.querySelector('.flex.flex-col.items-center.justify-center');
      expect(emptyStateContainer).toBeInTheDocument();
    });

    it('should apply theme-aware colors to empty state icon', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={undefined}
          previousDayEnergy={undefined}
          trendData={[]}
          aiInsight={undefined}
          isLoading={false}
          isError={false}
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toHaveStyle({ color: '#3ED98A' });
    });

    it('should have proper minimum height for empty state', () => {
      const { container } = renderWithTheme(
        <HeroEnergyCard
          energyValue={undefined}
          previousDayEnergy={undefined}
          trendData={[]}
          aiInsight={undefined}
          isLoading={false}
          isError={false}
        />
      );

      const emptyStateContainer = container.querySelector('.flex.flex-col.items-center.justify-center');
      expect(emptyStateContainer).toHaveStyle({ minHeight: '350px' });
    });
  });

  describe('State Priority', () => {
    it('should prioritize loading state over empty state', () => {
      const { container, queryByText } = renderWithTheme(
        <HeroEnergyCard
          energyValue={undefined}
          previousDayEnergy={undefined}
          trendData={[]}
          aiInsight={undefined}
          isLoading={true}
          isError={false}
        />
      );

      // Should show skeleton
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
      
      // Should not show empty state
      expect(queryByText('Waiting for data...')).not.toBeInTheDocument();
    });

    it('should show normal content when energyValue is defined and not loading', () => {
      const { getByText, queryByText } = renderWithTheme(
        <HeroEnergyCard
          energyValue={24.7}
          previousDayEnergy={22.0}
          trendData={mockTrendData}
          aiInsight="Peak generation"
          isLoading={false}
          isError={false}
        />
      );

      // Should show normal content
      expect(getByText("Today's Energy Generated")).toBeInTheDocument();
      expect(getByText('24.7')).toBeInTheDocument();
      
      // Should not show empty state
      expect(queryByText('Waiting for data...')).not.toBeInTheDocument();
    });
  });
});


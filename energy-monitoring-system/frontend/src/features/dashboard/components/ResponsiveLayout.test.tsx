import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ElectricalMetricsGrid } from './ElectricalMetricsGrid';
import { MetricCard } from './MetricCard';
import { DashboardHeader } from './DashboardHeader';
import { Zap } from 'lucide-react';

/**
 * Responsive Layout Tests
 * 
 * Tests for responsive breakpoints and layouts as specified in Task 10.1:
 * - Desktop breakpoint (≥1024px): 4-column metrics grid
 * - Tablet breakpoint (640-1023px): 2-column metrics grid
 * - Mobile breakpoint (<640px): 1-column stacked layout
 * - Responsive typography scaling (36px → 32px → 28px for metric values)
 * - Touch targets (minimum 44x44px for all interactive elements)
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

describe('Responsive Layout Tests', () => {
  // Store original window dimensions
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    // Save original dimensions
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    // Restore original dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  describe('ElectricalMetricsGrid Responsive Breakpoints', () => {
    it('should apply responsive grid classes for mobile, tablet, and desktop', () => {
      const { container } = render(
        <ElectricalMetricsGrid
          voltage={230.2}
          current={12.45}
          power={2867}
          energy={3.42}
        />
      );

      const gridElement = container.firstChild as HTMLElement;
      
      // Check that responsive classes are present
      expect(gridElement.className).toContain('grid-cols-1'); // Mobile
      expect(gridElement.className).toContain('sm:grid-cols-2'); // Tablet (640px+)
      expect(gridElement.className).toContain('lg:grid-cols-4'); // Desktop (1024px+)
    });

    it('should render all four metric cards', () => {
      render(
        <ElectricalMetricsGrid
          voltage={230.2}
          current={12.45}
          power={2867}
          energy={3.42}
        />
      );

      // Verify all four metrics are rendered
      expect(screen.getByText('Voltage')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
      expect(screen.getByText('Power')).toBeInTheDocument();
      expect(screen.getByText('Energy Today')).toBeInTheDocument();
    });

    it('should have proper gap spacing between cards', () => {
      const { container } = render(
        <ElectricalMetricsGrid
          voltage={230.2}
          current={12.45}
          power={2867}
          energy={3.42}
        />
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement.className).toContain('gap-4'); // 16px gap
    });
  });

  describe('MetricCard Responsive Typography', () => {
    it('should apply responsive font sizes for metric values', () => {
      const { container } = render(
        <MetricCard
          label="Voltage"
          value={230.2}
          unit="V"
          precision={1}
          color="accent"
          icon={<Zap size={16} />}
        />
      );

      const valueElement = container.querySelector('span.tabular-nums');
      expect(valueElement?.className).toContain('text-[1.75rem]'); // Mobile: 28px
      expect(valueElement?.className).toContain('sm:text-[2rem]'); // Tablet: 32px
      expect(valueElement?.className).toContain('lg:text-[2.25rem]'); // Desktop: 36px
    });

    it('should apply responsive font sizes for unit labels', () => {
      const { container } = render(
        <MetricCard
          label="Current"
          value={12.45}
          unit="A"
          precision={2}
          color="amber"
        />
      );

      const unitElements = container.querySelectorAll('span');
      const unitElement = Array.from(unitElements).find(el => el.textContent === 'A');
      
      expect(unitElement?.className).toContain('text-[1rem]'); // Mobile: 16px
      expect(unitElement?.className).toContain('sm:text-[1.0625rem]'); // Tablet: 17px
      expect(unitElement?.className).toContain('lg:text-[1.125rem]'); // Desktop: 18px
    });

    it('should maintain tabular-nums font variant across all breakpoints', () => {
      const { container } = render(
        <MetricCard
          label="Power"
          value={2867}
          unit="W"
          precision={1}
          color="blue"
        />
      );

      const valueElement = container.querySelector('span.tabular-nums');
      expect(valueElement?.className).toContain('tabular-nums');
    });

    it('should preserve label size (13px) across all breakpoints', () => {
      const { container } = render(
        <MetricCard
          label="Energy Today"
          value={3.42}
          unit="kWh"
          precision={2}
          color="amber"
        />
      );

      const labelElement = container.querySelector('.text-\\[0\\.8125rem\\]');
      expect(labelElement).toBeInTheDocument();
      // Label should be 0.8125rem (13px) and not have responsive classes
      expect(labelElement?.className).not.toContain('sm:');
      expect(labelElement?.className).not.toContain('lg:');
    });
  });

  describe('Touch Target Requirements', () => {
    it('should have minimum 44x44px touch target for alerts button', () => {
      const { container } = render(
        <DashboardHeader
          title="EcoStep Central"
          subtitle="Real-time monitoring"
          systemStatus="connected"
          alertsCount={3}
          isPublicUser={false}
          onAlertsClick={() => {}}
        />
      );

      const button = container.querySelector('button');
      expect(button?.className).toContain('min-h-[44px]');
      expect(button?.className).toContain('min-w-[44px]');
    });

    it('should meet touch target requirements when button is disabled', () => {
      const { container } = render(
        <DashboardHeader
          title="EcoStep Central"
          subtitle="Real-time monitoring"
          systemStatus="connected"
          alertsCount={0}
          isPublicUser={true}
          onAlertsClick={() => {}}
        />
      );

      const button = container.querySelector('button');
      expect(button?.className).toContain('min-h-[44px]');
      expect(button?.className).toContain('min-w-[44px]');
      expect(button).toBeDisabled();
    });

    it('should have adequate padding for touch targets', () => {
      const { container } = render(
        <DashboardHeader
          title="EcoStep Central"
          subtitle="Real-time monitoring"
          systemStatus="connected"
          alertsCount={5}
          isPublicUser={false}
          onAlertsClick={() => {}}
        />
      );

      const button = container.querySelector('button');
      // Button should have px-4 py-2.5 for adequate touch area
      expect(button?.className).toContain('px-4');
      expect(button?.className).toContain('py-2.5');
    });
  });

  describe('DashboardHeader Responsive Behavior', () => {
    it('should apply responsive flex direction classes', () => {
      const { container } = render(
        <DashboardHeader
          title="EcoStep Central"
          subtitle="Real-time energy, activity, system monitoring"
          systemStatus="connected"
          alertsCount={0}
          isPublicUser={false}
          onAlertsClick={() => {}}
        />
      );

      const header = container.querySelector('header');
      expect(header?.className).toContain('flex-col'); // Mobile: stacked
      expect(header?.className).toContain('sm:flex-row'); // Tablet+: horizontal
    });

    it('should apply gap spacing for responsive layout', () => {
      const { container } = render(
        <DashboardHeader
          title="EcoStep Central"
          subtitle="Real-time monitoring"
          systemStatus="disconnected"
          alertsCount={2}
          isPublicUser={false}
          onAlertsClick={() => {}}
        />
      );

      const header = container.querySelector('header');
      expect(header?.className).toContain('gap-4');
    });

    it('should render system status indicator at all breakpoints', () => {
      render(
        <DashboardHeader
          title="EcoStep Central"
          subtitle="Real-time monitoring"
          systemStatus="connected"
          alertsCount={0}
          isPublicUser={false}
          onAlertsClick={() => {}}
        />
      );

      const statusDot = screen.getByRole('status');
      expect(statusDot).toBeInTheDocument();
      expect(statusDot).toHaveAttribute('aria-label', 'System status: connected');
    });
  });

  describe('Layout Transformations', () => {
    it('should maintain visual hierarchy across all breakpoints', () => {
      const { container } = render(
        <ElectricalMetricsGrid
          voltage={230.2}
          current={12.45}
          power={2867}
          energy={3.42}
        />
      );

      const metricCards = container.querySelectorAll('.eco-card');
      
      // All cards should maintain consistent styling
      metricCards.forEach(card => {
        expect(card.className).toContain('eco-card');
        expect(card.className).toContain('transition-opacity');
      });
    });

    it('should render metric cards in correct order', () => {
      render(
        <ElectricalMetricsGrid
          voltage={230.2}
          current={12.45}
          power={2867}
          energy={3.42}
        />
      );

      const labels = screen.getAllByText(/Voltage|Current|Power|Energy Today/);
      expect(labels[0].textContent).toBe('Voltage');
      expect(labels[1].textContent).toBe('Current');
      expect(labels[2].textContent).toBe('Power');
      expect(labels[3].textContent).toBe('Energy Today');
    });
  });

  describe('Grid Gap Consistency', () => {
    it('should use consistent gap spacing across grid', () => {
      const { container } = render(
        <ElectricalMetricsGrid
          voltage={230}
          current={10}
          power={2300}
          energy={5.5}
        />
      );

      const gridElement = container.firstChild as HTMLElement;
      // Grid should use gap-4 (1rem / 16px) as specified in design
      expect(gridElement.className).toContain('gap-4');
    });
  });

  describe('Responsive Accessibility', () => {
    it('should maintain aria-label for grid region', () => {
      const { container } = render(
        <ElectricalMetricsGrid
          voltage={230}
          current={10}
          power={2300}
          energy={5.5}
        />
      );

      const region = container.querySelector('[role="region"]');
      expect(region).toHaveAttribute('aria-label', 'Electrical metrics');
    });

    it('should maintain semantic heading structure', () => {
      render(
        <DashboardHeader
          title="EcoStep Central"
          subtitle="Real-time monitoring"
          systemStatus="connected"
          alertsCount={0}
          isPublicUser={false}
          onAlertsClick={() => {}}
        />
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('EcoStep Central');
    });
  });
});

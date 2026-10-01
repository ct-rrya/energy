import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from './MetricCard';
import { Zap } from 'lucide-react';

/**
 * MetricCard Unit Tests
 * 
 * Tests verify:
 * - Numeric value rendering with correct precision (Task 3.2 - Req 1.2, 1.3, 1.4, 1.5)
 * - Tabular-nums font variant application (Task 3.2 - Req 3.6)
 * - Empty state handling when value is undefined (Task 3.2 - Req 1.2, 1.3, 1.4, 1.5)
 * - Color prop application for accent colors (Task 3.2 - Req 3.6)
 * - Responsive typography scaling (Task 3.2 - Req 3.6)
 */

describe('MetricCard', () => {
  describe('Basic Rendering', () => {
    it('renders label, value, and unit correctly', () => {
      render(
        <MetricCard
          label="Voltage"
          value={230.2}
          unit="V"
          precision={1}
          color="accent"
        />
      );

      expect(screen.getByText('Voltage')).toBeInTheDocument();
      expect(screen.getByText('230.2')).toBeInTheDocument();
      expect(screen.getByText('V')).toBeInTheDocument();
    });

    it('renders with icon', () => {
      render(
        <MetricCard
          label="Power"
          value={2867}
          unit="W"
          precision={1}
          color="blue"
          icon={<Zap size={16} data-testid="icon" />}
        />
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('Numeric Value Rendering with Correct Precision', () => {
    it('formats value with precision 1', () => {
      render(
        <MetricCard
          label="Voltage"
          value={230.234}
          unit="V"
          precision={1}
          color="accent"
        />
      );

      expect(screen.getByText('230.2')).toBeInTheDocument();
    });

    it('formats value with precision 2', () => {
      render(
        <MetricCard
          label="Current"
          value={12.456789}
          unit="A"
          precision={2}
          color="amber"
        />
      );

      expect(screen.getByText('12.46')).toBeInTheDocument();
    });

    it('formats value with precision 0', () => {
      render(
        <MetricCard
          label="Power"
          value={2867.8}
          unit="W"
          precision={0}
          color="blue"
        />
      );

      expect(screen.getByText('2868')).toBeInTheDocument();
    });

    it('handles very small values with precision', () => {
      render(
        <MetricCard
          label="Energy"
          value={0.0234}
          unit="kWh"
          precision={2}
          color="amber"
        />
      );

      expect(screen.getByText('0.02')).toBeInTheDocument();
    });

    it('handles zero value with correct precision', () => {
      render(
        <MetricCard
          label="Current"
          value={0}
          unit="A"
          precision={2}
          color="amber"
        />
      );

      expect(screen.getByText('0.00')).toBeInTheDocument();
    });

    it('rounds up correctly for values at rounding boundary', () => {
      render(
        <MetricCard
          label="Current"
          value={12.455}
          unit="A"
          precision={2}
          color="amber"
        />
      );

      expect(screen.getByText('12.46')).toBeInTheDocument();
    });
  });

  describe('Tabular-Nums Font Variant Application', () => {
    it('applies tabular-nums class to value element', () => {
      const { container } = render(
        <MetricCard
          label="Voltage"
          value={230.2}
          unit="V"
          precision={1}
          color="accent"
        />
      );

      const valueElement = screen.getByText('230.2');
      expect(valueElement).toHaveClass('tabular-nums');
    });

    it('applies tabular-nums for all numeric values', () => {
      const { rerender } = render(
        <MetricCard
          label="Test"
          value={100}
          unit="X"
          precision={0}
          color="accent"
        />
      );

      let valueElement = screen.getByText('100');
      expect(valueElement).toHaveClass('tabular-nums');

      rerender(
        <MetricCard
          label="Test"
          value={0.01}
          unit="X"
          precision={2}
          color="accent"
        />
      );

      valueElement = screen.getByText('0.01');
      expect(valueElement).toHaveClass('tabular-nums');
    });
  });

  describe('Empty State When Value is Undefined', () => {
    it('shows 0.0 when value is undefined and precision is 1', () => {
      render(
        <MetricCard
          label="Voltage"
          value={undefined}
          unit="V"
          precision={1}
          color="accent"
        />
      );

      expect(screen.getByText('0.0')).toBeInTheDocument();
    });

    it('shows 0.00 when value is undefined and precision is 2', () => {
      render(
        <MetricCard
          label="Energy"
          value={undefined}
          unit="kWh"
          precision={2}
          color="amber"
        />
      );

      expect(screen.getByText('0.00')).toBeInTheDocument();
    });

    it('shows 0 when value is undefined and precision is 0', () => {
      render(
        <MetricCard
          label="Power"
          value={undefined}
          unit="W"
          precision={0}
          color="blue"
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('applies reduced opacity for empty state', () => {
      const { container } = render(
        <MetricCard
          label="Empty"
          value={undefined}
          unit="U"
          precision={1}
          color="accent"
        />
      );

      const valueContainer = container.querySelector('.opacity-50');
      expect(valueContainer).toBeInTheDocument();
    });

    it('shows unit even in empty state', () => {
      render(
        <MetricCard
          label="Current"
          value={undefined}
          unit="A"
          precision={2}
          color="amber"
        />
      );

      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  describe('Color Prop Application for Accent Colors', () => {
    it('applies accent green color class', () => {
      render(
        <MetricCard
          label="Voltage"
          value={100}
          unit="V"
          precision={0}
          color="accent"
        />
      );

      const valueElement = screen.getByText('100');
      expect(valueElement).toHaveClass('text-[#3DDC97]');
      expect(valueElement).toHaveClass('dark:text-[#3ED98A]');
    });

    it('applies amber color class', () => {
      render(
        <MetricCard
          label="Current"
          value={100}
          unit="A"
          precision={0}
          color="amber"
        />
      );

      const valueElement = screen.getByText('100');
      expect(valueElement).toHaveClass('text-[#F59E0B]');
    });

    it('applies blue color class', () => {
      render(
        <MetricCard
          label="Power"
          value={100}
          unit="W"
          precision={0}
          color="blue"
        />
      );

      const valueElement = screen.getByText('100');
      expect(valueElement).toHaveClass('text-[#3B82F6]');
    });

    it('applies red color class', () => {
      render(
        <MetricCard
          label="Error"
          value={100}
          unit="X"
          precision={0}
          color="red"
        />
      );

      const valueElement = screen.getByText('100');
      expect(valueElement).toHaveClass('text-[#EF4444]');
    });

    it('maintains color in empty state', () => {
      render(
        <MetricCard
          label="Test"
          value={undefined}
          unit="X"
          precision={1}
          color="blue"
        />
      );

      const valueElement = screen.getByText('0.0');
      expect(valueElement).toHaveClass('text-[#3B82F6]');
    });
  });

  describe('Responsive Typography Scaling', () => {
    it('applies base font size (2.25rem = 36px) to value', () => {
      render(
        <MetricCard
          label="Voltage"
          value={230.2}
          unit="V"
          precision={1}
          color="accent"
        />
      );

      const valueElement = screen.getByText('230.2');
      expect(valueElement).toHaveClass('text-[2.25rem]');
    });

    it('applies correct label font size (0.8125rem = 13px)', () => {
      const { container } = render(
        <MetricCard
          label="Voltage"
          value={230.2}
          unit="V"
          precision={1}
          color="accent"
        />
      );

      const labelElement = screen.getByText('Voltage');
      expect(labelElement.parentElement).toHaveClass('text-[0.8125rem]');
    });

    it('applies correct unit font size (1.125rem = 18px)', () => {
      render(
        <MetricCard
          label="Voltage"
          value={230.2}
          unit="V"
          precision={1}
          color="accent"
        />
      );

      const unitElement = screen.getByText('V');
      expect(unitElement).toHaveClass('text-[1.125rem]');
    });

    it('applies font-semibold (600) to value', () => {
      render(
        <MetricCard
          label="Voltage"
          value={230.2}
          unit="V"
          precision={1}
          color="accent"
        />
      );

      const valueElement = screen.getByText('230.2');
      expect(valueElement).toHaveClass('font-semibold');
    });

    it('applies uppercase and letter-spacing to label', () => {
      const { container } = render(
        <MetricCard
          label="Voltage"
          value={230.2}
          unit="V"
          precision={1}
          color="accent"
        />
      );

      const labelContainer = screen.getByText('Voltage').parentElement;
      expect(labelContainer).toHaveClass('uppercase');
      expect(labelContainer).toHaveClass('tracking-wider');
    });
  });

  describe('Card Styling', () => {
    it('applies eco-card base class', () => {
      const { container } = render(
        <MetricCard
          label="Voltage"
          value={230.2}
          unit="V"
          precision={1}
          color="accent"
        />
      );

      const card = container.querySelector('.eco-card');
      expect(card).toBeInTheDocument();
    });

    it('applies hover opacity transition', () => {
      const { container } = render(
        <MetricCard
          label="Voltage"
          value={230.2}
          unit="V"
          precision={1}
          color="accent"
        />
      );

      const card = container.querySelector('.hover\\:opacity-95');
      expect(card).toBeInTheDocument();
    });

    it('applies transition duration', () => {
      const { container } = render(
        <MetricCard
          label="Voltage"
          value={230.2}
          unit="V"
          precision={1}
          color="accent"
        />
      );

      const card = container.querySelector('.duration-200');
      expect(card).toBeInTheDocument();
    });
  });
});

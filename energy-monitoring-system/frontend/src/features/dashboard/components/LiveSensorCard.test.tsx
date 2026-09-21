import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveSensorCard } from './LiveSensorCard';
import type { SensorReading } from '../types/dashboard.types';

// Mock the utils module with partial mock
vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...actual,
    formatDateTime: (date: string) => new Date(date).toLocaleString(),
  };
});

describe('LiveSensorCard', () => {
  const mockSensorReading: SensorReading = {
    sensorId: '12345678-1234-1234-1234-123456789012',
    voltage: 220.5,
    current: 5.2,
    power: 1146.6,
    energy: 100.5,
    timestamp: '2024-01-15T10:30:00Z',
  };

  describe('Subtask 9.1: Data hierarchy and tabular numerals', () => {
    it('should display sensor values with large font size (36px equivalent)', () => {
      render(<LiveSensorCard lastReading={mockSensorReading} />);

      const voltageValue = screen.getByText(/220\.50/);
      const currentValue = screen.getByText(/5\.20/);
      const powerValue = screen.getByText(/1146\.60/);

      // Check that values have the correct classes for 36px font
      expect(voltageValue).toHaveClass('text-4xl');
      expect(currentValue).toHaveClass('text-4xl');
      expect(powerValue).toHaveClass('text-4xl');
    });

    it('should display sensor values with font-weight 600 (semibold)', () => {
      render(<LiveSensorCard lastReading={mockSensorReading} />);

      const voltageValue = screen.getByText(/220\.50/);
      const currentValue = screen.getByText(/5\.20/);
      const powerValue = screen.getByText(/1146\.60/);

      expect(voltageValue).toHaveClass('font-semibold');
      expect(currentValue).toHaveClass('font-semibold');
      expect(powerValue).toHaveClass('font-semibold');
    });

    it('should apply tabular-nums to sensor values (Requirement 5.3, 11.4)', () => {
      render(<LiveSensorCard lastReading={mockSensorReading} />);

      const voltageValue = screen.getByText(/220\.50/);
      const currentValue = screen.getByText(/5\.20/);
      const powerValue = screen.getByText(/1146\.60/);

      // Check inline style for font-variant-numeric
      expect(voltageValue).toHaveStyle({ fontVariantNumeric: 'tabular-nums' });
      expect(currentValue).toHaveStyle({ fontVariantNumeric: 'tabular-nums' });
      expect(powerValue).toHaveStyle({ fontVariantNumeric: 'tabular-nums' });
    });

    it('should display labels as 13px uppercase with tracking (Requirement 5.7)', () => {
      render(<LiveSensorCard lastReading={mockSensorReading} />);

      const voltageLabel = screen.getByText('Voltage');
      const currentLabel = screen.getByText('Current');
      const powerLabel = screen.getByText('Power');

      // Check font size (13px = text-[13px])
      expect(voltageLabel).toHaveClass('text-[13px]');
      expect(currentLabel).toHaveClass('text-[13px]');
      expect(powerLabel).toHaveClass('text-[13px]');

      // Check uppercase class (CSS transforms text to uppercase)
      expect(voltageLabel).toHaveClass('uppercase');
      expect(currentLabel).toHaveClass('uppercase');
      expect(powerLabel).toHaveClass('uppercase');

      // Check letter-spacing
      expect(voltageLabel).toHaveClass('tracking-wide');
      expect(currentLabel).toHaveClass('tracking-wide');
      expect(powerLabel).toHaveClass('tracking-wide');
    });

    it('should NOT use gradient backgrounds (Requirement 5.1)', () => {
      const { container } = render(<LiveSensorCard lastReading={mockSensorReading} />);

      // Check that there are no elements with gradient classes
      const gradientElements = container.querySelectorAll('[class*="bg-gradient"]');
      expect(gradientElements).toHaveLength(0);

      // Check that there are no pastel icon tiles
      const iconTiles = container.querySelectorAll('.bg-blue-50, .bg-accent-50, .bg-secondary-50');
      expect(iconTiles).toHaveLength(0);
    });

    it('should position icons at 16px beside labels (Requirement 5.4, 5.5)', () => {
      render(<LiveSensorCard lastReading={mockSensorReading} />);

      // Icons should have h-4 w-4 class (16px)
      const icons = document.querySelectorAll('svg');
      const metricIcons = Array.from(icons).filter(
        (icon) => icon.classList.contains('h-4') && icon.classList.contains('w-4')
      );

      // We should have 3 metric icons (Voltage, Current, Power)
      expect(metricIcons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Subtask 9.2: Semantic status badges', () => {
    it('should display healthy status badge with semantic green color (Requirement 8.1)', () => {
      render(<LiveSensorCard lastReading={mockSensorReading} />);

      const statusBadge = screen.getByText('Healthy');
      expect(statusBadge).toBeInTheDocument();

      // Check for green semantic color
      expect(statusBadge).toHaveStyle({
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        color: '#15803d',
      });
    });

    it('should display warning status badge with semantic amber color (Requirement 8.2)', () => {
      const highCurrentReading: SensorReading = {
        ...mockSensorReading,
        current: 16.0, // Exceeds 15A threshold
        power: 3520.0, // High power
      };

      render(<LiveSensorCard lastReading={highCurrentReading} />);

      const statusBadge = screen.getByText('Warning');
      expect(statusBadge).toBeInTheDocument();

      // Check for amber semantic color
      expect(statusBadge).toHaveStyle({
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        color: '#b45309',
      });
    });

    it('should display error status badge with semantic red color (Requirement 8.3)', () => {
      const lowVoltageReading: SensorReading = {
        ...mockSensorReading,
        voltage: 50.0, // Below 100V threshold
      };

      render(<LiveSensorCard lastReading={lowVoltageReading} />);

      const statusBadge = screen.getByText('Error');
      expect(statusBadge).toBeInTheDocument();

      // Check for red semantic color
      expect(statusBadge).toHaveStyle({
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#b91c1c',
      });
    });

    it('should add hairline borders to status badges (Requirement 8.4)', () => {
      render(<LiveSensorCard lastReading={mockSensorReading} />);

      const statusBadge = screen.getByText('Healthy');

      // Check for border with 0.2 opacity
      expect(statusBadge).toHaveStyle({
        borderColor: 'rgba(34, 197, 94, 0.2)',
      });

      // Check for border class
      expect(statusBadge).toHaveClass('border');
    });

    it('should position status inline with moderate border-radius (Requirement 8.5, 15.4)', () => {
      render(<LiveSensorCard lastReading={mockSensorReading} />);

      const statusBadge = screen.getByText('Healthy');

      // Check for rounded-md class (6px border-radius, not rounded-full)
      expect(statusBadge).toHaveClass('rounded-md');

      // Should not use rounded-full
      expect(statusBadge).not.toHaveClass('rounded-full');
    });

    it('should use rgba background with 0.1 opacity (Requirement 8.6)', () => {
      render(<LiveSensorCard lastReading={mockSensorReading} />);

      const statusBadge = screen.getByText('Healthy');

      // Check background color has 0.1 opacity
      expect(statusBadge).toHaveStyle({
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
      });
    });
  });

  describe('Loading and error states', () => {
    it('should display loading state', () => {
      render(<LiveSensorCard isLoading={true} />);

      // Should show loading spinner (from DashboardCard)
      expect(screen.queryByText('VOLTAGE')).not.toBeInTheDocument();
    });

    it('should display error state', () => {
      render(<LiveSensorCard error="Failed to load sensor data" />);

      expect(screen.getByText('Error loading data')).toBeInTheDocument();
      expect(screen.getByText('Failed to load sensor data')).toBeInTheDocument();
    });

    it('should display empty state when no data', () => {
      render(<LiveSensorCard />);

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Timestamp and sensor ID display', () => {
    it('should display formatted timestamp', () => {
      render(<LiveSensorCard lastReading={mockSensorReading} />);

      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    it('should display truncated sensor ID', () => {
      render(<LiveSensorCard lastReading={mockSensorReading} />);

      // Should show first 8 characters + ellipsis
      expect(screen.getByText(/Sensor ID: 12345678\.\.\./)).toBeInTheDocument();
    });

    it('should separate timestamp section with hairline border', () => {
      const { container } = render(<LiveSensorCard lastReading={mockSensorReading} />);

      // Find the timestamp container
      const timestampContainer = container.querySelector('.border-t');
      expect(timestampContainer).toBeInTheDocument();

      // Check for hairline border color
      expect(timestampContainer).toHaveStyle({
        borderColor: 'rgba(26, 49, 44, 0.08)',
      });
    });
  });
});

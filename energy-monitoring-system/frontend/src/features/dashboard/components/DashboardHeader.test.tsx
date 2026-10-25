import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardHeader } from './DashboardHeader';

describe('DashboardHeader', () => {
  const defaultProps = {
    title: 'EcoStep Central',
    subtitle: 'Real-time energy, activity, system monitoring',
    systemStatus: 'connected' as const,
    isPublicUser: true,
    isWebSocketConnected: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering & Layout', () => {
    it('renders title and subtitle with proper semantic hierarchy', () => {
      render(<DashboardHeader {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 1, name: 'EcoStep Central' });
      expect(heading).toBeInTheDocument();
      expect(screen.getByText('Real-time energy, activity, system monitoring')).toBeInTheDocument();
    });

    it('renders as a semantic header element', () => {
      const { container } = render(<DashboardHeader {...defaultProps} />);
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('renders formatted date and time', () => {
      render(<DashboardHeader {...defaultProps} />);
      // Should render month and year
      const year = new Date().getFullYear().toString();
      expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
    });

    it('does NOT render the large 80px warning card', () => {
      const { container } = render(<DashboardHeader {...defaultProps} systemStatus="unknown" />);
      // Old warning card used min-w-[200px] or h-[80px]
      expect(container.querySelector('.h-\\[80px\\]')).not.toBeInTheDocument();
      expect(container.querySelector('.min-w-\\[200px\\]')).not.toBeInTheDocument();
      // Should not show the intimidating "SYSTEM STATUS" uppercase header block
      expect(screen.queryByText('SYSTEM STATUS')).not.toBeInTheDocument();
    });
  });

  describe('System Status States & Subtle Indicators', () => {
    it('renders Online status with green dot and pulsing animation when connected', () => {
      const { container } = render(<DashboardHeader {...defaultProps} systemStatus="connected" />);

      expect(screen.getByText('Online')).toBeInTheDocument();
      const statusDot = screen.getByRole('status', { name: /system status: connected/i });
      expect(statusDot).toHaveClass('bg-[#3ED98A]');

      const pulseElement = container.querySelector('.animate-ping');
      expect(pulseElement).toBeInTheDocument();
      expect(pulseElement).toHaveClass('bg-[#3ED98A]');
    });

    it('renders Standby status with amber dot when status is unknown / idle', () => {
      const { container } = render(<DashboardHeader {...defaultProps} systemStatus="unknown" />);

      // Subtle Standby replaces the intimidating Warning box
      expect(screen.getByText('Standby')).toBeInTheDocument();
      const statusDot = screen.getByRole('status', { name: /system status: unknown/i });
      expect(statusDot).toHaveClass('bg-[#F59E0B]');

      // No pulse animation on standby
      const pulseElement = container.querySelector('.animate-ping');
      expect(pulseElement).not.toBeInTheDocument();
    });

    it('renders Offline status with red dot when disconnected', () => {
      const { container } = render(<DashboardHeader {...defaultProps} systemStatus="disconnected" />);

      expect(screen.getByText('Offline')).toBeInTheDocument();
      const statusDot = screen.getByRole('status', { name: /system status: disconnected/i });
      expect(statusDot).toHaveClass('bg-[#EF4444]');

      const pulseElement = container.querySelector('.animate-ping');
      expect(pulseElement).not.toBeInTheDocument();
    });

    it('prioritizes WebSocket disconnection and displays Offline status', () => {
      render(
        <DashboardHeader
          {...defaultProps}
          systemStatus="connected"
          isWebSocketConnected={false}
        />
      );

      expect(screen.getByText('Offline')).toBeInTheDocument();
      const statusDot = screen.getByRole('status', { name: /system status: disconnected/i });
      expect(statusDot).toHaveClass('bg-[#EF4444]');
    });
  });

  describe('Information / Help Icon & Tooltip Explanations', () => {
    it('renders a help button with accessible aria-label next to status', () => {
      render(<DashboardHeader {...defaultProps} systemStatus="connected" />);

      const helpButton = screen.getByRole('button', {
        name: /view operating status details for online/i,
      });
      expect(helpButton).toBeInTheDocument();
      expect(helpButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens tooltip on click/tap and displays plain-language explanation for Online', async () => {
      const user = userEvent.setup();
      render(<DashboardHeader {...defaultProps} systemStatus="connected" />);

      const helpButton = screen.getByRole('button', {
        name: /view operating status details for online/i,
      });
      await user.click(helpButton);

      expect(helpButton).toHaveAttribute('aria-expanded', 'true');
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(screen.getByText('System Status: Online')).toBeInTheDocument();
      expect(screen.getByText(/operating normally/i)).toBeInTheDocument();
      expect(screen.getByText(/Zero footsteps is normal/i)).toBeInTheDocument();
    });

    it('explains in simple language that zero footsteps is normal in Standby mode', async () => {
      const user = userEvent.setup();
      render(<DashboardHeader {...defaultProps} systemStatus="unknown" />);

      const helpButton = screen.getByRole('button', {
        name: /view operating status details for standby/i,
      });
      await user.click(helpButton);

      expect(screen.getByText('System Status: Standby')).toBeInTheDocument();
      expect(
        screen.getByText(/Zero recorded footsteps is normal when the tile is at rest and does not indicate a system fault/i)
      ).toBeInTheDocument();
    });

    it('explains the actual reason for disconnection in tooltip', async () => {
      const user = userEvent.setup();
      render(
        <DashboardHeader
          {...defaultProps}
          systemStatus="connected"
          isWebSocketConnected={false}
        />
      );

      const helpButton = screen.getByRole('button', {
        name: /view operating status details for offline/i,
      });
      await user.click(helpButton);

      expect(screen.getByText('System Status: Offline')).toBeInTheDocument();
      expect(
        screen.getByText(/real-time connection to the EcoStep IoT stream is currently disconnected/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/WebSocket telemetry link is disconnected/i)).toBeInTheDocument();
    });

    it('shows tooltip on hover for desktop users', () => {
      vi.useFakeTimers();
      const { container } = render(<DashboardHeader {...defaultProps} systemStatus="connected" />);

      const tooltipWrapper = container.querySelector('.relative.inline-flex.items-center');
      expect(tooltipWrapper).toBeInTheDocument();

      fireEvent.mouseEnter(tooltipWrapper!);
      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.mouseLeave(tooltipWrapper!);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      vi.useRealTimers();
    });

    it('dismisses tooltip when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(<DashboardHeader {...defaultProps} systemStatus="connected" />);

      const helpButton = screen.getByRole('button', {
        name: /view operating status details for online/i,
      });
      await user.click(helpButton);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('dismisses tooltip when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <DashboardHeader {...defaultProps} systemStatus="connected" />
          <div data-testid="outside-area">Outside</div>
        </div>
      );

      const helpButton = screen.getByRole('button', {
        name: /view operating status details for online/i,
      });
      await user.click(helpButton);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      await user.click(screen.getByTestId('outside-area'));
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Layout & Resiliency', () => {
    it('applies responsive flex classes', () => {
      const { container } = render(<DashboardHeader {...defaultProps} />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('flex', 'flex-col', 'sm:flex-row');
    });

    it('handles rapid prop updates gracefully', () => {
      const { rerender } = render(<DashboardHeader {...defaultProps} systemStatus="connected" />);
      expect(screen.getByText('Online')).toBeInTheDocument();

      rerender(<DashboardHeader {...defaultProps} systemStatus="unknown" />);
      expect(screen.getByText('Standby')).toBeInTheDocument();

      rerender(<DashboardHeader {...defaultProps} systemStatus="disconnected" />);
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });
});

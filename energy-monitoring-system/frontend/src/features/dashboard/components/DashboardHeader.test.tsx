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
      const { container } = render(<DashboardHeader {...defaultProps} systemStatus="waiting" />);
      expect(container.querySelector('.h-\\[80px\\]')).not.toBeInTheDocument();
      expect(container.querySelector('.min-w-\\[200px\\]')).not.toBeInTheDocument();
      expect(screen.queryByText('SYSTEM STATUS')).not.toBeInTheDocument();
    });
  });

  describe('Standardized Hardware Status States & Indicators', () => {
    it('renders Connected status with green dot and pulsing animation when hardware is connected', () => {
      const { container } = render(<DashboardHeader {...defaultProps} systemStatus="connected" />);

      expect(screen.getByText('Connected')).toBeInTheDocument();
      const statusDot = screen.getByRole('status', { name: /system status: connected/i });
      expect(statusDot).toHaveClass('bg-[#3ED98A]');

      const pulseElement = container.querySelector('.animate-ping');
      expect(pulseElement).toBeInTheDocument();
      expect(pulseElement).toHaveClass('bg-[#3ED98A]');
    });

    it('renders Waiting status with amber dot when hardware is waiting for connection', () => {
      const { container } = render(<DashboardHeader {...defaultProps} systemStatus="waiting" />);

      expect(screen.getByText('Waiting for hardware connection')).toBeInTheDocument();
      const statusDot = screen.getByRole('status', { name: /system status: waiting/i });
      expect(statusDot).toHaveClass('bg-[#F59E0B]');

      // No pulse animation on waiting
      const pulseElement = container.querySelector('.animate-ping');
      expect(pulseElement).not.toBeInTheDocument();
    });

    it('renders Waiting status for unknown initial state', () => {
      render(<DashboardHeader {...defaultProps} systemStatus="unknown" />);
      expect(screen.getByText('Waiting for hardware connection')).toBeInTheDocument();
    });

    it('renders Connection Lost status with red dot when disconnected', () => {
      const { container } = render(<DashboardHeader {...defaultProps} systemStatus="disconnected" />);

      expect(screen.getByText('Connection Lost')).toBeInTheDocument();
      const statusDot = screen.getByRole('status', { name: /system status: disconnected/i });
      expect(statusDot).toHaveClass('bg-[#EF4444]');

      const pulseElement = container.querySelector('.animate-ping');
      expect(pulseElement).not.toBeInTheDocument();
    });

    it('prioritizes WebSocket disconnection and displays Connection Lost status', () => {
      render(
        <DashboardHeader
          {...defaultProps}
          systemStatus="connected"
          isWebSocketConnected={false}
        />
      );

      expect(screen.getByText('Connection Lost')).toBeInTheDocument();
      const statusDot = screen.getByRole('status', { name: /system status: disconnected/i });
      expect(statusDot).toHaveClass('bg-[#EF4444]');
    });
  });

  describe('Information / Help Icon & Tooltip Explanations', () => {
    it('renders a help button with accessible aria-label next to status', () => {
      render(<DashboardHeader {...defaultProps} systemStatus="connected" />);

      const helpButton = screen.getByRole('button', {
        name: /view operating status details for connected/i,
      });
      expect(helpButton).toBeInTheDocument();
      expect(helpButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens tooltip on click/tap and displays plain-language explanation for Connected', async () => {
      const user = userEvent.setup();
      render(<DashboardHeader {...defaultProps} systemStatus="connected" />);

      const helpButton = screen.getByRole('button', {
        name: /view operating status details for connected/i,
      });
      await user.click(helpButton);

      expect(helpButton).toHaveAttribute('aria-expanded', 'true');
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(screen.getByText('Hardware Status: Connected')).toBeInTheDocument();
      expect(screen.getByText(/The hardware has successfully established a connection/i)).toBeInTheDocument();
    });

    it('explains in simple language that no hardware is connected in Waiting state', async () => {
      const user = userEvent.setup();
      render(<DashboardHeader {...defaultProps} systemStatus="waiting" />);

      const helpButton = screen.getByRole('button', {
        name: /view operating status details for waiting for hardware connection/i,
      });
      await user.click(helpButton);

      expect(screen.getByText('Hardware Status: Waiting')).toBeInTheDocument();
      expect(
        screen.getByText(/No hardware is currently connected. The system has not established an active connection with the hardware./i)
      ).toBeInTheDocument();
    });

    it('explains the reason for Connection Lost in tooltip', async () => {
      const user = userEvent.setup();
      render(
        <DashboardHeader
          {...defaultProps}
          systemStatus="connected"
          isWebSocketConnected={false}
        />
      );

      const helpButton = screen.getByRole('button', {
        name: /view operating status details for connection lost/i,
      });
      await user.click(helpButton);

      expect(screen.getByText('Hardware Status: Connection Lost')).toBeInTheDocument();
      expect(
        screen.getByText(/Hardware was previously connected, but the active connection was lost./i)
      ).toBeInTheDocument();
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
        name: /view operating status details for connected/i,
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
        name: /view operating status details for connected/i,
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
      expect(screen.getByText('Connected')).toBeInTheDocument();

      rerender(<DashboardHeader {...defaultProps} systemStatus="waiting" />);
      expect(screen.getByText('Waiting for hardware connection')).toBeInTheDocument();

      rerender(<DashboardHeader {...defaultProps} systemStatus="disconnected" />);
      expect(screen.getByText('Connection Lost')).toBeInTheDocument();
    });
  });
});

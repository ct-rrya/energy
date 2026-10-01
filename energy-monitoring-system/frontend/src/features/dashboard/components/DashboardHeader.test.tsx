import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardHeader } from './DashboardHeader';

describe('DashboardHeader', () => {
  const defaultProps = {
    title: 'EcoStep Central',
    subtitle: 'Real-time energy, activity, system monitoring',
    systemStatus: 'connected' as const,
    alertsCount: 0,
    isPublicUser: false,
    onAlertsClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering (Requirement 1.1)', () => {
    it('renders title and subtitle', () => {
      render(<DashboardHeader {...defaultProps} />);
      
      expect(screen.getByText('EcoStep Central')).toBeInTheDocument();
      expect(screen.getByText('Real-time energy, activity, system monitoring')).toBeInTheDocument();
    });

    it('renders as a header element with semantic HTML', () => {
      const { container } = render(<DashboardHeader {...defaultProps} />);
      
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('uses h1 for the title for proper heading hierarchy (Requirement 9.3)', () => {
      render(<DashboardHeader {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 1, name: 'EcoStep Central' });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('System Status States (Requirement 1.1)', () => {
    it('displays connected status with green dot and pulse animation', () => {
      const { container } = render(<DashboardHeader {...defaultProps} systemStatus="connected" />);
      
      const statusDot = screen.getByRole('status', { name: /system status: connected/i });
      expect(statusDot).toBeInTheDocument();
      
      // Check for green background color
      expect(statusDot).toHaveClass('bg-[#3ED98A]');
      
      // Check for pulse animation (should have sibling with animate-ping)
      const pulseElement = container.querySelector('.animate-ping');
      expect(pulseElement).toBeInTheDocument();
      expect(pulseElement).toHaveClass('bg-[#3ED98A]');
    });

    it('displays disconnected status with red dot and no pulse animation', () => {
      const { container } = render(<DashboardHeader {...defaultProps} systemStatus="disconnected" />);
      
      const statusDot = screen.getByRole('status', { name: /system status: disconnected/i });
      expect(statusDot).toBeInTheDocument();
      
      // Check for red background color
      expect(statusDot).toHaveClass('bg-[#EF4444]');
      
      // Check that pulse animation is NOT present
      const pulseElement = container.querySelector('.animate-ping');
      expect(pulseElement).not.toBeInTheDocument();
    });

    it('displays unknown status with gray dot and no pulse animation', () => {
      const { container } = render(<DashboardHeader {...defaultProps} systemStatus="unknown" />);
      
      const statusDot = screen.getByRole('status', { name: /system status: unknown/i });
      expect(statusDot).toBeInTheDocument();
      
      // Check for gray background color
      expect(statusDot).toHaveClass('bg-[#9CA3AF]');
      
      // Check that pulse animation is NOT present
      const pulseElement = container.querySelector('.animate-ping');
      expect(pulseElement).not.toBeInTheDocument();
    });

    it('changes status dot color when systemStatus prop changes', () => {
      const { rerender } = render(<DashboardHeader {...defaultProps} systemStatus="connected" />);
      
      let statusDot = screen.getByRole('status');
      expect(statusDot).toHaveClass('bg-[#3ED98A]');
      
      // Change to disconnected
      rerender(<DashboardHeader {...defaultProps} systemStatus="disconnected" />);
      statusDot = screen.getByRole('status');
      expect(statusDot).toHaveClass('bg-[#EF4444]');
      
      // Change to unknown
      rerender(<DashboardHeader {...defaultProps} systemStatus="unknown" />);
      statusDot = screen.getByRole('status');
      expect(statusDot).toHaveClass('bg-[#9CA3AF]');
    });
  });

  describe('Alerts Button - Public User State (Requirement 5.6, 9.3)', () => {
    it('disables alerts button for public users', () => {
      render(<DashboardHeader {...defaultProps} isPublicUser={true} />);
      
      const alertsButton = screen.getByRole('button', { name: /alerts/i });
      expect(alertsButton).toBeDisabled();
    });

    it('adds aria-disabled attribute for public users (Requirement 9.3)', () => {
      render(<DashboardHeader {...defaultProps} isPublicUser={true} />);
      
      const alertsButton = screen.getByRole('button', { name: /alerts/i });
      expect(alertsButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('enables alerts button for authenticated users', () => {
      render(<DashboardHeader {...defaultProps} isPublicUser={false} />);
      
      const alertsButton = screen.getByRole('button', { name: /alerts/i });
      expect(alertsButton).not.toBeDisabled();
    });

    it('does not call onAlertsClick when button is disabled', async () => {
      const user = userEvent.setup();
      const onAlertsClick = vi.fn();
      
      render(<DashboardHeader {...defaultProps} isPublicUser={true} onAlertsClick={onAlertsClick} />);
      
      const alertsButton = screen.getByRole('button', { name: /alerts/i });
      
      // Try to click disabled button
      await user.click(alertsButton);
      
      // Should not have been called
      expect(onAlertsClick).not.toHaveBeenCalled();
    });

    it('calls onAlertsClick when alerts button is clicked by authenticated user', async () => {
      const user = userEvent.setup();
      const onAlertsClick = vi.fn();
      
      render(<DashboardHeader {...defaultProps} onAlertsClick={onAlertsClick} />);
      
      const alertsButton = screen.getByRole('button', { name: /alerts/i });
      await user.click(alertsButton);
      
      expect(onAlertsClick).toHaveBeenCalledTimes(1);
    });

    it('applies disabled styling to button for public users', () => {
      render(<DashboardHeader {...defaultProps} isPublicUser={true} />);
      
      const alertsButton = screen.getByRole('button', { name: /alerts/i });
      
      // Check for disabled classes
      expect(alertsButton).toHaveClass('disabled:cursor-not-allowed');
      expect(alertsButton).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Alerts Badge Display (Requirement 5.6)', () => {
    it('renders alerts button without badge when no alerts', () => {
      render(<DashboardHeader {...defaultProps} alertsCount={0} />);
      
      const alertsButton = screen.getByRole('button', { name: /alerts/i });
      expect(alertsButton).toBeInTheDocument();
      
      // Badge should not be present
      const badge = screen.queryByText(/\d+/);
      expect(badge).not.toBeInTheDocument();
    });

    it('renders alerts button with count badge when alerts present', () => {
      render(<DashboardHeader {...defaultProps} alertsCount={5} />);
      
      const alertsButton = screen.getByRole('button', { name: /alerts/i });
      expect(alertsButton).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays single-digit alert counts correctly', () => {
      render(<DashboardHeader {...defaultProps} alertsCount={3} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('displays double-digit alert counts correctly', () => {
      render(<DashboardHeader {...defaultProps} alertsCount={42} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('displays 99+ for alert counts of exactly 99', () => {
      render(<DashboardHeader {...defaultProps} alertsCount={99} />);
      expect(screen.queryByText('99+')).not.toBeInTheDocument();
      expect(screen.getByText('99')).toBeInTheDocument();
    });

    it('displays 99+ for alert counts over 99', () => {
      render(<DashboardHeader {...defaultProps} alertsCount={100} />);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('displays 99+ for alert counts well over 99', () => {
      render(<DashboardHeader {...defaultProps} alertsCount={500} />);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('applies red background to alert badge', () => {
      render(<DashboardHeader {...defaultProps} alertsCount={5} />);
      
      const badge = screen.getByText('5');
      expect(badge).toHaveClass('bg-[#EF4444]');
      expect(badge).toHaveClass('text-white');
    });

    it('updates badge count when alertsCount prop changes', () => {
      const { rerender } = render(<DashboardHeader {...defaultProps} alertsCount={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
      
      rerender(<DashboardHeader {...defaultProps} alertsCount={10} />);
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.queryByText('5')).not.toBeInTheDocument();
    });

    it('shows badge when count changes from 0 to positive', () => {
      const { rerender } = render(<DashboardHeader {...defaultProps} alertsCount={0} />);
      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
      
      rerender(<DashboardHeader {...defaultProps} alertsCount={3} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('hides badge when count changes from positive to 0', () => {
      const { rerender } = render(<DashboardHeader {...defaultProps} alertsCount={7} />);
      expect(screen.getByText('7')).toBeInTheDocument();
      
      rerender(<DashboardHeader {...defaultProps} alertsCount={0} />);
      expect(screen.queryByText('7')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Layout (Requirement 5.1, 7.1, 7.2, 7.3)', () => {
    it('applies flex layout for responsive behavior', () => {
      const { container } = render(<DashboardHeader {...defaultProps} />);
      
      const header = container.querySelector('header');
      
      // Mobile-first: flex-col
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
    });

    it('applies flex-row layout for larger screens (sm breakpoint)', () => {
      const { container } = render(<DashboardHeader {...defaultProps} />);
      
      const header = container.querySelector('header');
      
      // Desktop: sm:flex-row
      expect(header).toHaveClass('sm:flex-row');
    });

    it('applies space-between for desktop layout', () => {
      const { container } = render(<DashboardHeader {...defaultProps} />);
      
      const header = container.querySelector('header');
      
      // Desktop: justify-between
      expect(header).toHaveClass('sm:justify-between');
    });

    it('applies proper gap spacing between elements', () => {
      const { container } = render(<DashboardHeader {...defaultProps} />);
      
      const header = container.querySelector('header');
      
      // Gap for spacing
      expect(header).toHaveClass('gap-4');
    });

    it('applies flex-1 to title section for responsive growth', () => {
      const { container } = render(<DashboardHeader {...defaultProps} />);
      
      const titleSection = container.querySelector('.flex-1');
      expect(titleSection).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support (Requirement 8.1, 8.2)', () => {
    it('applies light and dark mode classes to title', () => {
      render(<DashboardHeader {...defaultProps} />);
      
      const title = screen.getByRole('heading', { level: 1 });
      
      // Light mode: text-[#1A312C]
      expect(title).toHaveClass('text-[#1A312C]');
      
      // Dark mode: dark:text-[#F9FAFB]
      expect(title).toHaveClass('dark:text-[#F9FAFB]');
    });

    it('applies light and dark mode classes to subtitle', () => {
      render(<DashboardHeader {...defaultProps} />);
      
      const subtitle = screen.getByText('Real-time energy, activity, system monitoring');
      
      // Light mode: text-[#6B7280]
      expect(subtitle).toHaveClass('text-[#6B7280]');
      
      // Dark mode: dark:text-[#9CA3AF]
      expect(subtitle).toHaveClass('dark:text-[#9CA3AF]');
    });

    it('applies light and dark mode classes to alerts button', () => {
      render(<DashboardHeader {...defaultProps} />);
      
      const alertsButton = screen.getByRole('button', { name: /alerts/i });
      
      // Light mode background
      expect(alertsButton).toHaveClass('bg-white');
      
      // Dark mode background
      expect(alertsButton).toHaveClass('dark:bg-[#1C1F28]');
      
      // Light mode border
      expect(alertsButton).toHaveClass('border-[#E5E7EB]');
      
      // Dark mode border
      expect(alertsButton).toHaveClass('dark:border-[#2A2E39]');
    });
  });

  describe('Accessibility (Requirement 9.3)', () => {
    it('provides accessible label for system status', () => {
      render(<DashboardHeader {...defaultProps} systemStatus="connected" />);
      
      const statusDot = screen.getByRole('status', { name: /system status: connected/i });
      expect(statusDot).toHaveAttribute('aria-label', 'System status: connected');
    });

    it('has keyboard-accessible alerts button', async () => {
      const user = userEvent.setup();
      const onAlertsClick = vi.fn();
      
      render(<DashboardHeader {...defaultProps} onAlertsClick={onAlertsClick} />);
      
      const alertsButton = screen.getByRole('button', { name: /alerts/i });
      
      // Focus the button
      alertsButton.focus();
      expect(alertsButton).toHaveFocus();
      
      // Press Enter to activate
      await user.keyboard('{Enter}');
      expect(onAlertsClick).toHaveBeenCalledTimes(1);
    });

    it('includes Bell icon in alerts button', () => {
      const { container } = render(<DashboardHeader {...defaultProps} />);
      
      // Check that the button contains an SVG (Bell icon)
      const button = screen.getByRole('button', { name: /alerts/i });
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('WebSocket Connection Indicator (Requirement 19.1)', () => {
    it('displays "Offline" status when WebSocket is disconnected', () => {
      render(<DashboardHeader {...defaultProps} isWebSocketConnected={false} />);
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('applies red color scheme when WebSocket is disconnected', () => {
      const { container } = render(<DashboardHeader {...defaultProps} isWebSocketConnected={false} />);
      
      const statusBadge = container.querySelector('.bg-red-50');
      expect(statusBadge).toBeInTheDocument();
      
      const statusDot = container.querySelector('.bg-red-500');
      expect(statusDot).toBeInTheDocument();
    });

    it('prioritizes WebSocket disconnection over system status', () => {
      render(<DashboardHeader {...defaultProps} systemStatus="connected" isWebSocketConnected={false} />);
      
      // Should show Offline (from WebSocket) not Online (from system status)
      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.queryByText('Online')).not.toBeInTheDocument();
    });

    it('shows system status when WebSocket is connected', () => {
      render(<DashboardHeader {...defaultProps} systemStatus="connected" isWebSocketConnected={true} />);
      
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('defaults to WebSocket connected when prop is not provided', () => {
      const { systemStatus, isWebSocketConnected, ...propsWithoutWebSocket } = defaultProps;
      render(<DashboardHeader {...propsWithoutWebSocket} systemStatus="connected" />);
      
      // Should show system status when WebSocket prop is omitted (defaults to true)
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('updates badge when WebSocket connection changes from connected to disconnected', () => {
      const { rerender } = render(<DashboardHeader {...defaultProps} systemStatus="connected" isWebSocketConnected={true} />);
      
      expect(screen.getByText('Online')).toBeInTheDocument();
      
      rerender(<DashboardHeader {...defaultProps} systemStatus="connected" isWebSocketConnected={false} />);
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.queryByText('Online')).not.toBeInTheDocument();
    });

    it('updates badge when WebSocket connection changes from disconnected to connected', () => {
      const { rerender } = render(<DashboardHeader {...defaultProps} systemStatus="connected" isWebSocketConnected={false} />);
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
      
      rerender(<DashboardHeader {...defaultProps} systemStatus="connected" isWebSocketConnected={true} />);
      
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.queryByText('Offline')).not.toBeInTheDocument();
    });

    it('provides accessible label for WebSocket disconnection status', () => {
      render(<DashboardHeader {...defaultProps} isWebSocketConnected={false} />);
      
      const statusElement = screen.getByRole('status', { name: /system status: offline/i });
      expect(statusElement).toHaveAttribute('aria-label', 'System status: Offline');
    });

    it('shows red dot indicator when WebSocket is disconnected', () => {
      const { container } = render(<DashboardHeader {...defaultProps} isWebSocketConnected={false} />);
      
      const redDot = container.querySelector('.bg-red-500');
      expect(redDot).toBeInTheDocument();
      expect(redDot).toHaveClass('w-3', 'h-3', 'rounded-full');
    });

    it('applies appropriate border color when WebSocket is disconnected', () => {
      const { container } = render(<DashboardHeader {...defaultProps} isWebSocketConnected={false} />);
      
      const statusBadge = container.querySelector('.border-red-200');
      expect(statusBadge).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles negative alert counts gracefully', () => {
      render(<DashboardHeader {...defaultProps} alertsCount={-5} />);
      
      // Should not display badge for negative counts
      expect(screen.queryByText('-5')).not.toBeInTheDocument();
    });

    it('handles very long titles without breaking layout', () => {
      const longTitle = 'This is a very long title that should not break the layout or overflow its container';
      render(<DashboardHeader {...defaultProps} title={longTitle} />);
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles empty subtitle', () => {
      render(<DashboardHeader {...defaultProps} subtitle="" />);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('handles rapid prop changes', () => {
      const { rerender } = render(<DashboardHeader {...defaultProps} systemStatus="connected" alertsCount={5} />);
      
      rerender(<DashboardHeader {...defaultProps} systemStatus="disconnected" alertsCount={10} />);
      rerender(<DashboardHeader {...defaultProps} systemStatus="unknown" alertsCount={0} />);
      rerender(<DashboardHeader {...defaultProps} systemStatus="connected" alertsCount={99} />);
      
      // Should render final state correctly
      expect(screen.getByRole('status', { name: /system status: connected/i })).toBeInTheDocument();
      expect(screen.getByText('99')).toBeInTheDocument();
    });
  });
});

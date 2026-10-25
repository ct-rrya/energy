import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InfoTooltip } from './InfoTooltip';

describe('InfoTooltip Component', () => {
  const defaultProps = {
    title: 'Energy Today (mWh)',
    description: 'Total clean energy generated and stored today from all footsteps.',
    analogy: 'Like the total distance traveled in a car.',
    technicalNote: 'Energy = ∫ P(t) dt.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders trigger button with accessible label', () => {
    render(<InfoTooltip {...defaultProps} />);
    const button = screen.getByRole('button', { name: /more info: energy today/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens tooltip on desktop hover after 150ms delay and closes on mouse leave', () => {
    vi.useFakeTimers();
    const { container } = render(<InfoTooltip {...defaultProps} />);
    const wrapper = container.querySelector('.relative.inline-flex.items-center');
    expect(wrapper).toBeInTheDocument();

    fireEvent.mouseEnter(wrapper!);
    // Before 150ms, tooltip should not be opened yet
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Advance 150ms
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Energy Today (mWh)')).toBeInTheDocument();

    fireEvent.mouseLeave(wrapper!);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('pins tooltip open when clicked and dismisses when clicked again', async () => {
    const user = userEvent.setup();
    render(<InfoTooltip {...defaultProps} />);

    const button = screen.getByRole('button', { name: /more info: energy today/i });
    await user.click(button);

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');

    // Clicking again should toggle it closed
    await user.click(button);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('dismisses tooltip when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(<InfoTooltip {...defaultProps} />);

    const button = screen.getByRole('button', { name: /more info: energy today/i });
    await user.click(button);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('dismisses tooltip when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <InfoTooltip {...defaultProps} />
        <div data-testid="outside">Outside Element</div>
      </div>
    );

    const button = screen.getByRole('button', { name: /more info: energy today/i });
    await user.click(button);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await user.click(screen.getByTestId('outside'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders analogy and technical notes when provided', async () => {
    const user = userEvent.setup();
    render(<InfoTooltip {...defaultProps} />);

    const button = screen.getByRole('button', { name: /more info: energy today/i });
    await user.click(button);

    expect(screen.getByText(/Like the total distance traveled in a car/i)).toBeInTheDocument();
    expect(screen.getByText(/Energy = ∫ P\(t\) dt/i)).toBeInTheDocument();
  });

  it('automatically flips downward and mounts via portal with z-index 60 when trigger is near the top of viewport', () => {
    vi.useFakeTimers();
    const { container } = render(<InfoTooltip {...defaultProps} position="top" />);
    const wrapper = container.querySelector('.relative.inline-flex.items-center') as HTMLElement;

    // Simulate trigger near top of screen (rect.top = 100px < 260px, bottom = 120px)
    vi.spyOn(wrapper.querySelector('button') as HTMLElement, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      bottom: 120,
      left: 300,
      right: 320,
      width: 20,
      height: 20,
      x: 300,
      y: 100,
      toJSON: () => {},
    });

    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(150);
    });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    // When flipped to bottom, style.top is 120 + offset 10 = 130px
    expect(tooltip.style.top).toBe('130px');
    expect(tooltip.style.zIndex).toBe('60');
  });

  it('automatically aligns safely within viewport when trigger is near the right edge of viewport', () => {
    vi.useFakeTimers();
    const { container } = render(<InfoTooltip {...defaultProps} align="center" />);
    const wrapper = container.querySelector('.relative.inline-flex.items-center') as HTMLElement;

    // Simulate trigger on right edge of 1000px screen (rect.right = 950px)
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1000 });
    vi.spyOn(wrapper.querySelector('button') as HTMLElement, 'getBoundingClientRect').mockReturnValue({
      top: 400,
      bottom: 420,
      left: 930,
      right: 950,
      width: 20,
      height: 20,
      x: 930,
      y: 400,
      toJSON: () => {},
    });

    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(150);
    });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    // Clamped safely within viewport (left <= 1000 - 300 - 12 = 688px)
    expect(parseInt(tooltip.style.left, 10)).toBeLessThanOrEqual(688);
    expect(tooltip.style.zIndex).toBe('60');
  });
});

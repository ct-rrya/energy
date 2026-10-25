import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuestPlayerModal } from './GuestPlayerModal';
import { PlayerContextType, PlayerProvider } from '@/contexts/PlayerContext';
import * as PlayerContextModule from '@/contexts/PlayerContext';

describe('GuestPlayerModal', () => {
  const mockCreatePlayer = vi.fn();
  const mockClosePlayerModal = vi.fn();
  const mockClearError = vi.fn();

  const defaultMockContext: PlayerContextType = {
    player: null,
    sessionToken: null,
    isLoading: false,
    isSubmitting: false,
    isModalOpen: true,
    error: null,
    createPlayer: mockCreatePlayer,
    logout: vi.fn(),
    openPlayerModal: vi.fn(),
    closePlayerModal: mockClosePlayerModal,
    clearError: mockClearError,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue(defaultMockContext);
  });

  it('renders modal with title, input, and instructions when isModalOpen is true', () => {
    render(<GuestPlayerModal />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Play & Learn')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. EcoExplorer42/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start playing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('does not render modal when isModalOpen is false', () => {
    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue({
      ...defaultMockContext,
      isModalOpen: false,
    });

    render(<GuestPlayerModal />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('validates username length (<3 chars) and disables submit', async () => {
    const user = userEvent.setup();
    render(<GuestPlayerModal />);

    const input = screen.getByPlaceholderText(/e\.g\. EcoExplorer42/i);
    await user.type(input, 'ab');

    expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
    const submitBtn = screen.getByRole('button', { name: /start playing/i });
    expect(submitBtn).toBeDisabled();
  });

  it('validates disallowed special characters and shows message', async () => {
    const user = userEvent.setup();
    render(<GuestPlayerModal />);

    const input = screen.getByPlaceholderText(/e\.g\. EcoExplorer42/i);
    await user.type(input, 'bad@user');

    expect(
      screen.getByText(/Only letters, numbers, underscores \(_\), and hyphens \(-\) allowed/),
    ).toBeInTheDocument();
  });

  it('calls createPlayer with normalized trimmed username when submitted', async () => {
    const user = userEvent.setup();
    render(<GuestPlayerModal />);

    const input = screen.getByPlaceholderText(/e\.g\. EcoExplorer42/i);
    await user.type(input, 'ValidPlayer99');

    const submitBtn = screen.getByRole('button', { name: /start playing/i });
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);

    expect(mockCreatePlayer).toHaveBeenCalledWith('ValidPlayer99');
  });

  it('displays backend error message if provided', () => {
    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue({
      ...defaultMockContext,
      error: 'That username is already taken. Please choose another one.',
    });

    render(<GuestPlayerModal />);
    expect(
      screen.getByText('That username is already taken. Please choose another one.'),
    ).toBeInTheDocument();
  });

  it('calls closePlayerModal on cancel button click', async () => {
    const user = userEvent.setup();
    render(<GuestPlayerModal />);

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);

    expect(mockClosePlayerModal).toHaveBeenCalled();
  });
});

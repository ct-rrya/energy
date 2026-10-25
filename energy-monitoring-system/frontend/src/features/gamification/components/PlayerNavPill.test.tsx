import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PlayerNavPill } from './PlayerNavPill';
import { PlayerContextType } from '@/contexts/PlayerContext';
import * as PlayerContextModule from '@/contexts/PlayerContext';

describe('PlayerNavPill', () => {
  const mockOpenPlayerModal = vi.fn();
  const mockLogout = vi.fn();
  const mockRefreshPlayer = vi.fn();

  const mockBaseContext: PlayerContextType = {
    player: null,
    sessionToken: null,
    isLoading: false,
    isSubmitting: false,
    isModalOpen: false,
    error: null,
    createPlayer: vi.fn(),
    logout: mockLogout,
    refreshPlayer: mockRefreshPlayer,
    openPlayerModal: mockOpenPlayerModal,
    closePlayerModal: vi.fn(),
    clearError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Play & Learn button when no guest player is active', () => {
    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue(mockBaseContext);

    render(
      <MemoryRouter>
        <PlayerNavPill />
      </MemoryRouter>,
    );

    const button = screen.getByRole('button', { name: /play & learn/i });
    expect(button).toBeInTheDocument();
  });

  it('triggers openPlayerModal when Play & Learn button is clicked', async () => {
    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue(mockBaseContext);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <PlayerNavPill />
      </MemoryRouter>,
    );

    const button = screen.getByRole('button', { name: /play & learn/i });
    await user.click(button);

    expect(mockOpenPlayerModal).toHaveBeenCalled();
  });

  it('renders player username when player session is active', () => {
    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue({
      ...mockBaseContext,
      player: {
        playerId: 'eco_player_1234567890abcdef',
        username: 'SolarPioneer',
        createdAt: '2026-10-23T00:00:00.000Z',
        lastActiveAt: '2026-10-23T00:00:00.000Z',
        level: 2,
        xp: 150,
      },
    });

    render(
      <MemoryRouter>
        <PlayerNavPill />
      </MemoryRouter>,
    );

    expect(screen.getByText('SolarPioneer')).toBeInTheDocument();
    expect(screen.getByText('Lv.2')).toBeInTheDocument();
  });

  it('opens dropdown on click and allows ending the session', async () => {
    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue({
      ...mockBaseContext,
      player: {
        playerId: 'eco_player_1234567890abcdef',
        username: 'SolarPioneer',
        createdAt: '2026-10-23T00:00:00.000Z',
        lastActiveAt: '2026-10-23T00:00:00.000Z',
        level: 1,
        xp: 50,
      },
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <PlayerNavPill />
      </MemoryRouter>,
    );

    const pillBtn = screen.getByRole('button', { name: /solarpioneer/i });
    await user.click(pillBtn);

    expect(screen.getByText(/Level 1 Explorer/i)).toBeInTheDocument();
    expect(screen.getByText(/50 XP/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to missions & quizzes/i })).toBeInTheDocument();

    const logoutBtn = screen.getByRole('button', { name: /switch \/ end session/i });
    await user.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalled();
  });
});

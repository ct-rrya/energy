import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { PlayerProvider, usePlayer } from './PlayerContext';
import { playersService } from '@/api/services/players.service';

vi.mock('@/api/services/players.service', () => ({
  playersService: {
    createGuestPlayer: vi.fn(),
    getCurrentPlayer: vi.fn(),
    logout: vi.fn(),
  },
}));

function TestConsumer() {
  const { player, isLoading, error, createPlayer, logout, openPlayerModal, isModalOpen } = usePlayer();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'idle'}</div>
      <div data-testid="player-name">{player ? player.username : 'none'}</div>
      <div data-testid="player-id">{player ? player.playerId : 'none'}</div>
      <div data-testid="modal-state">{isModalOpen ? 'open' : 'closed'}</div>
      {error && <div data-testid="error-message">{error}</div>}
      <button onClick={() => createPlayer('EcoWarrior')}>Join</button>
      <button onClick={logout}>Logout</button>
      <button onClick={openPlayerModal}>OpenModal</button>
    </div>
  );
}

describe('PlayerContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initializes with no player if localStorage is empty', async () => {
    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('idle');
    expect(screen.getByTestId('player-name')).toHaveTextContent('none');
  });

  it('synchronously hydrates player on hard reload without flashing logged out state', () => {
    const storedSession = {
      playerId: 'eco_player_9999',
      username: 'HardReloadHero',
      sessionToken: 'valid_token_xyz',
    };
    localStorage.setItem('ecostep_player_session', JSON.stringify(storedSession));

    // Do NOT resolve getCurrentPlayer yet, test initial synchronous frame
    vi.mocked(playersService.getCurrentPlayer).mockReturnValue(new Promise(() => {}));

    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    // Synchronous state on first render
    expect(screen.getByTestId('player-name')).toHaveTextContent('HardReloadHero');
    expect(screen.getByTestId('player-id')).toHaveTextContent('eco_player_9999');
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
  });

  it('restores player session and updates profile when backend verifies token', async () => {
    const storedSession = {
      playerId: 'eco_player_123',
      username: 'ReturningHero',
      sessionToken: 'valid_token_xyz',
    };
    localStorage.setItem('ecostep_player_session', JSON.stringify(storedSession));

    vi.mocked(playersService.getCurrentPlayer).mockResolvedValueOnce({
      playerId: 'eco_player_123',
      username: 'ReturningHero',
      createdAt: '2026-10-23T00:00:00.000Z',
      lastActiveAt: '2026-10-23T00:00:00.000Z',
    });

    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    // Synchronously present
    expect(screen.getByTestId('player-name')).toHaveTextContent('ReturningHero');

    // Wait for async verification
    expect(await screen.findByText('ReturningHero')).toBeInTheDocument();
    expect(playersService.getCurrentPlayer).toHaveBeenCalledWith('valid_token_xyz');
    expect(screen.getByTestId('loading')).toHaveTextContent('idle');
  });

  it('retains saved player session on temporary network failure (does NOT wipe localStorage)', async () => {
    const storedSession = {
      playerId: 'eco_player_555',
      username: 'NetworkSurvivor',
      sessionToken: 'token_network_err',
    };
    localStorage.setItem('ecostep_player_session', JSON.stringify(storedSession));

    // Simulate network error / connection refused
    vi.mocked(playersService.getCurrentPlayer).mockRejectedValueOnce(
      new Error('Network Error'),
    );

    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    await act(async () => {
      // allow promises to flush
    });

    // Player session is KEPT intact!
    expect(screen.getByTestId('player-name')).toHaveTextContent('NetworkSurvivor');
    expect(screen.getByTestId('loading')).toHaveTextContent('idle');
    expect(localStorage.getItem('ecostep_player_session')).not.toBeNull();
  });

  it('cleans up localStorage and sets clear message if session validation fails with 401', async () => {
    localStorage.setItem(
      'ecostep_player_session',
      JSON.stringify({ playerId: '123', username: 'Old', sessionToken: 'expired' }),
    );

    vi.mocked(playersService.getCurrentPlayer).mockRejectedValueOnce({
      response: { status: 401 },
    });

    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    await act(async () => {
      // allow promises to flush
    });

    expect(screen.getByTestId('player-name')).toHaveTextContent('none');
    expect(localStorage.getItem('ecostep_player_session')).toBeNull();
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Your previous guest session has expired. Please choose a username to join again.',
    );
  });

  it('creates player, persists token, and updates state', async () => {
    vi.mocked(playersService.createGuestPlayer).mockResolvedValueOnce({
      player: {
        playerId: 'eco_player_999',
        username: 'EcoWarrior',
        createdAt: '2026-10-23T00:00:00.000Z',
        lastActiveAt: '2026-10-23T00:00:00.000Z',
      },
      sessionToken: 'new_secret_session_token',
    });

    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    const joinBtn = screen.getByText('Join');
    await act(async () => {
      joinBtn.click();
    });

    expect(screen.getByTestId('player-name')).toHaveTextContent('EcoWarrior');
    const stored = JSON.parse(localStorage.getItem('ecostep_player_session') || '{}');
    expect(stored.sessionToken).toBe('new_secret_session_token');
  });

  it('handles 409 conflict error when username is already taken', async () => {
    vi.mocked(playersService.createGuestPlayer).mockRejectedValueOnce({
      response: { status: 409 },
    });

    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    const joinBtn = screen.getByText('Join');
    await act(async () => {
      joinBtn.click();
    });

    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'That username is already taken. Please choose another one.',
    );
    expect(screen.getByTestId('player-name')).toHaveTextContent('none');
  });

  it('clears session on logout', async () => {
    localStorage.setItem(
      'ecostep_player_session',
      JSON.stringify({ playerId: '123', username: 'EcoUser', sessionToken: 'token123' }),
    );
    vi.mocked(playersService.getCurrentPlayer).mockResolvedValueOnce({
      playerId: '123',
      username: 'EcoUser',
      createdAt: '',
      lastActiveAt: '',
    });
    vi.mocked(playersService.logout).mockResolvedValueOnce({ success: true, message: 'ok' });

    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    await screen.findByText('EcoUser');

    const logoutBtn = screen.getByText('Logout');
    await act(async () => {
      logoutBtn.click();
    });

    expect(screen.getByTestId('player-name')).toHaveTextContent('none');
    expect(localStorage.getItem('ecostep_player_session')).toBeNull();
  });
});

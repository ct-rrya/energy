import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LeaderboardPage } from './LeaderboardPage';
import type { LeaderboardResponse } from '@/types';
import * as PlayerContextModule from '@/contexts/PlayerContext';
import { gamificationService } from '@/api/services';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LeaderboardPage', () => {
  const mockLeaderboardResponse: LeaderboardResponse = {
    leaderboard: [
      {
        rank: 1,
        playerId: 'player_gold',
        username: 'GoldChampion',
        xp: 350,
        level: 4,
        levelTitle: 'Kinetic Master',
        badgeCount: 4,
        completedMissionsCount: 3,
        isCurrentPlayer: false,
      },
      {
        rank: 2,
        playerId: 'player_silver',
        username: 'SilverRunner',
        xp: 220,
        level: 3,
        levelTitle: 'Kinetic Innovator',
        badgeCount: 2,
        completedMissionsCount: 2,
        isCurrentPlayer: true,
      },
      {
        rank: 3,
        playerId: 'player_bronze',
        username: 'BronzeExplorer',
        xp: 150,
        level: 2,
        levelTitle: 'Energy Harvester',
        badgeCount: 1,
        completedMissionsCount: 1,
        isCurrentPlayer: false,
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      totalPlayers: 3,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    currentPlayer: {
      rank: 2,
      playerId: 'player_silver',
      username: 'SilverRunner',
      xp: 220,
      level: 3,
      levelTitle: 'Kinetic Innovator',
      badgeCount: 2,
      completedMissionsCount: 2,
    },
    currentPlayerRank: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(gamificationService, 'getLeaderboard').mockResolvedValue(mockLeaderboardResponse);
  });

  it('renders leaderboard with podium, table, and highlights current player', async () => {
    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue({
      player: {
        playerId: 'player_silver',
        username: 'SilverRunner',
        createdAt: '2026-10-23T00:00:00.000Z',
        lastActiveAt: '2026-10-23T00:00:00.000Z',
        level: 3,
        xp: 220,
      },
      sessionToken: 'valid-token',
      isLoading: false,
      isSubmitting: false,
      isModalOpen: false,
      error: null,
      createPlayer: vi.fn(),
      logout: vi.fn(),
      refreshPlayer: vi.fn(),
      openPlayerModal: vi.fn(),
      closePlayerModal: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter>
        <LeaderboardPage />
      </MemoryRouter>,
    );

    // Header & Titles
    expect(await screen.findByText('Top Energy Champions')).toBeInTheDocument();
    expect(screen.getByText('Global Rankings')).toBeInTheDocument();

    // Podium ranks
    expect(screen.getByText('Grand Champion • 1st Place')).toBeInTheDocument();
    expect(screen.getAllByText('GoldChampion').length).toBeGreaterThan(0);
    expect(screen.getAllByText('SilverRunner').length).toBeGreaterThan(0);
    expect(screen.getAllByText('BronzeExplorer').length).toBeGreaterThan(0);

    // Current player rank banner & badges
    expect(screen.getByText('Your Global Rank')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getAllByText('You').length).toBeGreaterThan(0);

    // Switch to missions button
    const switchBtn = screen.getByRole('button', { name: /switch to mission hub/i });
    fireEvent.click(switchBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/missions');
  });

  it('allows public visitor access without player session', async () => {
    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue({
      player: null,
      sessionToken: null,
      isLoading: false,
      isSubmitting: false,
      isModalOpen: false,
      error: null,
      createPlayer: vi.fn(),
      logout: vi.fn(),
      refreshPlayer: vi.fn(),
      openPlayerModal: vi.fn(),
      closePlayerModal: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter>
        <LeaderboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Top Energy Champions')).toBeInTheDocument();
    expect(screen.getByText(/Viewing as a Guest:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join to compete/i })).toBeInTheDocument();
  });

  it('handles empty leaderboard state', async () => {
    vi.spyOn(gamificationService, 'getLeaderboard').mockResolvedValue({
      leaderboard: [],
      pagination: {
        page: 1,
        limit: 20,
        totalPlayers: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      currentPlayer: null,
    });

    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue({
      player: null,
      sessionToken: null,
      isLoading: false,
      isSubmitting: false,
      isModalOpen: false,
      error: null,
      createPlayer: vi.fn(),
      logout: vi.fn(),
      refreshPlayer: vi.fn(),
      openPlayerModal: vi.fn(),
      closePlayerModal: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter>
        <LeaderboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('No Players on the Leaderboard Yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start learning/i })).toBeInTheDocument();
  });

  it('handles error state and allows retry', async () => {
    vi.spyOn(gamificationService, 'getLeaderboard').mockRejectedValueOnce(
      new Error('Network error'),
    );

    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue({
      player: null,
      sessionToken: null,
      isLoading: false,
      isSubmitting: false,
      isModalOpen: false,
      error: null,
      createPlayer: vi.fn(),
      logout: vi.fn(),
      refreshPlayer: vi.fn(),
      openPlayerModal: vi.fn(),
      closePlayerModal: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter>
        <LeaderboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Unable to load the leaderboard/i)).toBeInTheDocument();

    // Trigger retry
    vi.spyOn(gamificationService, 'getLeaderboard').mockResolvedValue(mockLeaderboardResponse);
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);

    expect(await screen.findByText('Top Energy Champions')).toBeInTheDocument();
  });
});

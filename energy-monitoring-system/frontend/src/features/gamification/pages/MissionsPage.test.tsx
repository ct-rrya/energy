import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MissionsPage } from './MissionsPage';
import type { Mission, Badge, PlayerProgressSummary } from '@/types';
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

describe('MissionsPage', () => {
  const mockMissions: Mission[] = [
    {
      id: 'piezoelectricity-101',
      title: 'Introduction to Piezoelectricity',
      subtitle: 'The fundamental physics of pressure-induced electrical charges',
      description: 'Learn how specific crystal lattices generate electrical voltage under mechanical stress.',
      estimatedMinutes: 5,
      xpReward: 100,
      isActive: true,
      sections: [],
      questionCount: 5,
      questions: [],
      isCompleted: true,
      bestScore: 5,
    },
    {
      id: 'electrical-fundamentals',
      title: 'Voltage, Current, Power & Energy',
      subtitle: 'The core quantitative metrics of electricity',
      description: 'Understand the mathematical and physical relationship between volts, amps, watts, and joules.',
      estimatedMinutes: 6,
      xpReward: 100,
      isActive: true,
      sections: [],
      questionCount: 5,
      questions: [],
      isCompleted: false,
      bestScore: 3,
    },
  ];

  const mockBadges: Badge[] = [
    {
      id: 'first_steps',
      name: 'First Steps',
      description: 'Complete your first educational mission and quiz.',
      icon: 'footprints',
      category: 'learning',
      isUnlocked: true,
      unlockedAt: '2026-10-23T00:00:00.000Z',
    },
  ];

  const mockProgress: PlayerProgressSummary = {
    playerId: 'eco_player_123',
    username: 'EcoChampion',
    xp: 100,
    level: 2,
    levelProgress: {
      currentXp: 100,
      level: 2,
      levelTitle: 'Spark Apprentice',
      currentLevelMinXp: 100,
      nextLevelXp: 250,
      xpToNextLevel: 150,
      progressPercentage: 0,
      isMaxLevel: false,
    },
    completedMissions: ['piezoelectricity-101'],
    totalMissions: 2,
    badges: mockBadges,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(gamificationService, 'getMissions').mockResolvedValue(mockMissions);
    vi.spyOn(gamificationService, 'getBadges').mockResolvedValue(mockBadges);
    vi.spyOn(gamificationService, 'getPlayerProgress').mockResolvedValue(mockProgress);
  });

  it('renders missions page for guest player with level progress, summary and badges', async () => {
    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue({
      player: {
        playerId: 'eco_player_123',
        username: 'EcoChampion',
        createdAt: '2026-10-23T00:00:00.000Z',
        lastActiveAt: '2026-10-23T00:00:00.000Z',
        level: 2,
        xp: 100,
      },
      sessionToken: 'valid-session-token',
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
        <MissionsPage />
      </MemoryRouter>,
    );

    // Header and titles
    expect(await screen.findByText('Educational Missions & Quizzes')).toBeInTheDocument();
    expect(screen.getByText('Introduction to Piezoelectricity')).toBeInTheDocument();
    expect(screen.getByText('Voltage, Current, Power & Energy')).toBeInTheDocument();

    // Summary cards
    expect(screen.getByText('Total Missions')).toBeInTheDocument();
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Available').length).toBeGreaterThan(0);
    expect(screen.getByText('Earned XP')).toBeInTheDocument();

    // Progress bar
    expect(screen.getByText('Spark Apprentice')).toBeInTheDocument();
    expect(screen.getByText('Rank Progress')).toBeInTheDocument();
    expect(screen.getByText(/Total XP Earned/)).toBeInTheDocument();

    // Badges showcase
    expect(screen.getByText('First Steps')).toBeInTheDocument();

    // Navigation to Leaderboard
    const leaderboardBtn = screen.getByRole('button', { name: /view leaderboard/i });
    expect(leaderboardBtn).toBeInTheDocument();
    fireEvent.click(leaderboardBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/leaderboard');
  });

  it('filters missions when filter buttons are clicked', async () => {
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
        <MissionsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Educational Missions & Quizzes')).toBeInTheDocument();

    // Click 'Completed' filter button
    const completedTab = screen.getByRole('button', { name: /completed \(1\)/i });
    fireEvent.click(completedTab);

    // Only completed mission should be present
    expect(screen.getByText('Introduction to Piezoelectricity')).toBeInTheDocument();
    expect(screen.queryByText('Voltage, Current, Power & Energy')).not.toBeInTheDocument();

    // Click 'Available' filter button
    const availableTab = screen.getByRole('button', { name: /available \(1\)/i });
    fireEvent.click(availableTab);

    expect(screen.queryByText('Introduction to Piezoelectricity')).not.toBeInTheDocument();
    expect(screen.getByText('Voltage, Current, Power & Energy')).toBeInTheDocument();
  });

  it('shows visitor banner when no player is authenticated', async () => {
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
        <MissionsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Exploring as a Guest:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join guest player mode/i })).toBeInTheDocument();
  });
});

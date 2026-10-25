import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MissionModal } from './MissionModal';
import type { Mission, QuizSubmissionResult } from '@/types';
import * as PlayerContextModule from '@/contexts/PlayerContext';
import { gamificationService } from '@/api/services';

describe('MissionModal', () => {
  const mockMission: Mission = {
    id: 'piezoelectricity-101',
    title: 'Introduction to Piezoelectricity',
    subtitle: 'The fundamental physics of pressure-induced electrical charges',
    description: 'Learn how specific crystal lattices generate electrical voltage under mechanical stress.',
    estimatedMinutes: 5,
    xpReward: 100,
    isActive: true,
    sections: [
      {
        title: 'The Direct Piezoelectric Effect',
        content: 'Discovered in 1880 by Pierre and Jacques Curie, the direct piezoelectric effect occurs...',
      },
      {
        title: 'Crystal Lattice Asymmetry',
        content: 'Materials such as Lead Zirconate Titanate (PZT) lack inversion symmetry...',
      },
    ],
    questionCount: 2,
    questions: [
      {
        id: 'q1',
        question: 'What is the direct piezoelectric effect?',
        options: [
          'Generating electrical charge from mechanical stress',
          'Generating light from heat',
          'Converting magnetic fields to rotation',
          'Storing electricity inside a chemical cell',
        ],
      },
      {
        id: 'q2',
        question: 'Which material exhibits piezoelectricity?',
        options: ['Copper', 'Lead Zirconate Titanate (PZT)', 'Silicon dioxide glass', 'Aluminum'],
      },
    ],
    isCompleted: false,
    bestScore: null,
  };

  const mockOnClose = vi.fn();
  const mockOnMissionCompleted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue({
      player: {
        playerId: 'eco_player_123',
        username: 'TestScientist',
        createdAt: '2026-10-23T00:00:00.000Z',
        lastActiveAt: '2026-10-23T00:00:00.000Z',
      },
      sessionToken: 'test-session-token-xyz',
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
  });

  it('renders lesson content initially', () => {
    render(
      <MissionModal
        mission={mockMission}
        isOpen={true}
        onClose={mockOnClose}
        onMissionCompleted={mockOnMissionCompleted}
      />,
    );

    expect(screen.getByText('Introduction to Piezoelectricity')).toBeInTheDocument();
    expect(screen.getByText('The Direct Piezoelectric Effect')).toBeInTheDocument();
    expect(screen.getByText(/Discovered in 1880/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /take mission quiz/i })).toBeInTheDocument();
  });

  it('navigates to quiz and handles answering and submission', async () => {
    const user = userEvent.setup();

    const mockSubmissionResult: QuizSubmissionResult = {
      missionId: 'piezoelectricity-101',
      passed: true,
      score: 2,
      totalQuestions: 2,
      percentage: 100,
      passingThreshold: 80,
      earnedXp: 100,
      alreadyCompleted: false,
      currentXp: 100,
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
      feedback: [
        {
          questionId: 'q1',
          question: 'What is the direct piezoelectric effect?',
          selectedAnswer: 0,
          correctAnswer: 0,
          isCorrect: true,
          explanation: 'Direct piezoelectricity converts mechanical stress into electrical potential.',
        },
        {
          questionId: 'q2',
          question: 'Which material exhibits piezoelectricity?',
          selectedAnswer: 1,
          correctAnswer: 1,
          isCorrect: true,
          explanation: 'PZT is a ferroelectric ceramic with high piezoelectric coefficients.',
        },
      ],
      newlyUnlockedBadges: [
        {
          id: 'first_steps',
          name: 'First Steps',
          description: 'Completed your first educational mission!',
          icon: 'footprints',
        },
      ],
    };

    vi.spyOn(gamificationService, 'submitQuiz').mockResolvedValue(mockSubmissionResult);

    render(
      <MissionModal
        mission={mockMission}
        isOpen={true}
        onClose={mockOnClose}
        onMissionCompleted={mockOnMissionCompleted}
      />,
    );

    // Switch to quiz tab
    const quizTab = screen.getByRole('button', { name: /take mission quiz/i });
    await user.click(quizTab);

    // Verify questions appear
    expect(screen.getByText('What is the direct piezoelectric effect?')).toBeInTheDocument();
    expect(screen.getByText('Which material exhibits piezoelectricity?')).toBeInTheDocument();

    // Select answers
    const option1 = screen.getByText('Generating electrical charge from mechanical stress');
    await user.click(option1);

    const option2 = screen.getByText('Lead Zirconate Titanate (PZT)');
    await user.click(option2);

    // Submit quiz
    const submitBtn = screen.getByRole('button', { name: /submit quiz/i });
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);

    // Verify submission result is shown
    expect(await screen.findByText('Mission Completed Successfully!')).toBeInTheDocument();
    expect(screen.getByText(/scored 2\/2 \(100%\) and earned \+100 XP!/i)).toBeInTheDocument();
    expect(screen.getByText(/New Badge Unlocked: First Steps!/i)).toBeInTheDocument();
    expect(screen.getByText(/Direct piezoelectricity converts mechanical stress/i)).toBeInTheDocument();
    expect(mockOnMissionCompleted).toHaveBeenCalledWith(mockSubmissionResult);
  });

  it('renders score, feedback, and retry button when quiz is not passed', async () => {
    const user = userEvent.setup();

    const mockFailedResult: QuizSubmissionResult = {
      missionId: 'piezoelectricity-101',
      passed: false,
      score: 0,
      totalQuestions: 2,
      percentage: 0,
      passingThreshold: 80,
      earnedXp: 0,
      alreadyCompleted: false,
      currentXp: 0,
      level: 1,
      levelProgress: {
        currentXp: 0,
        level: 1,
        levelTitle: 'Curious Walker',
        currentLevelMinXp: 0,
        nextLevelXp: 100,
        xpToNextLevel: 100,
        progressPercentage: 0,
        isMaxLevel: false,
      },
      feedback: [
        {
          questionId: 'q1',
          question: 'What is the direct piezoelectric effect?',
          selectedAnswer: 3,
          correctAnswer: 0,
          isCorrect: false,
          explanation: 'Direct piezoelectricity converts mechanical stress into electrical potential.',
        },
        {
          questionId: 'q2',
          question: 'Which material exhibits piezoelectricity?',
          selectedAnswer: 0,
          correctAnswer: 1,
          isCorrect: false,
          explanation: 'PZT is a ferroelectric ceramic with high piezoelectric coefficients.',
        },
      ],
      newlyUnlockedBadges: [],
    };

    vi.spyOn(gamificationService, 'submitQuiz').mockResolvedValue(mockFailedResult);

    render(
      <MissionModal
        mission={mockMission}
        isOpen={true}
        onClose={mockOnClose}
        onMissionCompleted={mockOnMissionCompleted}
      />,
    );

    const quizTab = screen.getByRole('button', { name: /take mission quiz/i });
    await user.click(quizTab);

    // Select wrong answers
    const option1 = screen.getByText('Storing electricity inside a chemical cell');
    await user.click(option1);

    const option2 = screen.getByText('Copper');
    await user.click(option2);

    const submitBtn = screen.getByRole('button', { name: /submit quiz/i });
    await user.click(submitBtn);

    // Should show failed banner
    expect(await screen.findByText('Almost There! Passing Score is 80%')).toBeInTheDocument();
    expect(screen.getByText(/You scored 0\/2 \(0%\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry quiz/i })).toBeInTheDocument();

    // Explanations for wrong answers
    expect(screen.getAllByText('Incorrect')).toHaveLength(2);
    expect(screen.getByText(/Direct piezoelectricity converts mechanical stress/i)).toBeInTheDocument();

    // Clicking retry quiz should return to quiz tab and reset answers
    const retryBtn = screen.getByRole('button', { name: /retry quiz/i });
    await user.click(retryBtn);

    expect(screen.getByText(/0 \/ 2 Answered/i)).toBeInTheDocument();
  });

  it('keeps footer actions pinned and visible without fixed height or blank areas', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MissionModal
        mission={mockMission}
        isOpen={true}
        onClose={mockOnClose}
        onMissionCompleted={mockOnMissionCompleted}
      />,
    );

    // Verify modal card has max-h-[85vh] and NOT h-[90vh]
    const modalCard = container.querySelector('[role="dialog"] > div');
    expect(modalCard).not.toBeNull();
    expect(modalCard?.className).toContain('max-h-[85vh]');
    expect(modalCard?.className).not.toContain('h-[90vh]');

    // Verify scroll body has min-h-0 and overflow-y-auto
    const scrollBody = container.querySelector('.overflow-y-auto');
    expect(scrollBody).not.toBeNull();
    expect(scrollBody?.className).toContain('min-h-0');

    // Tab 1 footer: Take Mission Quiz button visible
    expect(screen.getByRole('button', { name: /take mission quiz/i })).toBeInTheDocument();

    // Navigate to Tab 2
    const quizNavBtn = screen.getByRole('button', { name: /2\. quiz/i });
    await user.click(quizNavBtn);

    // Tab 2 footer: Back to Lesson and Submit Quiz buttons visible
    expect(screen.getByRole('button', { name: /back to lesson/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit quiz/i })).toBeInTheDocument();

    // Switch back to lesson
    const backBtn = screen.getByRole('button', { name: /back to lesson/i });
    await user.click(backBtn);
    expect(screen.getByText('Introduction to Piezoelectricity')).toBeInTheDocument();
  });
});

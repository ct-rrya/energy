import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LevelProgressBar } from './LevelProgressBar';
import type { PlayerLevelProgress } from '@/types';

describe('LevelProgressBar', () => {
  const mockProgress: PlayerLevelProgress = {
    currentXp: 180,
    level: 2,
    levelTitle: 'Spark Apprentice',
    currentLevelMinXp: 100,
    nextLevelXp: 250,
    xpToNextLevel: 70,
    progressPercentage: 53.33,
    isMaxLevel: false,
  };

  it('renders level, title, and XP progression accurately', () => {
    render(<LevelProgressBar levelProgress={mockProgress} />);

    expect(screen.getByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('Spark Apprentice')).toBeInTheDocument();
    expect(screen.getByText('180')).toBeInTheDocument();
    expect(screen.getByText(/70 XP/i)).toBeInTheDocument();
    expect(screen.getByText(/53%/i)).toBeInTheDocument();
  });

  it('displays max level message when player achieves top rank', () => {
    render(
      <LevelProgressBar
        levelProgress={{
          ...mockProgress,
          level: 5,
          levelTitle: 'Kinetic Master',
          isMaxLevel: true,
          nextLevelXp: null,
          xpToNextLevel: 0,
          progressPercentage: 100,
        }}
      />,
    );

    expect(screen.getByText(/Maximum Rank Achieved/i)).toBeInTheDocument();
  });
});

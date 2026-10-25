import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BadgeShowcase } from './BadgeShowcase';
import type { Badge } from '@/types';

describe('BadgeShowcase', () => {
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
    {
      id: 'energy_explorer',
      name: 'Energy Explorer',
      description: 'Complete all three initial educational missions.',
      icon: 'compass',
      category: 'mastery',
      isUnlocked: false,
      unlockedAt: null,
    },
    {
      id: 'knowledge_seeker',
      name: 'Knowledge Seeker',
      description: 'Reach 250 XP across educational missions.',
      icon: 'zap',
      category: 'progression',
      isUnlocked: false,
      unlockedAt: null,
    },
  ];

  it('renders badges with unlock counts', () => {
    render(<BadgeShowcase badges={mockBadges} />);

    expect(screen.getByText(/1 \/ 3 Unlocked/i)).toBeInTheDocument();
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Energy Explorer')).toBeInTheDocument();
    expect(screen.getByText('Knowledge Seeker')).toBeInTheDocument();
  });

  it('displays earned tag for unlocked badge and locked tag for locked badge', () => {
    render(<BadgeShowcase badges={mockBadges} />);

    expect(screen.getByText('Earned')).toBeInTheDocument();
    expect(screen.getAllByText('Locked')).toHaveLength(2);
  });
});

import { Player } from '../../players/schemas/player.schema';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'milestone' | 'mastery';
  isEligible: (player: Player) => boolean;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Completed your first EcoStep educational mission and quiz.',
    icon: 'Footprints',
    category: 'learning',
    isEligible: (player: Player) => (player.completedMissions?.length || 0) >= 1,
  },
  {
    id: 'energy_explorer',
    name: 'Energy Explorer',
    description: 'Completed all three foundational missions on piezoelectric harvesting.',
    icon: 'Compass',
    category: 'learning',
    isEligible: (player: Player) => {
      const required = [
        'mission_piezo_intro',
        'mission_v_i_p_e',
        'mission_ecostep_harvesting',
      ];
      return required.every((id) => player.completedMissions?.includes(id));
    },
  },
  {
    id: 'knowledge_seeker',
    name: 'Knowledge Seeker',
    description: 'Reached 100 XP through educational achievements.',
    icon: 'Award',
    category: 'milestone',
    isEligible: (player: Player) => (player.xp || 0) >= 100,
  },
];

export function evaluateEligibleBadges(player: Player): string[] {
  const currentBadgeIds = new Set(player.badges?.map((b) => b.badgeId) || []);
  const newBadgeIds: string[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (!currentBadgeIds.has(badge.id) && badge.isEligible(player)) {
      newBadgeIds.push(badge.id);
    }
  }

  return newBadgeIds;
}

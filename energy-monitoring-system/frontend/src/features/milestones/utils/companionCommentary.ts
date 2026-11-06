import type { MilestoneComparison } from '../types/milestone.types';

/**
 * EcoStep Campus Companion Commentary Engine
 *
 * Provides dynamic, personality-driven, intelligent observations for milestones.
 * Witty, subtle, and slightly cheeky campus companion tone.
 * Bases all observations on verified telemetry and comparisons.
 */

export interface CompanionObservation {
  headline: string;
  subtext: string;
}

// Simple deterministic hash to pick rotating variations without external state
function getVariantIndex(seed: string, count: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % count;
}

export function getCompanionCommentary(milestone: {
  id: string;
  label?: string;
  weekNumber?: number;
  state?: 'COMPLETED' | 'CURRENT' | 'UPCOMING';
  isAchieved: boolean;
  progressPercentage: number;
  currentMWh: number;
  targetMWh: number;
  stepCount: number;
  aiComment?: string;
  comparison?: MilestoneComparison;
}): CompanionObservation {
  const {
    id,
    state = 'CURRENT',
    isAchieved,
    progressPercentage,
    currentMWh,
    targetMWh,
    stepCount,
    aiComment,
    comparison,
  } = milestone;

  const pct = Math.round(progressPercentage);
  const remainingMWh = Math.max(0, Math.round((targetMWh - currentMWh) * 1000) / 1000);
  const seed = `${id}-${state}-${pct}-${stepCount}-${comparison?.category ?? 'none'}`;

  // Build comparative subtext based on authoritative telemetry
  let subtext = `${stepCount.toLocaleString()} footsteps recorded`;

  if (state === 'UPCOMING' || comparison?.category === 'UPCOMING') {
    subtext = 'Scheduled calendar period · 0 footsteps recorded';
  } else if (currentMWh === 0 && stepCount === 0) {
    subtext = 'Tile in standby · Waiting for pedestrian steps';
  } else if (comparison?.category === 'RECORD_HIGH') {
    const change = comparison.energyChangePct !== null ? ` (+${comparison.energyChangePct}%)` : '';
    subtext = `New weekly record${change} · ${stepCount.toLocaleString()} footsteps recorded`;
  } else if (comparison?.energyChangePct !== null && comparison?.energyChangePct !== undefined) {
    const sign = comparison.energyChangePct > 0 ? '+' : '';
    const stepDiff = comparison.stepDiff !== 0 ? ` (${comparison.stepDiff > 0 ? '+' : ''}${comparison.stepDiff.toLocaleString()} steps)` : '';
    subtext = `${sign}${comparison.energyChangePct}% vs previous week${stepDiff} · ${stepCount.toLocaleString()} footsteps`;
  } else if (comparison?.category === 'ACTIVITY_RESUMED') {
    subtext = `Activity resumed after quiet week · ${stepCount.toLocaleString()} footsteps`;
  } else if (comparison?.category === 'FIRST_GENERATION') {
    subtext = `First kinetic harvest · ${stepCount.toLocaleString()} footsteps recorded`;
  } else if (comparison?.category === 'BASELINE') {
    subtext = `Week 1 baseline · ${stepCount.toLocaleString()} footsteps recorded`;
  } else if (isAchieved && pct >= 150) {
    subtext = `${stepCount.toLocaleString()} footsteps recorded · ${pct - 100}% above target`;
  } else if (isAchieved) {
    subtext = `${stepCount.toLocaleString()} footsteps recorded · Milestone achieved`;
  } else if (pct >= 75) {
    subtext = `${stepCount.toLocaleString()} footsteps recorded · ${remainingMWh} mWh to goal`;
  }

  // If backend provided an authoritative, comparison-driven AI commentary, use it as headline
  if (aiComment && aiComment.trim().length > 0) {
    return {
      headline: aiComment,
      subtext,
    };
  }

  // Fallback rotating variation engine
  // 1. Upcoming
  if (state === 'UPCOMING') {
    const variants = [
      'Still in the future. The piezoelectric crystals are resting up before campus stomps all over them.',
      'Upcoming stretch. No footsteps expected yet, unless someone discovered time travel.',
      'Scheduled for later. The tiles are conserving their patience for when this week begins.',
      'On standby in the calendar. Crystals off-duty until the campus arrives.',
    ];
    return {
      headline: variants[getVariantIndex(seed, variants.length)],
      subtext,
    };
  }

  // 2. Zero activity
  if (currentMWh === 0 && stepCount === 0) {
    const variants = [
      'Zero footsteps registered so far. Did someone cancel morning lectures, or is everyone mastering levitation?',
      'Tile is awake and ready, but the hallway seems suspiciously quiet.',
      'The quartz crystals are waiting. All they need is some gravity and commitment.',
      'Silence on the floor. Waiting for the first brave soul to head across the tiles.',
    ];
    return {
      headline: variants[getVariantIndex(seed, variants.length)],
      subtext,
    };
  }

  // 3. Exceeded Target (>= 150%)
  if (isAchieved && pct >= 150) {
    const variants = [
      `Goal crushed at ${pct}%. At this rate, campus facilities might owe you dividend checks.`,
      `Overachiever mode engaged (${pct}%). Save some kinetic energy for next week!`,
      `150%+ beyond target? Somebody clearly took the scenic route across campus today.`,
      `Unapologetic overachiever alert. The tile is exhausted, but in a very proud way.`,
    ];
    return {
      headline: variants[getVariantIndex(seed, variants.length)],
      subtext,
    };
  }

  // 4. Achieved Target (100% - 149%)
  if (isAchieved || pct >= 100) {
    const variants = [
      `Milestone cleared! Target reached with ${stepCount.toLocaleString()} footsteps. Physics thanks you.`,
      `Mission accomplished. Every stride pulled its weight—target is officially in the books.`,
      `Done and dusted. The crystals did their job, and campus feet delivered.`,
      `Target hit right on cue. Take a victory lap (it only adds more energy anyway).`,
    ];
    return {
      headline: variants[getVariantIndex(seed, variants.length)],
      subtext,
    };
  }

  // 5. Near Completion (75% - 99.9%)
  if (pct >= 75) {
    const variants = [
      `Within striking distance at ${pct}%. A quick library run should honestly wrap this up.`,
      `${pct}% reached. Just a handful of brisk strides between you and the finish line.`,
      `Practically there (${pct}%). The finish line is officially within earshot.`,
      `Final stretch alert. One energetic class transition will push this over the edge.`,
    ];
    return {
      headline: variants[getVariantIndex(seed, variants.length)],
      subtext,
    };
  }

  // 6. Halfway Progress (35% - 74%)
  if (pct >= 35) {
    const variants = [
      `Over the hump at ${pct}%. The passing period rush did some serious heavy lifting.`,
      `Solid rhythm going. Halfway through the goal and the tiles are thoroughly warmed up.`,
      `${pct}% locked in. Those commute footsteps are paying actual energy dividends.`,
      `Campus momentum in action: ${stepCount.toLocaleString()} footsteps converted into clean stored power.`,
    ];
    return {
      headline: variants[getVariantIndex(seed, variants.length)],
      subtext,
    };
  }

  // 7. Early Progress
  const earlyVariants = [
    `Steady campus footsteps. ${stepCount.toLocaleString()} strides logged so far for this week.`,
    `The crystals have clocked in. Early milliwatt-hours are accumulating in storage.`,
    `Kinetic harvest in progress: ${stepCount.toLocaleString()} footsteps registered across the tiles.`,
  ];
  return {
    headline: earlyVariants[getVariantIndex(seed, earlyVariants.length)],
    subtext,
  };
}

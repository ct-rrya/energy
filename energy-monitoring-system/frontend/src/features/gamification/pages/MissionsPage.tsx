import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  Gamepad2,
  AlertCircle,
  RotateCcw,
  BookOpen,
  Trophy,
  Filter,
  Zap,
} from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { gamificationService } from '@/api/services';
import type {
  Mission,
  Badge,
  PlayerLevelProgress,
  QuizSubmissionResult,
} from '@/types';
import { BadgeShowcase } from '../components/BadgeShowcase';
import { MissionCard } from '../components/MissionCard';
import { MissionModal } from '../components/MissionModal';
import { ROUTES } from '@/routes/routes.config';

type MissionFilter = 'all' | 'available' | 'in_progress' | 'completed';

export function MissionsPage() {
  const navigate = useNavigate();
  const { player, sessionToken, openPlayerModal, refreshPlayer } = usePlayer();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [levelProgress, setLevelProgress] = useState<PlayerLevelProgress | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [filter, setFilter] = useState<MissionFilter>('all');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGamificationData = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    setError(null);

    try {
      // 1. Load missions
      const fetchedMissions = await gamificationService.getMissions(sessionToken);
      setMissions(fetchedMissions);

      // Keep selectedMission in sync if open
      setSelectedMission((prev) => {
        if (!prev) return null;
        return fetchedMissions.find((m) => m.id === prev.id) || prev;
      });

      // 2. Load badges
      const fetchedBadges = await gamificationService.getBadges(sessionToken);
      setBadges(fetchedBadges);

      // 3. Load player progress if authenticated
      if (sessionToken) {
        try {
          const progress = await gamificationService.getPlayerProgress(sessionToken);
          setLevelProgress(progress.levelProgress);
        } catch {
          // Fallback gracefully
        }
      } else {
        setLevelProgress(null);
      }
    } catch (err: unknown) {
      console.error('[EcoStep] Failed to load missions data:', err);
      if (!silent) {
        setError('Unable to load educational missions. Please check your connection and try again.');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [sessionToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGamificationData();
  }, [loadGamificationData]);

  const handleMissionCompleted = async (result: QuizSubmissionResult) => {
    if (result.levelProgress) {
      setLevelProgress(result.levelProgress);
    }
    await refreshPlayer();
    await loadGamificationData(true);
  };

  // Summary counts
  const totalMissionsCount = missions.length;
  const completedCount = missions.filter((m) => m.isCompleted).length;
  const availableCount = missions.filter((m) => !m.isCompleted).length;
  const inProgressCount = missions.filter(
    (m) => !m.isCompleted && m.bestScore !== null && m.bestScore !== undefined,
  ).length;

  // Filtered missions
  const filteredMissions = useMemo(() => {
    switch (filter) {
      case 'available':
        return missions.filter((m) => !m.isCompleted);
      case 'in_progress':
        // Missions attempted but not yet passed (or available to work on)
        return missions.filter(
          (m) => !m.isCompleted && (m.bestScore !== null && m.bestScore !== undefined),
        );
      case 'completed':
        return missions.filter((m) => m.isCompleted);
      case 'all':
      default:
        return missions;
    }
  }, [missions, filter]);

  // Level progress computation for compact header
  const currentLevel = levelProgress?.level ?? (player?.level ?? 1);
  const currentTitle = levelProgress?.levelTitle ?? 'Curious Walker';
  const currentXp = levelProgress?.currentXp ?? (player?.xp ?? 0);
  const xpToNext = levelProgress?.xpToNextLevel ?? Math.max(0, 100 - currentXp);
  const nextGoal = levelProgress?.nextLevelXp ?? 100;
  const progressPct = levelProgress
    ? Math.round(levelProgress.progressPercentage)
    : Math.min(100, Math.round((currentXp / 100) * 100));
  const isMaxLevel = levelProgress?.isMaxLevel ?? false;

  return (
    <div className="page">
      {/* Compact Mission Hub Header Card */}
      <header className="mh">
        <div className="mh-main">
          <div className="mh-top">
            <span className="mh-pill">
              <GraduationCap className="w-4 h-4" />
              <span>EcoStep Academy — Mission Hub</span>
            </span>

            {/* Navigation toggle to Leaderboard */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.LEADERBOARD)}
              className="mh-btn"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>View Leaderboard &rarr;</span>
            </button>

            {!player && (
              <button
                type="button"
                onClick={openPlayerModal}
                className="mh-btn"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Join Guest Player Mode</span>
              </button>
            )}
          </div>

          <h1>Educational Missions &amp; Quizzes</h1>

          <p title="Discover the real physics behind piezoelectric kinetic energy harvesting. Learn how footstep vibrations are converted, conditioned, and monitored — earn XP and unlock badges along the way.">
            Discover the real physics behind piezoelectric kinetic energy harvesting. Learn how footstep vibrations are converted, conditioned, and monitored — earn XP and unlock badges along the way.
          </p>
        </div>

        <aside className="mh-level" aria-label="Player level progress">
          <div className="lv-row">
            <div className="lv-left">
              <div className="lv-tile" aria-hidden="true">
                <Trophy />
                <span className="lv-badge">L{currentLevel}</span>
              </div>
              <div className="lv-info">
                <div className="lv-meta">
                  <span>LEVEL {currentLevel}</span>
                  <span className="lv-title-chip">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{currentTitle}</span>
                  </span>
                </div>
                <div className="lv-xp">
                  {currentXp.toLocaleString()} <span className="lv-unit">XP</span>
                </div>
              </div>
            </div>

            <div className="lv-target">
              {isMaxLevel ? (
                <>
                  <div>Max Rank Achieved</div>
                  <div className="lv-target-sub">All goals reached</div>
                </>
              ) : (
                <>
                  <div>{xpToNext} XP to Level {currentLevel + 1}</div>
                  <div className="lv-target-sub">Next goal: {nextGoal} XP</div>
                </>
              )}
            </div>
          </div>

          <div className="lv-bar">
            <div className="lv-bar-label">
              <span>
                <Zap />
                <span>Rank Progress</span>
              </span>
              <span className="lv-bar-pct">{progressPct}%</span>
            </div>
            <div
              className="lv-track"
              role="progressbar"
              aria-label="Rank progress"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="lv-fill"
                style={{ width: `${Math.max(2, Math.min(100, progressPct))}%` }}
              />
            </div>
          </div>

          <div className="lv-chip">
            Missions passed {completedCount}/{totalMissionsCount} · {currentXp} Total XP Earned
          </div>
        </aside>
      </header>

      {/* Visitor Notice Banner if not logged in */}
      {!player && (
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl text-xs shadow-sm mb-4"
          style={{
            backgroundColor: 'var(--lime)',
            color: 'var(--limeT)',
            border: '1px solid var(--line)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>Exploring as a Guest:</strong> You can read all lessons freely. To submit quizzes and save your XP, levels, and badges, choose a username.
            </span>
          </div>
          <button
            type="button"
            onClick={openPlayerModal}
            className="flex-shrink-0 font-bold underline cursor-pointer"
          >
            Create Guest Player &rarr;
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div
          className="cd p-16 text-center space-y-3"
          style={{
            borderRadius: '22px',
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
          }}
        >
          <div className="w-10 h-10 border-3 border-[#19D46A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium" style={{ color: 'var(--mu)' }}>Loading educational missions...</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => loadGamificationData()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#19D46A] text-[#0D1B14] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main Content when loaded */}
      {!isLoading && !error && (
        <>
          {/* Mission Progress Summary Cards (4-up stat row gap 16px) */}
          <div className="g4">
            <article className="cd st stat">
              <header className="stat-head flex items-center justify-between w-full">
                <div className="stat-label-wrap flex items-center gap-2">
                  <span className="stat-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#19D46A', flexShrink: 0 }} />
                  <span className="lb">Total Missions</span>
                </div>
              </header>
              <div className="v val">{totalMissionsCount}</div>
              <div className="name">All Curriculum Modules</div>
            </article>

            <article className="cd st stat">
              <header className="stat-head flex items-center justify-between w-full">
                <div className="stat-label-wrap flex items-center gap-2">
                  <span className="stat-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#13B95C', flexShrink: 0 }} />
                  <span className="lb">Completed</span>
                </div>
              </header>
              <div className="v val">{completedCount}</div>
              <div className="name">Mastered Modules</div>
            </article>

            <article className="cd st stat">
              <header className="stat-head flex items-center justify-between w-full">
                <div className="stat-label-wrap flex items-center gap-2">
                  <span className="stat-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#A6DC3C', flexShrink: 0 }} />
                  <span className="lb">Available</span>
                </div>
              </header>
              <div className="v val">{availableCount}</div>
              <div className="name">Ready to Start</div>
            </article>

            <article className="cd st stat">
              <header className="stat-head flex items-center justify-between w-full">
                <div className="stat-label-wrap flex items-center gap-2">
                  <span className="stat-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#7FE0A8', flexShrink: 0 }} />
                  <span className="lb">Earned XP</span>
                </div>
              </header>
              <div className="v val">
                {player ? player.xp : 0} <small>XP</small>
              </div>
              <div className="name">Total Experience Points</div>
            </article>
          </div>

          {/* Badges Showcase */}
          {badges.length > 0 && (
            <BadgeShowcase badges={badges} />
          )}

          {/* Missions Section & Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--t)', fontSize: '16px' }}>
                  <BookOpen className="w-5 h-5 text-[#19D46A]" />
                  Learning Missions
                </h2>
                <p className="sub text-xs" style={{ color: 'var(--mu)', fontSize: '13px' }}>
                  Read each lesson carefully, then pass the 5-question quiz with 80% or higher to earn XP.
                </p>
              </div>

              {/* Filter Tabs - Segmented control */}
              <div className="w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                <div className="sgc flex w-max">
                  <button
                    type="button"
                    onClick={() => setFilter('all')}
                    className={filter === 'all' ? 'on' : ''}
                    aria-pressed={filter === 'all'}
                  >
                    All ({totalMissionsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('available')}
                    className={filter === 'available' ? 'on' : ''}
                    aria-pressed={filter === 'available'}
                  >
                    Available ({availableCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('in_progress')}
                    className={filter === 'in_progress' ? 'on' : ''}
                    aria-pressed={filter === 'in_progress'}
                  >
                    In Progress ({inProgressCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('completed')}
                    className={filter === 'completed' ? 'on' : ''}
                    aria-pressed={filter === 'completed'}
                  >
                    Completed ({completedCount})
                  </button>
                </div>
              </div>
            </div>

            {filteredMissions.length === 0 ? (
              <div className="p-12 text-center space-y-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl">
                <Filter className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No Missions Found
                </h3>
                <p className="text-xs text-slate-500">
                  There are no missions currently matching the selected &ldquo;{filter}&rdquo; filter.
                </p>
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className="mt-2 text-xs font-bold text-[#428475] dark:text-[#89D7B7] hover:underline cursor-pointer"
                >
                  Reset filter to All
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredMissions.map((mission, index) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    index={index}
                    onSelect={(m) => setSelectedMission(m)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Mission Reader & Quiz Modal */}
      {selectedMission && (
        <MissionModal
          mission={selectedMission}
          isOpen={Boolean(selectedMission)}
          onClose={() => setSelectedMission(null)}
          onMissionCompleted={handleMissionCompleted}
        />
      )}
    </div>
  );
}

export default MissionsPage;

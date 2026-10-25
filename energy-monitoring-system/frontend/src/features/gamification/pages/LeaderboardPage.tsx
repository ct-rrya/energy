import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Medal,
  Crown,
  Sparkles,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertCircle,
  GraduationCap,
  Award,
  Zap,
  Info,
} from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { gamificationService } from '@/api/services';
import type {
  LeaderboardEntry,
  LeaderboardPagination,
  CurrentPlayerSummary,
} from '@/types';
import { ROUTES } from '@/routes/routes.config';

export function LeaderboardPage() {
  const navigate = useNavigate();
  const { player, sessionToken, openPlayerModal } = usePlayer();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pagination, setPagination] = useState<LeaderboardPagination>({
    page: 1,
    limit: 20,
    totalPlayers: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [currentPlayerRank, setCurrentPlayerRank] = useState<CurrentPlayerSummary | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (pageToLoad: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await gamificationService.getLeaderboard(
        { page: pageToLoad, limit: 20 },
        sessionToken,
      );

      const entries = response.leaderboard || response.entries || [];
      setLeaderboard(entries);
      setPagination(response.pagination);
      if (response.currentPlayer) {
        setCurrentPlayerRank(response.currentPlayer);
      }
    } catch (err: unknown) {
      console.error('[EcoStep] Failed to load leaderboard:', err);
      setError('Unable to load the leaderboard. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeaderboard(currentPage);
  }, [currentPage, fetchLeaderboard]);

  const handlePrevPage = () => {
    if (pagination.hasPrevPage && currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      setCurrentPage((p) => p + 1);
    }
  };

  // Top 3 for podium display (only on page 1)
  const topThree = currentPage === 1 ? leaderboard.slice(0, 3) : [];
  const rank1 = topThree.find((p) => p.rank === 1);
  const rank2 = topThree.find((p) => p.rank === 2);
  const rank3 = topThree.find((p) => p.rank === 3);
  const podiumCount = [rank2, rank1, rank3].filter(Boolean).length;

  return (
    <div className="page">
      {/* Compact Leaderboard Header */}
      <header className="lh">
        <div className="lh-main">
          <div className="lh-top">
            <span className="lh-pill">
              <Trophy className="w-4 h-4" />
              <span>EcoStep Global Leaderboard</span>
            </span>

            {/* Navigation toggle to Missions */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.MISSIONS)}
              className="lh-btn"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Switch to Mission Hub &rarr;</span>
            </button>

            {!player && (
              <button
                type="button"
                onClick={openPlayerModal}
                className="lh-btn"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Join to Compete</span>
              </button>
            )}
          </div>

          <h1>Top Energy Champions</h1>

          <p title="Real-time rankings based on authoritative XP earned from completing educational missions and mastering kinetic energy harvesting.">
            Real-time rankings based on authoritative XP earned from completing educational missions and mastering kinetic energy harvesting.
          </p>
        </div>

        {/* Global Rank Tile on Right */}
        <aside className="lh-rank" aria-label="Your global rank">
          <div className="lh-rank-label">Your Global Rank</div>
          <div className="lh-rank-val">
            {currentPlayerRank ? `#${currentPlayerRank.rank}` : '—'}
          </div>
          <div className="lh-rank-sub">
            {currentPlayerRank ? (
              `${currentPlayerRank.xp} XP • Lv.${currentPlayerRank.level}`
            ) : !player ? (
              <button
                type="button"
                onClick={openPlayerModal}
                className="font-bold hover:underline cursor-pointer"
              >
                Join to Compete &rarr;
              </button>
            ) : (
              `${player.xp} XP • Lv.${player.level}`
            )}
          </div>
        </aside>
      </header>

      {/* Guest notice if not logged in */}
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
              <strong>Viewing as a Guest:</strong> You are viewing global community rankings. Start learning to claim your spot on the leaderboard!
            </span>
          </div>
          <button
            type="button"
            onClick={openPlayerModal}
            className="flex-shrink-0 font-bold underline cursor-pointer"
          >
            Create Guest Username &rarr;
          </button>
        </div>
      )}

      {/* Loading State */}
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
          <p className="text-xs font-medium" style={{ color: 'var(--mu)' }}>
            Fetching authoritative player rankings...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => fetchLeaderboard(currentPage)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#19D46A] text-[#0D1B14] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && (
        <>
          {/* Top 3 Podium (Shown on Page 1 if we have at least 1 player) */}
          {currentPage === 1 && topThree.length > 0 && (
            <div
              className={`podium ${
                podiumCount === 2 ? 'podium-2' : podiumCount === 1 ? 'podium-1' : ''
              }`}
            >
              {/* Rank 2 (Silver) - 1st in DOM (left) */}
              {rank2 && (
                <div className="podium-card order-rank-2">
                  <div className="podium-icon-tile tile-silver">
                    <Medal className="w-6 h-6" />
                  </div>
                  <div className="podium-label">2nd Place • Silver</div>
                  <div className="podium-username">{rank2.username}</div>
                  {rank2.isCurrentPlayer && (
                    <span className="podium-you-pill">You</span>
                  )}
                  <div className="podium-sub">
                    {rank2.levelTitle} (Lv.{rank2.level})
                  </div>
                  <div className="podium-xp">
                    {rank2.xp.toLocaleString()} <small>XP</small>
                  </div>
                </div>
              )}

              {/* Rank 1 (Gold) - 2nd in DOM (center, tallest) */}
              {rank1 && (
                <div className="podium-card podium-champion order-rank-1">
                  <div className="podium-icon-tile tile-gold">
                    <Crown className="w-7 h-7" />
                  </div>
                  <div className="podium-label">Grand Champion • 1st Place</div>
                  <div className="podium-username">{rank1.username}</div>
                  {rank1.isCurrentPlayer && (
                    <span className="podium-you-pill">You</span>
                  )}
                  <div className="podium-sub">
                    {rank1.levelTitle} (Lv.{rank1.level})
                  </div>
                  <div className="podium-xp">
                    {rank1.xp.toLocaleString()} <small>XP</small>
                  </div>
                </div>
              )}

              {/* Rank 3 (Bronze) - 3rd in DOM (right) */}
              {rank3 && (
                <div className="podium-card order-rank-3">
                  <div className="podium-icon-tile tile-bronze">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="podium-label">3rd Place • Bronze</div>
                  <div className="podium-username">{rank3.username}</div>
                  {rank3.isCurrentPlayer && (
                    <span className="podium-you-pill">You</span>
                  )}
                  <div className="podium-sub">
                    {rank3.levelTitle} (Lv.{rank3.level})
                  </div>
                  <div className="podium-xp">
                    {rank3.xp.toLocaleString()} <small>XP</small>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Leaderboard Table / Card List */}
          <div className="lb-table-card">
            <div className="pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--line)' }}>
              <div>
                <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--t)', fontSize: '16px' }}>
                  <Trophy className="w-4 h-4 text-[#19D46A]" />
                  Global Rankings
                </h2>
                <p className="sub text-xs" style={{ color: 'var(--mu)', fontSize: '13px' }}>
                  Showing {leaderboard.length} of {pagination.totalPlayers} eligible active players
                </p>
              </div>

              {/* Informative Deterministic Tie-Breaker note */}
              <div
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-xl"
                style={{ backgroundColor: 'var(--soft)', color: 'var(--mu)' }}
              >
                <Info className="w-3.5 h-3.5 text-[#19D46A] flex-shrink-0" />
                <span>Deterministic tie-breaker: Total XP &rarr; Earliest record &rarr; Player ID</span>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold" style={{ color: 'var(--t)' }}>
                  No Players on the Leaderboard Yet
                </h3>
                <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--mu)' }}>
                  Be the first to complete an educational mission and claim the #1 rank!
                </p>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.MISSIONS)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#19D46A] text-[#0D1B14] transition-colors cursor-pointer mt-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Start Learning</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="lb-table">
                  <thead>
                    <tr>
                      <th className="w-16">Rank</th>
                      <th>Player</th>
                      <th>Level &amp; Title</th>
                      <th className="text-center">Badges</th>
                      <th className="text-right">Total XP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => {
                      const isTop1 = entry.rank === 1;
                      const isTop2 = entry.rank === 2;
                      const isTop3 = entry.rank === 3;

                      return (
                        <tr
                          key={entry.playerId}
                          className={`transition-colors ${
                            entry.isCurrentPlayer ? 'current-user-row' : ''
                          }`}
                        >
                          {/* Rank badge */}
                          <td className="whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {isTop1 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400 text-amber-950 font-black text-xs shadow-sm">
                                  1
                                </span>
                              ) : isTop2 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-slate-100 font-bold text-xs shadow-sm">
                                  2
                                </span>
                              ) : isTop3 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-700/30 text-amber-900 dark:text-amber-200 font-bold text-xs shadow-sm">
                                  3
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl text-slate-500 dark:text-slate-400 font-bold text-xs">
                                  #{entry.rank}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Username & Current Player indicator */}
                          <td className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-bold" style={{ color: 'var(--t)' }}>
                                {entry.username}
                              </span>
                              {entry.isCurrentPlayer && (
                                <span className="podium-you-pill">
                                  You
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Level & Title */}
                          <td className="whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-[#087A3A] dark:text-[#89D7B7]">
                                {entry.levelTitle}
                              </span>
                              <span className="text-[11px]" style={{ color: 'var(--mu)' }}>
                                Level {entry.level}
                              </span>
                            </div>
                          </td>

                          {/* Badges count */}
                          <td className="whitespace-nowrap text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/10 text-[11px] font-bold" style={{ color: 'var(--t)' }}>
                              <Award className="w-3 h-3 text-[#087A3A] dark:text-[#89D7B7]" />
                              {entry.badgeCount}
                            </span>
                          </td>

                          {/* Total XP */}
                          <td className="whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-1 font-bold text-xs sm:text-sm" style={{ color: 'var(--t)' }}>
                              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span>{entry.xp.toLocaleString()} XP</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={!pagination.hasPrevPage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="text-xs text-slate-500 font-medium">
                  Page <strong className="text-slate-800 dark:text-slate-200">{pagination.page}</strong> of{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{pagination.totalPages}</strong>
                </div>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={!pagination.hasNextPage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default LeaderboardPage;

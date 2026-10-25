import { Sparkles, Trophy, Zap } from 'lucide-react';
import type { PlayerLevelProgress } from '@/types';

interface LevelProgressBarProps {
  levelProgress: PlayerLevelProgress;
  className?: string;
}

export function LevelProgressBar({ levelProgress, className = '' }: LevelProgressBarProps) {
  const {
    level,
    levelTitle,
    currentXp,
    nextLevelXp,
    xpToNextLevel,
    progressPercentage,
    isMaxLevel,
  } = levelProgress;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        {/* Level badge & Title */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2FBF71] to-[#1A312C] text-white shadow-md shadow-[#2FBF71]/20">
            <Trophy className="w-6 h-6 text-[#89D7B7]" />
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#1A312C] text-[#89D7B7] border border-[#89D7B7]/40 shadow-sm">
              L{level}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#428475] dark:text-[#89D7B7]">
                Level {level}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#2FBF71]/10 text-[#2FBF71] dark:text-[#89D7B7]">
                <Sparkles className="w-3 h-3" />
                {levelTitle}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              {currentXp.toLocaleString()} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">XP</span>
            </h3>
          </div>
        </div>

        {/* Next level milestone pill */}
        <div className="text-left sm:text-right">
          {isMaxLevel ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#2FBF71]/15 text-[#2FBF71] border border-[#2FBF71]/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Maximum Rank Achieved</span>
            </div>
          ) : (
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                {xpToNextLevel} XP
              </span>{' '}
              to Level {level + 1}
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                Next goal: {nextLevelXp} XP
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress track */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#2FBF71]" />
            Rank Progress
          </span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>

        <div className="relative w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden p-0.5 border border-slate-200/50 dark:border-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#428475] via-[#2FBF71] to-[#89D7B7] transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${Math.max(4, Math.min(100, progressPercentage))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

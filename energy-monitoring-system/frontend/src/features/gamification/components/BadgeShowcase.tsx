import { Footprints, Compass, Zap, Award, Lock, CheckCircle2 } from 'lucide-react';
import type { Badge } from '@/types';

interface BadgeShowcaseProps {
  badges: Badge[];
  className?: string;
}

export function BadgeShowcase({ badges, className = '' }: BadgeShowcaseProps) {
  const getBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const props = {
      className: `w-5 h-5 ${isUnlocked ? 'text-[#2FBF71]' : 'text-slate-400 dark:text-slate-500'}`,
    };
    switch (iconName) {
      case 'footprints':
        return <Footprints {...props} />;
      case 'compass':
        return <Compass {...props} />;
      case 'zap':
        return <Zap {...props} />;
      default:
        return <Award {...props} />;
    }
  };

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#2FBF71]" />
            Achievement Badges
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Earn badges by completing educational missions and earning XP milestones.
          </p>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#2FBF71]/10 text-[#2FBF71] dark:text-[#89D7B7] border border-[#2FBF71]/20">
          {unlockedCount} / {badges.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {badges.map((badge) => {
          return (
            <div
              key={badge.id}
              className={`relative overflow-hidden rounded-xl p-3 border transition-all duration-200 ${
                badge.isUnlocked
                  ? 'bg-gradient-to-br from-white to-[#89D7B7]/10 dark:from-slate-900 dark:to-[#428475]/20 border-[#2FBF71]/30 shadow-sm'
                  : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-white/5 opacity-75'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border ${
                    badge.isUnlocked
                      ? 'bg-[#2FBF71]/15 border-[#2FBF71]/30 shadow-inner'
                      : 'bg-slate-200/50 dark:bg-slate-800/80 border-slate-300/40 dark:border-white/5'
                  }`}
                >
                  {getBadgeIcon(badge.icon, badge.isUnlocked)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4
                      className={`text-sm font-bold truncate ${
                        badge.isUnlocked
                          ? 'text-slate-900 dark:text-slate-100'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {badge.name}
                    </h4>

                    {badge.isUnlocked ? (
                      <span className="inline-flex items-center text-[10px] font-semibold text-[#2FBF71] gap-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Earned
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-medium text-slate-400 dark:text-slate-500 gap-0.5">
                        <Lock className="w-3 h-3" />
                        Locked
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                    {badge.description}
                  </p>

                  {badge.isUnlocked && badge.unlockedAt && (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
                      Unlocked on {new Date(badge.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

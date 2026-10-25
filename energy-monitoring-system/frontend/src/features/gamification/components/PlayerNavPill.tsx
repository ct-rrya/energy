import { useState, useRef, useEffect } from 'react';
import {
  Gamepad2,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  GraduationCap,
  Award,
  Zap,
} from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { ROUTES } from '@/routes/routes.config';

export function PlayerNavPill() {
  const { player, openPlayerModal, logout, isLoading } = usePlayer();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [dropdownOpen]);

  if (isLoading && !player) {
    return (
      <div className="h-[40px] w-24 rounded-full bg-[var(--soft)] animate-pulse flex-shrink-0" />
    );
  }

  // Not logged in as a guest player yet -> Show "Play & Learn" button
  if (!player) {
    return (
      <button
        type="button"
        onClick={openPlayerModal}
        className="user-chip"
        style={{ padding: '4px 14px 4px 6px' }}
        title="Join the EcoStep gamified experience as a guest"
      >
        <div className="user-chip-avatar">
          <Gamepad2 className="w-3.5 h-3.5" />
          <span className="user-chip-dot animate-pulse" />
        </div>
        <span className="user-chip-name">Play &amp; Learn</span>
      </button>
    );
  }

  const playerLevel = player.level || 1;
  const playerXp = player.xp || 0;
  const completedMissionsCount = player.completedMissions?.length || 0;
  const badgesCount = player.badges?.length || 0;

  // Active guest player -> Show player pill with dropdown
  return (
    <div ref={containerRef} className="relative inline-block flex-shrink-0">
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        aria-expanded={dropdownOpen}
        className="user-chip"
      >
        <div className="user-chip-avatar">
          <User className="w-3.5 h-3.5" />
          <span className="user-chip-dot" />
        </div>
        <span className="user-chip-lvl">
          Lv.{playerLevel}
        </span>
        <span className="user-chip-name">{player.username}</span>
        <ChevronDown
          className={`user-chip-chevron transition-transform duration-200 ${
            dropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Menu */}
      {dropdownOpen && (
        <div
          className="absolute right-0 mt-2 w-64 border p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
          style={{
            backgroundColor: 'var(--panel)',
            borderColor: 'var(--line)',
            color: 'var(--t)',
            borderRadius: '20px',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 pb-3 border-b"
            style={{ borderColor: 'var(--line)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0"
              style={{ backgroundColor: 'var(--mint)', color: 'var(--acc)' }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold truncate text-[var(--t)]">{player.username}</div>
              <div className="text-[11px] text-[var(--acc)] flex items-center gap-1 font-semibold">
                <span>Level {playerLevel} Explorer</span>
              </div>
            </div>
          </div>

          {/* Gamification Stats */}
          <div
            className="py-2.5 space-y-1.5 text-xs border-b"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between text-[var(--mu)]">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                Total XP:
              </span>
              <span className="font-bold text-[var(--t)]">
                {playerXp} XP
              </span>
            </div>

            <div className="flex items-center justify-between text-[var(--mu)]">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[var(--acc)]" />
                Missions:
              </span>
              <span className="font-semibold text-[var(--t)]">
                {completedCountMissionsText(completedMissionsCount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[var(--mu)]">
              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[var(--acc)]" />
                Badges:
              </span>
              <span className="font-semibold text-[var(--t)]">
                {badgesCount} / 3 Unlocked
              </span>
            </div>
          </div>

          {/* Link to Missions Page */}
          <a
            href={ROUTES.MISSIONS}
            onClick={() => setDropdownOpen(false)}
            className="w-full mt-2.5 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
            style={{
              backgroundColor: 'var(--mint)',
              color: 'var(--acc)',
            }}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Go to Missions &amp; Quizzes</span>
          </a>

          {/* Logout / Switch player button */}
          <button
            type="button"
            onClick={async () => {
              setDropdownOpen(false);
              await logout();
            }}
            className="w-full mt-2 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 transition-colors border border-red-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch / End Session</span>
          </button>
        </div>
      )}
    </div>
  );
}

function completedCountMissionsText(count: number) {
  if (count === 0) return '0 / 3';
  return `${count} / 3 Completed`;
}

import { Link } from 'react-router-dom';
import { Zap, Sun, Moon, Home } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { ROUTES } from '@/routes/routes.config';

interface MobileHeaderProps {
  onOpenMenu?: () => void;
}

export function MobileHeader({ onOpenMenu: _onOpenMenu }: MobileHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="sticky top-0 z-40 w-full h-14 px-4 flex items-center justify-between border-b backdrop-blur-md transition-colors"
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(16, 26, 48, 0.92)' : 'rgba(255, 255, 255, 0.92)',
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        color: theme === 'dark' ? '#eaf3ee' : '#0d1b14',
      }}
    >
      {/* Left: Brand Logo & Title */}
      <Link
        to={ROUTES.DASHBOARD}
        className="flex items-center gap-2.5 min-w-0"
        aria-label="EcoStep Dashboard"
      >
        <div className="w-8 h-8 rounded-lg bg-[#16a34a] dark:bg-[#22c55e] text-white grid place-items-center shadow-xs flex-shrink-0">
          <Zap size={18} strokeWidth={2.4} fill="currentColor" />
        </div>
        <span className="font-extrabold text-base tracking-tight leading-none text-current">
          EcoStep
        </span>
      </Link>

      {/* Right: Quick Theme Toggle + Home Icon */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="w-9 h-9 rounded-full border border-neutral-200 dark:border-white/10 flex items-center justify-center text-current/80 hover:text-current hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun size={17} strokeWidth={1.8} />
          ) : (
            <Moon size={17} strokeWidth={1.8} />
          )}
        </button>

        <Link
          to={ROUTES.HOME}
          aria-label="Go to landing page"
          className="w-9 h-9 rounded-full border border-neutral-200 dark:border-white/10 flex items-center justify-center text-current/80 hover:text-current hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <Home size={18} strokeWidth={2} />
        </Link>
      </div>
    </header>
  );
}

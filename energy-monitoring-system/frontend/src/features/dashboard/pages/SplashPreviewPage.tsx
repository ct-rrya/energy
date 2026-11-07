import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SplashScreen } from '@/components/common/SplashScreen';
import { Sun, Moon, ArrowRight, RotateCcw } from 'lucide-react';
import { ROUTES } from '@/routes/routes.config';

/**
 * Splash Screen Preview & Testing Page
 * 
 * Accessible at /splash route for easy verification and review.
 * Allows toggling light/dark mode and testing the animation replay.
 */
export function SplashPreviewPage() {
  const navigate = useNavigate();
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [replayKey, setReplayKey] = useState(0);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Top Floating Control Bar */}
      <div className="fixed top-4 right-4 z-[100000] flex items-center gap-2">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={() => setThemeMode((m) => (m === 'light' ? 'dark' : 'light'))}
          className="h-10 px-3.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all flex items-center gap-2 text-xs font-medium cursor-pointer shadow-lg"
          title="Toggle light/dark preview"
        >
          {themeMode === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          <span className="capitalize">{themeMode}</span>
        </button>

        {/* Replay Button */}
        <button
          type="button"
          onClick={() => setReplayKey((k) => k + 1)}
          className="h-10 px-3.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all flex items-center gap-2 text-xs font-medium cursor-pointer shadow-lg"
          title="Replay animation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Replay</span>
        </button>

        {/* Enter Dashboard Button */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="h-10 px-4 rounded-full bg-[#1fd566] text-[#06120c] hover:bg-[#19b957] font-semibold transition-all flex items-center gap-2 text-xs cursor-pointer shadow-lg"
        >
          <span>Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Splash Screen Instance */}
      <SplashScreen
        key={replayKey}
        standalone={true}
        forceShow={true}
        showReplayButton={true}
        themeOverride={themeMode}
      />
    </div>
  );
}


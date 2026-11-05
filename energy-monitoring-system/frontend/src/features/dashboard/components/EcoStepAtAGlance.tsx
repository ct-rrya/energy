import { Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { InfoTooltip } from '@/components/common/InfoTooltip';
import { getGlanceTooltip } from '../utils/metricTooltips';

export interface EcoStepAtAGlanceProps {
  todaySteps?: number;
  dailyEnergy?: number; // In Wh
  isOnline?: boolean;
}

/**
 * EcoStepAtAGlance Component
 * 
 * Short, informative introductory banner.
 * Does NOT repeat individual metric cards. Explains the system state in plain English.
 */
export function EcoStepAtAGlance({
  todaySteps,
  dailyEnergy,
}: EcoStepAtAGlanceProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const hasSteps = todaySteps !== undefined && todaySteps > 0;
  const stepsCount = todaySteps ?? 0;
  
  // Format energy cleanly
  const formatEnergy = (wh?: number) => {
    if (wh === undefined || wh === 0) return { value: '0.00', unit: 'mWh' };
    if (wh < 1) {
      return { value: (wh * 1000).toFixed(2), unit: 'mWh' };
    }
    return { value: wh.toFixed(3), unit: 'Wh' };
  };

  const energyInfo = formatEnergy(dailyEnergy);

  return (
    <div className="cd ecostep-glance-card w-full transition-all duration-200">
      <div className="ecostep-glance-head flex items-center justify-between gap-3 mb-2 pb-2 border-b border-[var(--line)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="ecostep-glance-badge w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: isDark ? 'rgba(62, 217, 138, 0.15)' : 'rgba(47, 191, 113, 0.12)',
              color: isDark ? '#3ED98A' : '#087A3A',
            }}
          >
            <Sparkles size={16} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h3 className="ecostep-glance-title text-sm sm:text-base font-bold tracking-tight text-[var(--t)]">
              Your EcoStep Today
            </h3>
            <p className="ecostep-glance-sub text-[11px] sm:text-xs text-[var(--mu)]">
              A simple summary of today's recorded activity.
            </p>
          </div>
        </div>

        <InfoTooltip
          title="EcoStep Today"
          description={getGlanceTooltip(todaySteps, dailyEnergy)}
          size={16}
          position="bottom"
          align="right"
        />
      </div>

      <p className="ecostep-glance-body text-xs sm:text-sm leading-relaxed text-[var(--t)]">
        {hasSteps ? (
          <>
            Today, EcoStep recorded{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
              {stepsCount.toLocaleString()} {stepsCount === 1 ? 'footstep' : 'footsteps'}
            </strong>
            , generating an estimated{' '}
            <strong className="text-amber-600 dark:text-amber-400 font-bold">
              {energyInfo.value} {energyInfo.unit}
            </strong>{' '}
            of clean electrical energy.
          </>
        ) : (
          <>
            EcoStep is waiting for footsteps. Step on the piezoelectric tiles to begin generating measurable electrical output.
          </>
        )}
      </p>
    </div>
  );
}

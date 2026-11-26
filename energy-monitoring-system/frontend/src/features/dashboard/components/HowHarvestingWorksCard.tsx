import { useState } from 'react';
import { Footprints, Cpu, Activity, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { InfoTooltip } from '@/components/common/InfoTooltip';

/**
 * HowHarvestingWorksCard Component
 *
 * Clean, flat horizontal 3-step editorial strip explaining EcoStep footstep harvesting.
 * Uses hairline dividers instead of nested cards for a calm, non-boxy layout.
 */
export function HowHarvestingWorksCard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ecostep.dashboard.howItWorksExpanded');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ecostep.dashboard.howItWorksExpanded', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const steps = [
    {
      num: '01',
      icon: Footprints,
      title: 'Step & Harvest',
      desc: 'Footsteps press piezoelectric pads inside the tile, converting everyday motion directly into clean electric charge.',
      color: '#19D46A',
    },
    {
      num: '02',
      icon: Cpu,
      title: 'Smooth & Store',
      desc: 'An onboard power module stabilizes each electrical burst and stores the harvested energy safely.',
      color: '#3B82F6',
    },
    {
      num: '03',
      icon: Activity,
      title: 'Live Telemetry',
      desc: 'Smart sensors count footsteps and measure output, streaming real-time watts straight to this dashboard.',
      color: '#F59E0B',
    },
  ];

  return (
    <section className="how-harvesting-card w-full pt-5 mt-2 border-t border-[var(--line)]">
      {/* Flat Editorial Section Header */}
      <div className="flex items-center justify-between gap-3 pb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <BookOpen
            size={16}
            strokeWidth={2}
            className="shrink-0"
            style={{ color: isDark ? '#3ED98A' : '#087A3A' }}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-[var(--t)] m-0">
              How EcoStep Harvesting Works
            </h3>
            <p className="text-xs text-[var(--mu)] m-0">
              From a footstep on the tile to real-time power on your screen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <InfoTooltip
            title="How Footstep Power Works"
            description="Step down, press the smart pads, and store clean electricity—powered purely by everyday walking."
            size={15}
            align="right"
          />

          <button
            type="button"
            onClick={toggleExpanded}
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border border-[var(--line)] text-[var(--mu)] hover:text-[var(--t)] hover:bg-[var(--soft)] transition-colors cursor-pointer bg-transparent"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse explanation' : 'Expand explanation'}
          >
            <span>{isExpanded ? 'Hide' : 'Explain'}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Flat Horizontal 3-Step Strip with Hairline Dividers */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--line)] border-y border-[var(--line)]">
          {steps.map((step) => {
            const IconComp = step.icon;
            return (
              <div
                key={step.num}
                className="py-4 md:px-5 md:first:pl-0 md:last:pr-0 flex flex-col gap-1.5 min-w-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] font-bold tabular-nums tracking-wider"
                    style={{ color: step.color }}
                  >
                    {step.num}
                  </span>
                  <IconComp size={15} strokeWidth={2} style={{ color: step.color }} className="shrink-0" />
                  <span className="text-xs sm:text-[13px] font-semibold text-[var(--t)]">
                    {step.title}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[var(--mu)] m-0">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

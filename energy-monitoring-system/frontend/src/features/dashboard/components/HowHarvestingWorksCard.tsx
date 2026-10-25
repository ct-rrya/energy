import { useState } from 'react';
import { Footprints, Cpu, Zap, Activity, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { InfoTooltip } from '@/components/common/InfoTooltip';

/**
 * HowHarvestingWorksCard Component
 * 
 * Educational visual card on the main dashboard explaining the 4-step energy harvesting process.
 * Can be collapsed by returning users to keep the interface compact.
 */
export function HowHarvestingWorksCard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Allow users to collapse the card if they already know how it works
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
      num: 1,
      icon: Footprints,
      title: '1. Footstep Pressure',
      subtitle: 'Mechanical Force',
      desc: 'When a person walks across the floor tile, their body weight applies mechanical pressure to piezoelectric ceramic discs inside.',
      color: '#3ED98A',
      bgColor: isDark ? 'rgba(62, 217, 138, 0.12)' : 'rgba(47, 191, 113, 0.1)',
    },
    {
      num: 2,
      icon: Zap,
      title: '2. Piezoelectric Effect',
      subtitle: 'Energy Conversion',
      desc: 'The mechanical stress deforms the crystal lattice inside each disc, generating an electrical potential difference (voltage pulse).',
      color: '#F59E0B',
      bgColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.1)',
    },
    {
      num: 3,
      icon: Cpu,
      title: '3. Charge Conditioning',
      subtitle: 'Rectification & Storage',
      desc: 'A rectifier circuit converts raw AC pulses into stable DC power and stores the energy in an onboard capacitor bank.',
      color: '#3B82F6',
      bgColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.1)',
    },
    {
      num: 4,
      icon: Activity,
      title: '4. IoT Live Stream',
      subtitle: 'Telemetry to Screen',
      desc: 'Sensors and an ESP32 microcontroller calculate voltage, current, and power, streaming live updates directly to this dashboard.',
      color: '#EC4899',
      bgColor: isDark ? 'rgba(236, 72, 153, 0.12)' : 'rgba(236, 72, 153, 0.1)',
    },
  ];

  return (
    <div className="cd w-full transition-all duration-200">
      {/* Header bar with toggle */}
      <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-[var(--line)]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: isDark ? 'rgba(62, 217, 138, 0.15)' : 'rgba(47, 191, 113, 0.12)',
              color: isDark ? '#3ED98A' : '#2FBF71',
            }}
          >
            <BookOpen size={16} strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold tracking-tight text-[var(--t)]">
              How EcoStep Harvesting Works
            </h3>
            <p className="text-[11px] sm:text-xs text-[var(--mu)]">
              From a student's step on the tile to real-time watts on your screen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <InfoTooltip
            title="Piezoelectric Harvesting Process"
            description="Piezoelectricity comes from the Greek word 'piezein', meaning to push or squeeze. Certain solid materials accumulate electrical charge in response to applied mechanical stress."
            analogy="Like pressing a click lighter: mechanical push generates an instant spark of electrical potential!"
            technicalNote="EcoStep tiles use lead zirconate titanate (PZT) ceramic elements arranged in parallel arrays."
            size={16}
            align="right"
          />

          <button
            type="button"
            onClick={toggleExpanded}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
            style={{
              backgroundColor: isDark ? 'rgba(31, 41, 55, 0.6)' : '#F3F4F6',
              color: isDark ? '#D1D5DB' : '#374151',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse explanation' : 'Expand explanation'}
          >
            <span>{isExpanded ? 'Hide' : 'Explain'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* 4-Step Process Content */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-0 sm:px-4 sm:pb-4">
          <style>{`
            .harvesting-steps-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }
            @container (min-width: 560px) {
              .harvesting-steps-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }
            @container (min-width: 960px) {
              .harvesting-steps-grid {
                grid-template-columns: repeat(4, minmax(0, 1fr));
              }
            }
          `}</style>
          <div className="harvesting-steps-grid">
            {steps.map((step) => {
              const IconComp = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-3 rounded-xl transition-colors flex flex-col justify-between min-w-0"
                  style={{
                    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.45)' : '#F9FAFB',
                    border: isDark ? '1px solid rgba(55, 65, 81, 0.4)' : '1px solid #E5E7EB',
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-start gap-2.5 mb-2 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold mt-0.5"
                        style={{
                          backgroundColor: step.bgColor,
                          color: step.color,
                        }}
                      >
                        <IconComp size={16} strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-xs font-bold leading-tight"
                          style={{
                            color: 'var(--t)',
                            overflowWrap: 'anywhere',
                            wordBreak: 'normal',
                          }}
                        >
                          {step.title}
                        </div>
                        <div
                          className="text-[10px] uppercase font-semibold text-gray-500 dark:text-gray-400 leading-tight mt-0.5"
                          style={{
                            overflowWrap: 'anywhere',
                            wordBreak: 'normal',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {step.subtitle}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

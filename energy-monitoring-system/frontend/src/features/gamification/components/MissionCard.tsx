import { Clock, Zap, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import type { Mission } from '@/types';

interface MissionCardProps {
  mission: Mission;
  index: number;
  onSelect: (mission: Mission) => void;
}

export function MissionCard({ mission, index, onSelect }: MissionCardProps) {
  const isCompleted = mission.isCompleted;

  return (
    <div
      onClick={() => onSelect(mission)}
      className="cd group relative flex flex-col justify-between overflow-hidden transition-all duration-200 cursor-pointer h-full"
      style={{
        borderRadius: '18px',
        padding: '18px 20px',
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
      }}
    >
      {/* Top row: Mission badge & XP */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold"
              style={{
                backgroundColor: 'var(--mint)',
                color: '#087A3A',
              }}
            >
              0{index + 1}
            </span>
            <span
              className="lb"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                color: 'var(--mu)',
              }}
            >
              Mission
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isCompleted ? (
              <span
                className="pill inline-flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--mint)',
                  color: '#087A3A',
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed
              </span>
            ) : (
              <span
                className="pill inline-flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--soft)',
                  color: 'var(--mu)',
                }}
              >
                Available
              </span>
            )}

            <span
              className="pill inline-flex items-center gap-1"
              style={{
                backgroundColor: 'rgba(25, 212, 106, 0.16)',
                color: '#087A3A',
              }}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              +{mission.xpReward} XP
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <h3
          className="font-bold transition-colors leading-snug"
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--t)',
          }}
        >
          {mission.title}
        </h3>
        <p className="sub text-xs font-medium mt-0.5" style={{ color: 'var(--mu)', fontSize: '13px' }}>
          {mission.subtitle}
        </p>
        <p
          className="mt-2.5 line-clamp-3"
          style={{
            fontSize: '14px',
            lineHeight: 1.75,
            color: 'var(--mu)',
          }}
        >
          {mission.description}
        </p>
      </div>

      {/* Bottom meta & action button */}
      <div
        className="mc-footer pt-4 mt-auto flex items-center justify-between gap-3"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <div className="mc-meta flex items-center gap-2 text-xs whitespace-nowrap" style={{ color: 'var(--mu)' }}>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>{mission.estimatedMinutes} min</span>
          </span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <HelpCircle className="w-4 h-4 flex-shrink-0" />
            <span>{mission.questionCount || 5} Qs</span>
          </span>
        </div>

        <button
          type="button"
          className="mc-action-btn inline-flex items-center justify-center gap-1.5 transition-all flex-none whitespace-nowrap"
          style={{
            height: '44px',
            padding: '0 16px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 600,
            backgroundColor: isCompleted ? 'var(--mint)' : '#19D46A',
            color: isCompleted ? '#087A3A' : '#0D1B14',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span>{isCompleted ? 'Review & Quiz' : 'Start Mission'}</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
        </button>
      </div>
    </div>
  );
}

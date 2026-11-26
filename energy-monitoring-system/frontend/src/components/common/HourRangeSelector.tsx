import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Clock, X } from 'lucide-react';

export interface HourRange {
  startHour: number;
  endHour: number;
}

interface HourRangeSelectorProps {
  value: HourRange | null;
  onChange: (next: HourRange | null) => void;
  label?: string;
  compact?: boolean;
  align?: 'left' | 'right';
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => {
  const period = hour < 12 ? 'AM' : 'PM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return {
    value: hour,
    label: `${h12}:00 ${period}`,
    shortLabel: `${h12}${period}`,
  };
});

export function formatHourShort(hour: number): string {
  const opt = HOUR_OPTIONS[hour];
  return opt ? opt.shortLabel : `${hour}:00`;
}

export function formatHourRangeLabel(range: HourRange | null): string {
  if (!range) return 'All Hours';
  if (range.startHour === 0 && range.endHour === 23) return 'All Hours';
  if (range.startHour === range.endHour) {
    return `${formatHourShort(range.startHour)} only`;
  }
  return `${formatHourShort(range.startHour)} – ${formatHourShort(range.endHour)}`;
}

const PRESETS: Array<{ label: string; range: HourRange | null }> = [
  { label: 'All Day', range: null },
  { label: 'Morning (6AM–12PM)', range: { startHour: 6, endHour: 11 } },
  { label: 'Afternoon (12PM–6PM)', range: { startHour: 12, endHour: 17 } },
  { label: 'Evening (6PM–12AM)', range: { startHour: 18, endHour: 23 } },
];

/**
 * Compact, reusable From-Hour to To-Hour selector.
 * Matches EcoStep's flat dropdown styling with zero pill clutter.
 */
export function HourRangeSelector({
  value,
  onChange,
  label,
  compact = true,
  align = 'right',
}: HourRangeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isActive = Boolean(
    value && !(value.startHour === 0 && value.endHour === 23),
  );
  const startHour = value?.startHour ?? 0;
  const endHour = value?.endHour ?? 23;

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = 264;
    const margin = 12;
    const rawLeft = align === 'right' ? rect.right - popoverWidth : rect.left;
    const clampedLeft = Math.max(
      margin,
      Math.min(rawLeft, window.innerWidth - popoverWidth - margin),
    );
    const top = Math.min(rect.bottom + 6, window.innerHeight - 220);
    setPopoverPos({ top: Math.max(margin, top), left: clampedLeft });
  }, [align]);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open, updatePosition]);

  const handleStartChange = (nextStart: number) => {
    onChange({ startHour: nextStart, endHour });
  };

  const handleEndChange = (nextEnd: number) => {
    onChange({ startHour, endHour: nextEnd });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="Filter by hour range"
        className={`inline-flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
          compact ? 'px-2.5 py-1.5' : 'px-3 py-2'
        } ${
          isActive
            ? 'border-[var(--acc)] bg-[var(--acc)]/10 text-[var(--t)]'
            : 'border-[var(--line)] bg-[var(--panel)] text-[var(--t)] hover:border-[var(--acc)]/60'
        }`}
      >
        <Clock
          className={`w-3.5 h-3.5 shrink-0 ${
            isActive ? 'text-[var(--acc)]' : 'text-[var(--mu)]'
          }`}
        />
        <span>
          {label ? `${label}: ` : ''}
          {formatHourRangeLabel(value)}
        </span>
        {isActive && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear hour filter"
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClear(e as unknown as React.MouseEvent);
              }
            }}
            className="ml-0.5 p-0.5 rounded hover:bg-[var(--soft)] text-[var(--mu)] hover:text-[var(--t)]"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {open &&
        popoverPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
              zIndex: 9999,
            }}
            className="w-[264px] rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3.5 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mu)]">
                Hour Range (PHT)
              </span>
              {isActive && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="text-[11px] font-medium text-[var(--acc)] hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10.5px] font-medium text-[var(--mu)] mb-1">
                  From Hour
                </label>
                <select
                  aria-label="From hour"
                  value={startHour}
                  onChange={(e) => handleStartChange(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-lg text-xs font-medium border border-[var(--line)] bg-[var(--card-bg)] text-[var(--t)] focus:outline-none focus:border-[var(--acc)] cursor-pointer"
                >
                  {HOUR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] font-medium text-[var(--mu)] mb-1">
                  To Hour
                </label>
                <select
                  aria-label="To hour"
                  value={endHour}
                  onChange={(e) => handleEndChange(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-lg text-xs font-medium border border-[var(--line)] bg-[var(--card-bg)] text-[var(--t)] focus:outline-none focus:border-[var(--acc)] cursor-pointer"
                >
                  {HOUR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--line)] grid grid-cols-2 gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onChange(preset.range);
                    setOpen(false);
                  }}
                  className="px-2 py-1 rounded-md text-[11px] font-medium border border-[var(--line)] bg-[var(--card-bg)] text-[var(--mu)] hover:text-[var(--t)] hover:border-[var(--acc)]/50 transition-colors cursor-pointer text-left truncate"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

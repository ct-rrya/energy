import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Zap, Footprints, X, Award } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import type { MilestoneItem } from '../types/milestone.types';
import { formatMWh, formatWhFromMWh } from '../utils/milestone.utils';
import { getCompanionCommentary } from '../utils/companionCommentary';

interface MilestoneCelebrationModalProps {
  milestone: MilestoneItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MilestoneCelebrationModal({
  milestone,
  isOpen,
  onClose,
}: MilestoneCelebrationModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Lock body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Particle celebration canvas effect
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      life: number;
      maxLife: number;
      spin: number;
      angle: number;
    }> = [];

    const colors = ['#19D46A', '#3DDC97', '#F59E0B', '#38BDF8', '#10B981', '#FCD34D'];

    // Resize canvas
    const updateSize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 500;
      canvas.height = canvas.parentElement?.clientHeight || 400;
    };
    updateSize();

    // Spawn celebratory spark particles
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      particles.push({
        x: canvas.width / 2,
        y: canvas.height * 0.35,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Upward arc
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 60 + Math.random() * 40,
        spin: (Math.random() - 0.5) * 0.2,
        angle: Math.random() * Math.PI,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // Gravity
        p.vx *= 0.98; // Air friction
        p.life += 1;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        p.angle += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        // Draw diamond spark
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.6, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.6, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      });

      if (particles.some((p) => p.life < p.maxLife)) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen]);

  if (!isOpen || !milestone) return null;

  const companionRemark = getCompanionCommentary({
    id: milestone.id,
    label: milestone.label,
    weekNumber: milestone.weekNumber,
    state: milestone.state,
    isAchieved: true,
    progressPercentage: Math.max(100, milestone.progressPercentage || 100),
    currentMWh: milestone.currentMWh,
    targetMWh: milestone.targetMWh,
    stepCount: milestone.stepCount,
  });

  const modalElement = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto"
      style={{
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.38)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${milestone.label} Milestone Achieved`}
    >
      {/* Clickable Backdrop Dismiss Overlay */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[460px] rounded-[22px] overflow-hidden border shadow-2xl p-4 sm:p-5 my-auto bg-[var(--panel)] border-[var(--line)] text-[var(--t)] max-h-[92vh] flex flex-col justify-between">
        {/* Celebration canvas particles */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-1.5 rounded-full text-[var(--mu)] hover:text-[var(--t)] bg-[var(--soft)] hover:bg-[var(--mint)] transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="relative z-20 flex flex-col items-center text-center">
          <div className="relative mb-2">
            <div className="absolute inset-0 rounded-full bg-emerald-500/25 blur-lg animate-pulse" />
            <div
              className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-emerald-500 bg-emerald-500/15"
              style={{
                boxShadow: '0 0 20px rgba(25, 212, 106, 0.35)',
              }}
            >
              <Award className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 rounded-full p-0.5 border-2 border-[var(--panel)] shadow-sm">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-[var(--acc)] bg-[var(--mint)] border border-[var(--line)] mb-1 shadow-sm">
            <Zap className="w-3 h-3 text-[var(--acc)]" />
            ENERGY MILESTONE ACHIEVED
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-[var(--t)] tracking-tight">
            {milestone.label} Milestone Crushed!
          </h3>

          <p className="text-xs text-[var(--mu)] mt-0.5 max-w-sm">
            Target reached: <span className="font-semibold text-[var(--t)]">{formatMWh(milestone.targetMWh)} mWh</span> ({formatWhFromMWh(milestone.targetMWh)} Wh)
          </p>
        </div>

        {/* Stats & Equivalents Grid - Compact */}
        <div className="relative z-20 mt-3 space-y-2">
          {/* Energy & Footsteps banner */}
          <div className="grid grid-cols-2 gap-2">
            <div className="py-2 px-3 rounded-xl bg-[var(--soft)] border border-[var(--line)] text-center">
              <span className="text-[10px] font-semibold text-[var(--mu)] uppercase tracking-wider block mb-0.5">Energy Harvested</span>
              <span
                className="text-base sm:text-lg font-[500] tracking-[-0.02em] tabular-nums text-[var(--acc)] block"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {formatMWh(milestone.currentMWh)} mWh
              </span>
              <span
                className="text-[10px] text-[var(--mu)] block mt-0.5 font-[500] tracking-[-0.02em] tabular-nums"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                ({formatWhFromMWh(milestone.currentMWh)} Wh)
              </span>
            </div>

            <div className="py-2 px-3 rounded-xl bg-[var(--soft)] border border-[var(--line)] text-center">
              <span className="text-[10px] font-semibold text-[var(--mu)] uppercase tracking-wider block mb-0.5">Footsteps Count</span>
              <span
                className="text-base sm:text-lg font-[500] tracking-[-0.02em] tabular-nums text-cyan-600 dark:text-cyan-400 flex items-center justify-center gap-1"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <Footprints className="w-3.5 h-3.5" />
                {milestone.stepCount.toLocaleString()}
              </span>
              <span className="text-[10px] text-[var(--mu)] block mt-0.5">Physical Steps</span>
            </div>
          </div>

          {/* Campus Companion Insight Card */}
          <div className="py-2.5 px-3 rounded-xl bg-[var(--soft)] border border-[var(--line)] flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[10px] font-bold text-[var(--acc)] uppercase tracking-wider">
                Companion Note
              </span>
              <p className="m-0 text-xs text-[var(--t)] font-medium leading-snug">
                {companionRemark.headline}
              </p>
              <p className="m-0 text-[10px] text-[var(--mu)] leading-tight tabular-nums">
                {companionRemark.subtext}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="relative z-20 mt-3.5 flex gap-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white dark:text-black bg-[var(--acc)] hover:bg-[var(--brand-mid)] transition-all transform active:scale-95 shadow-md"
          >
            Awesome! Keep Walking
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalElement, document.body);
  }

  return modalElement;
}

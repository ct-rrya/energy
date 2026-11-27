import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Award,
  TrendingUp,
  BarChart3,
  Table,
  FileText,
  MessageSquareHeart,
  Info,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOptionalVisitor } from '@/contexts/VisitorContext';
import { useMaintenance } from '@/contexts/MaintenanceContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ROUTES } from '@/routes/routes.config';

const TOUR_STORAGE_KEY = 'ecostep_visitor_tour_done';

interface TourStep {
  id: string;
  route: string;
  pageBadge: string;
  title: string;
  description: string;
  desktopSelector?: string;
  mobileSelector?: string;
  analyticsView?: 'charts' | 'historical';
  preferredSide?: 'bottom' | 'left' | 'right' | 'center';
  Icon: React.ElementType;
}

const VISITOR_TOUR_STEPS: TourStep[] = [
  {
    id: 'nav-central',
    route: ROUTES.DASHBOARD,
    pageBadge: 'Navigation · Central',
    title: 'Central Dashboard',
    description:
      'Start here anytime to monitor live campus footstep power, today’s harvested energy, step counts, and tile status in real time.',
    desktopSelector: '[data-tour="nav-desktop-central"]',
    mobileSelector: '[data-tour="nav-mobile-central"]',
    preferredSide: 'right',
    Icon: Activity,
  },
  {
    id: 'central-milestone',
    route: ROUTES.DASHBOARD,
    pageBadge: 'Central · Milestones',
    title: 'Campus Energy Milestones',
    description:
      'Every footstep on the piezoelectric floor mat adds up toward our weekly and monthly campus energy goals. Track live milestone progress right here.',
    desktopSelector: '[data-tour="central-milestone"]',
    mobileSelector: '[data-tour="central-milestone"]',
    preferredSide: 'bottom',
    Icon: Award,
  },
  {
    id: 'nav-analytics',
    route: ROUTES.ANALYTICS,
    pageBadge: 'Navigation · Analytics',
    title: 'Analytics & Insights',
    description:
      'Open Analytics to explore deeper energy patterns, peak campus foot-traffic hours, and historical sensor logs.',
    desktopSelector: '[data-tour="nav-desktop-analytics"]',
    mobileSelector: '[data-tour="nav-mobile-analytics"]',
    analyticsView: 'charts',
    preferredSide: 'right',
    Icon: TrendingUp,
  },
  {
    id: 'analytics-charts',
    route: ROUTES.ANALYTICS,
    pageBadge: 'Analytics · Chart View',
    title: 'Visual Energy Charts',
    description:
      'Chart View displays interactive graphs of power generation, footstep counts, voltage, and energy trends across any time period.',
    desktopSelector: '[data-tour="analytics-first-chart"]',
    mobileSelector: '[data-tour="analytics-first-chart"]',
    analyticsView: 'charts',
    preferredSide: 'right',
    Icon: BarChart3,
  },
  {
    id: 'analytics-historical',
    route: ROUTES.ANALYTICS,
    pageBadge: 'Analytics · Historical View',
    title: 'Historical Data Table',
    description:
      'Historical View organizes all recorded daily and hourly energy readings, voltages, and step totals into a clean table you can filter anytime.',
    desktopSelector: '[data-tour="analytics-historical-table"]',
    mobileSelector: '[data-tour="analytics-historical-table"]',
    analyticsView: 'historical',
    preferredSide: 'bottom',
    Icon: Table,
  },
  {
    id: 'nav-reports',
    route: ROUTES.REPORTS,
    pageBadge: 'Navigation · Reports',
    title: 'Campus Energy Reports',
    description:
      'Visit Reports to browse previously generated energy summaries or compile a fresh report for any date range.',
    desktopSelector: '[data-tour="nav-desktop-reports"]',
    mobileSelector: '[data-tour="nav-mobile-reports"]',
    preferredSide: 'right',
    Icon: FileText,
  },
  {
    id: 'reports-generate',
    route: ROUTES.REPORTS,
    pageBadge: 'Reports · Export',
    title: 'Generate a New Report',
    description:
      'Click Generate Report to create and download a formatted PDF or CSV summary of EcoStep footstep energy and tile performance.',
    desktopSelector: '[data-tour="reports-generate-btn"]',
    mobileSelector: '[data-tour="reports-generate-btn"]',
    preferredSide: 'bottom',
    Icon: FileText,
  },
  {
    id: 'nav-ecommunity',
    route: ROUTES.FEEDBACK,
    pageBadge: 'Navigation · ECommunity',
    title: 'ECommunity Board',
    description:
      'ECommunity is our public Q&A and feedback board where students and staff share ideas, reviews, and tile issue reports.',
    desktopSelector: '[data-tour="nav-desktop-ecommunity"]',
    mobileSelector: '[data-tour="nav-mobile-ecommunity"]',
    preferredSide: 'right',
    Icon: MessageSquareHeart,
  },
  {
    id: 'ecommunity-post',
    route: ROUTES.FEEDBACK,
    pageBadge: 'ECommunity · Post',
    title: 'Ask Questions & Share Ideas',
    description:
      'Use New Post / Ask Question to report a floor tile issue, suggest a feature, or ask a question — no account needed.',
    desktopSelector: '[data-tour="ecommunity-new-post-btn"]',
    mobileSelector: '[data-tour="ecommunity-new-post-btn"]',
    preferredSide: 'bottom',
    Icon: MessageSquareHeart,
  },
  {
    id: 'nav-about',
    route: ROUTES.ABOUT,
    pageBadge: 'Navigation · About',
    title: 'About EcoStep',
    description:
      'Learn how EcoStep’s campus piezoelectric floor mat converts everyday footsteps into measurable clean energy and live sustainability insights.',
    desktopSelector: '[data-tour="nav-desktop-about"]',
    preferredSide: 'right',
    Icon: Info,
  },
  {
    id: 'ecoguide',
    route: ROUTES.ABOUT,
    pageBadge: 'EcoGuide',
    title: 'EcoGuide AI & Direct Admin Chat',
    description:
      'Click EcoGuide anytime to ask our AI assistant about live energy stats, or switch to Message Admin inside the panel for direct campus support.',
    desktopSelector: '[data-tour="ecoguide-rail-label"]',
    mobileSelector: '[data-tour="nav-mobile-ecoguide"]',
    preferredSide: 'left',
    Icon: MessageSquare,
  },
];

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function isTourCompleted(): boolean {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function markTourCompleted(): void {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  } catch {
    // Ignore storage errors
  }
}

/**
 * 7-Step Live Spotlight Onboarding Tour for Public Visitors.
 *
 * - Auto-navigates across Central, Analytics (Chart & Historical), Reports, ECommunity, About, and EcoGuide.
 * - Click anywhere on the page or press Enter / ArrowRight to advance with zero mouse hunting.
 * - Returns visitors back to Central (/dashboard) upon completion.
 */
export function VisitorOnboardingTour() {
  const { isAuthenticated, isLoading } = useAuth();
  const visitor = useOptionalVisitor();
  const { state: maintenanceState } = useMaintenance();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === 'dark';

  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
  );

  const isPublicVisitor = !isLoading && !isAuthenticated;
  const activeStep = VISITOR_TOUR_STEPS[stepIndex];

  // Auto-trigger once after visitor completes/dismisses the welcome nickname modal
  useEffect(() => {
    if (!isPublicVisitor) return;
    if (maintenanceState.enabled) return;
    if (!visitor?.hasCompletedWelcome || visitor.isNicknameModalOpen) return;
    if (isTourCompleted()) return;

    const timer = window.setTimeout(() => {
      setStepIndex(0);
      setIsOpen(true);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [
    isPublicVisitor,
    maintenanceState.enabled,
    visitor?.hasCompletedWelcome,
    visitor?.isNicknameModalOpen,
  ]);

  // Listen for manual replay trigger from user menu
  useEffect(() => {
    if (!isPublicVisitor) return;
    const handleStart = () => {
      if (maintenanceState.enabled) return;
      setStepIndex(0);
      setIsOpen(true);
    };
    window.addEventListener('ecostep:start-tour', handleStart);
    return () => window.removeEventListener('ecostep:start-tour', handleStart);
  }, [isPublicVisitor, maintenanceState.enabled]);

  // Close tour automatically if user logs in or maintenance turns on
  useEffect(() => {
    if (isAuthenticated || maintenanceState.enabled) {
      setIsOpen(false);
    }
  }, [isAuthenticated, maintenanceState.enabled]);

  // Auto-navigate to the step's route and switch Analytics view when needed
  useEffect(() => {
    if (!isOpen || !activeStep) return;

    if (location.pathname !== activeStep.route) {
      navigate(activeStep.route);
    }

    if (activeStep.analyticsView) {
      const dispatchView = () => {
        window.dispatchEvent(
          new CustomEvent('ecostep:analytics-view', {
            detail: { view: activeStep.analyticsView },
          }),
        );
      };
      dispatchView();
      const t1 = window.setTimeout(dispatchView, 160);
      const t2 = window.setTimeout(dispatchView, 420);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
  }, [isOpen, activeStep, location.pathname, navigate]);

  const measureTarget = useCallback(
    (shouldScroll = false): boolean => {
      if (!isOpen || typeof window === 'undefined' || !activeStep) return false;
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      const selector = mobile
        ? activeStep.mobileSelector
        : activeStep.desktopSelector;

      if (!selector) {
        setTargetRect(null);
        return true;
      }

      const el = document.querySelector<HTMLElement>(selector);
      if (!el) {
        setTargetRect(null);
        return false;
      }

      if (shouldScroll) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setTargetRect(null);
        return false;
      }

      // Clamp oversized sections slightly so the spotlight stays cleanly inside the viewport
      const clampedTop = Math.max(8, rect.top);
      const clampedBottom = Math.min(window.innerHeight - 8, rect.bottom);
      const clampedHeight = Math.max(24, clampedBottom - clampedTop);

      setTargetRect({
        top: clampedTop,
        left: rect.left,
        width: rect.width,
        height: clampedHeight,
      });
      return true;
    },
    [isOpen, activeStep],
  );

  // Poll briefly after route change so lazy-loaded pages mount and get spotlighted cleanly
  useEffect(() => {
    if (!isOpen) return;

    let attempts = 0;
    let scrolledOnce = false;

    const tick = () => {
      const found = measureTarget(!scrolledOnce);
      if (found) {
        scrolledOnce = true;
      }
      attempts += 1;
      if (attempts < 18) {
        timerId = window.setTimeout(tick, found ? 180 : 100);
      }
    };

    let timerId = window.setTimeout(tick, 60);

    const onResizeOrScroll = () => {
      measureTarget(false);
    };
    window.addEventListener('resize', onResizeOrScroll);
    window.addEventListener('scroll', onResizeOrScroll, true);

    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener('resize', onResizeOrScroll);
      window.removeEventListener('scroll', onResizeOrScroll, true);
    };
  }, [isOpen, stepIndex, location.pathname, measureTarget]);

  const finishTour = useCallback(
    (returnToDashboard: boolean) => {
      markTourCompleted();
      setIsOpen(false);
      if (returnToDashboard && location.pathname !== ROUTES.DASHBOARD) {
        navigate(ROUTES.DASHBOARD);
      }
    },
    [location.pathname, navigate],
  );

  const handleNext = useCallback(() => {
    if (stepIndex < VISITOR_TOUR_STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      finishTour(true);
    }
  }, [stepIndex, finishTour]);

  const handleBack = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  // Keyboard navigation: Enter / Space / ArrowRight advances; ArrowLeft goes back; Escape skips
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        finishTour(false);
      } else if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBack();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, finishTour, handleNext, handleBack]);

  if (!isOpen || !isPublicVisitor || !activeStep || typeof document === 'undefined') {
    return null;
  }

  const StepIcon = activeStep.Icon;
  const isLast = stepIndex === VISITOR_TOUR_STEPS.length - 1;
  const pad = 8;

  // Compute tooltip card position
  const cardWidth = isMobile ? Math.min(344, window.innerWidth - 24) : 360;
  const cardEstimatedHeight = 235;
  const margin = 14;

  let cardStyle: React.CSSProperties;

  if (!targetRect || activeStep.preferredSide === 'center') {
    cardStyle = {
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: `${cardWidth}px`,
      zIndex: 99982,
    };
  } else if (isMobile) {
    // Place above if target is near bottom, otherwise below the target
    const targetIsBottom = targetRect.top > window.innerHeight * 0.55;
    cardStyle = targetIsBottom
      ? {
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: `${Math.max(84, window.innerHeight - targetRect.top + 18)}px`,
          width: `${cardWidth}px`,
          zIndex: 99982,
        }
      : {
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          top: `${Math.min(
            window.innerHeight - cardEstimatedHeight - 80,
            Math.max(margin, targetRect.top + targetRect.height + 18),
          )}px`,
          width: `${cardWidth}px`,
          zIndex: 99982,
        };
  } else if (activeStep.preferredSide === 'right') {
    const left = Math.min(
      window.innerWidth - cardWidth - margin,
      Math.max(margin, targetRect.left + targetRect.width + 20),
    );
    const top = Math.max(
      margin,
      Math.min(
        window.innerHeight - cardEstimatedHeight - margin,
        targetRect.top + targetRect.height / 2 - cardEstimatedHeight / 2,
      ),
    );
    cardStyle = {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${cardWidth}px`,
      zIndex: 99982,
    };
  } else if (activeStep.preferredSide === 'left') {
    const left = Math.max(margin, targetRect.left - cardWidth - 22);
    const top = Math.max(
      margin,
      Math.min(
        window.innerHeight - cardEstimatedHeight - margin,
        targetRect.top + targetRect.height / 2 - cardEstimatedHeight / 2,
      ),
    );
    cardStyle = {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${cardWidth}px`,
      zIndex: 99982,
    };
  } else {
    // Default desktop placement: below target if room, else above target
    const spaceBelow = window.innerHeight - (targetRect.top + targetRect.height);
    const top =
      spaceBelow >= cardEstimatedHeight + 24
        ? targetRect.top + targetRect.height + 18
        : Math.max(margin, targetRect.top - cardEstimatedHeight - 18);
    const centeredLeft = targetRect.left + targetRect.width / 2 - cardWidth / 2;
    const left = Math.max(
      margin,
      Math.min(window.innerWidth - cardWidth - margin, centeredLeft),
    );
    cardStyle = {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${cardWidth}px`,
      zIndex: 99982,
    };
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`EcoStep tour step ${stepIndex + 1} of ${VISITOR_TOUR_STEPS.length}: ${activeStep.title}`}
      style={{ position: 'fixed', inset: 0, zIndex: 99980 }}
    >
      {/* Full-page click surface: clicking anywhere advances to the next step */}
      <div
        onClick={handleNext}
        title="Click anywhere or press Enter to continue"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: targetRect ? 'transparent' : 'rgba(4, 14, 9, 0.68)',
          cursor: 'pointer',
          zIndex: 99980,
        }}
      />

      {/* Live Spotlight Ring with full-screen cutout shadow */}
      {targetRect && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: `${targetRect.top - pad}px`,
            left: `${targetRect.left - pad}px`,
            width: `${targetRect.width + pad * 2}px`,
            height: `${targetRect.height + pad * 2}px`,
            borderRadius: '14px',
            border: '2px solid #19D46A',
            boxShadow: '0 0 0 9999px rgba(4, 14, 9, 0.68)',
            transition: 'all 240ms cubic-bezier(0.22, 1, 0.36, 1)',
            pointerEvents: 'none',
            zIndex: 99981,
          }}
        />
      )}

      {/* Floating Tour Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...cardStyle,
          backgroundColor: isDark ? '#112218' : '#FFFFFF',
          color: isDark ? '#EAF7EE' : '#0E1F16',
          border: isDark
            ? '1px solid rgba(255, 255, 255, 0.14)'
            : '1px solid rgba(14, 31, 22, 0.12)',
          borderRadius: '16px',
          boxShadow: isDark
            ? '0 20px 48px rgba(0, 0, 0, 0.55)'
            : '0 18px 42px rgba(10, 30, 20, 0.18)',
          padding: '18px 20px',
          transition: 'top 220ms ease, left 220ms ease, bottom 220ms ease',
        }}
      >
        {/* Top Row: Step Badge + Close */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-2 min-w-0">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
              style={{
                backgroundColor: isDark
                  ? 'rgba(25, 212, 106, 0.16)'
                  : 'rgba(25, 212, 106, 0.14)',
                color: isDark ? '#19D46A' : '#0E9F4F',
              }}
            >
              <StepIcon size={15} strokeWidth={2.2} />
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-wider truncate"
              style={{ color: isDark ? '#19D46A' : '#0E9F4F' }}
            >
              {activeStep.pageBadge} · {stepIndex + 1}/{VISITOR_TOUR_STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => finishTour(false)}
            aria-label="Skip tour"
            className="p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
            style={{ color: isDark ? '#93A89C' : '#536A5D' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Title & Description */}
        <h3
          className="text-[16px] font-bold m-0 leading-snug"
          style={{ color: isDark ? '#EAF7EE' : '#0E1F16' }}
        >
          {activeStep.title}
        </h3>
        <p
          className="text-[13px] leading-relaxed mt-1.5 mb-0"
          style={{ color: isDark ? '#A4B9AD' : '#4E6357' }}
        >
          {activeStep.description}
        </p>
        <p
          className="text-[11px] mt-2.5 mb-0 opacity-75"
          style={{ color: isDark ? '#93A89C' : '#536A5D' }}
        >
          Click anywhere or press <strong>Enter</strong> to {isLast ? 'finish' : 'continue'}
        </p>

        {/* Progress Dots + Navigation Controls */}
        <div
          className="mt-3.5 pt-3 flex items-center justify-between gap-2 border-t"
          style={{
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(14, 31, 22, 0.08)',
          }}
        >
          <div className="flex items-center gap-1.5">
            {VISITOR_TOUR_STEPS.map((s, idx) => (
              <span
                key={s.id}
                style={{
                  width: idx === stepIndex ? '16px' : '6px',
                  height: '6px',
                  borderRadius: '999px',
                  backgroundColor:
                    idx === stepIndex
                      ? '#19D46A'
                      : isDark
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(14, 31, 22, 0.18)',
                  transition: 'all 200ms ease',
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                style={{
                  color: isDark ? '#C5D8CD' : '#3A5043',
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(14, 31, 22, 0.05)',
                }}
              >
                <ChevronLeft size={13} />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => finishTour(false)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                style={{ color: isDark ? '#93A89C' : '#536A5D' }}
              >
                Skip
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:opacity-90"
              style={{ backgroundColor: '#19D46A', color: '#0D1B14' }}
            >
              {isLast ? (
                <>
                  <Check size={13} strokeWidth={2.5} />
                  <span>Done</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight size={13} strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

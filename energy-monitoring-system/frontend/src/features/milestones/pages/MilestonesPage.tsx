import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/permissions';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { useSystemHealth } from '@/features/dashboard/hooks/useSystemHealth';
import { useLiveSensorData } from '@/features/dashboard/hooks/useLiveSensorData';
import { MilestonesRoadmap } from '../components/MilestonesRoadmap';
import { AdminMilestonesModal } from '../components/AdminMilestonesModal';
import { useMilestones } from '../hooks/useMilestones';
import { ChevronLeft, ChevronRight, Settings2, Calendar, AlertTriangle, Lock } from 'lucide-react';

export function MilestonesPage() {
  const { user, isAuthenticated } = useAuth();
  const isAdminUser = isAdmin(isAuthenticated, user);
  const isPublicUser = !isAdminUser;

  const { data: systemStatusData } = useSystemHealth();
  const { isConnected: isWebSocketConnected } = useLiveSensorData();

  const systemStatus = (() => {
    if (systemStatusData?.database === 'connected') return 'connected' as const;
    if (systemStatusData?.database === 'disconnected') return 'disconnected' as const;
    return 'unknown' as const;
  })();

  const milestoneData = useMilestones();
  const {
    selectedMonth,
    setSelectedMonth,
    monthLabel,
    availableMonths,
    currentMonth,
    monthlyMilestone,
    weeklyMilestones,
    configurationPolicy,
    isLocked,
    status,
    deadlineLabel,
    overdueMonths,
    updateTargets,
  } = milestoneData;

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const currentIdx = selectedMonth ? availableMonths.indexOf(selectedMonth) : -1;
  const canGoPrev = currentIdx > 0;
  const canGoNext = currentIdx >= 0 && currentIdx < availableMonths.length - 1;

  // Identify if another month is overdue while viewing this month
  const otherOverdueMonths = overdueMonths.filter((m) => m !== selectedMonth);

  return (
    <div className="page font-sans space-y-4">
      {/* Established Header matching Central and Analytics */}
      <DashboardHeader
        greeting="Calendar Goals"
        title="Energy Milestones"
        subtitle="Weekly kinetic energy goals and prototype milestone tracking."
        systemStatus={systemStatus}
        isPublicUser={isPublicUser}
        isWebSocketConnected={isWebSocketConnected}
      />

      {/* Admin Overdue Goal Configuration Reminder Banners */}
      {isAdminUser && status === 'OVERDUE' && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-700 dark:text-red-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight">
                Milestone Goal Configuration Overdue ({monthLabel})
              </div>
              <p className="text-xs text-red-600/90 dark:text-red-300/90 mt-0.5 leading-relaxed">
                Monthly and weekly energy targets were due by the 2nd day of the month ({deadlineLabel || 'Asia/Manila'}). Milestone evaluations and achievements remain on hold until targets are configured.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAdminModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm shrink-0 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Configure Targets Now
          </button>
        </div>
      )}

      {/* Notice for other overdue months if viewing a different month */}
      {isAdminUser && status !== 'OVERDUE' && otherOverdueMonths.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Action Needed:</strong> {otherOverdueMonths.length} month(s) have overdue milestone goals ({otherOverdueMonths.join(', ')}).
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedMonth(otherOverdueMonths[0]);
              setIsAdminModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors shrink-0"
          >
            Configure {otherOverdueMonths[0]}
          </button>
        </div>
      )}

      {/* Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 -mt-2">
        {/* Month Selector Pill */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-[var(--panel)] border border-[var(--line)] rounded-full p-1 shadow-sm">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => canGoPrev && setSelectedMonth(availableMonths[currentIdx - 1])}
              disabled={!canGoPrev}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--t)] hover:bg-[var(--soft)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2 select-none">
              <Calendar className="w-3.5 h-3.5 text-[var(--acc)] opacity-80" />
              <span className="min-w-[100px] sm:min-w-[115px] text-center text-xs sm:text-sm font-semibold font-sans text-[var(--t)]">
                {monthLabel}
              </span>
            </div>

            <button
              type="button"
              aria-label="Next month"
              onClick={() => canGoNext && setSelectedMonth(availableMonths[currentIdx + 1])}
              disabled={!canGoNext}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--t)] hover:bg-[var(--soft)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {selectedMonth === currentMonth && (
            <span className="pill text-[10px] font-bold">
              CURRENT MONTH
            </span>
          )}

          {isAdminUser && isLocked && (
            <span className="pill text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              TARGETS LOCKED
            </span>
          )}
        </div>

        {/* Admin Configure Targets Button */}
        {isAdminUser && (
          <button
            type="button"
            onClick={() => setIsAdminModalOpen(true)}
            className={`self-start sm:self-auto min-h-[34px] px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm ${
              status === 'OVERDUE'
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-[var(--acc)] text-white hover:bg-[var(--acc)]/90'
            }`}
            title="Configure monthly and weekly targets"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{isLocked ? 'View / Adjust Targets' : 'Configure Targets'}</span>
          </button>
        )}
      </div>

      {/* Unified Hero Milestone Canvas Card + Selected Week Inspector Card */}
      <MilestonesRoadmap
        selectedMonth={selectedMonth}
        milestoneData={milestoneData}
        isAdmin={isAdminUser}
      />

      {/* Admin Milestone Target Configuration Modal */}
      {isAdminUser && (
        <AdminMilestonesModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          activeMonth={selectedMonth}
          availableMonths={availableMonths}
          currentMonthTargetMWh={monthlyMilestone?.targetMWh ?? 0.1}
          currentWeeklyTargetMWh={weeklyMilestones[0]?.targetMWh ?? 0.025}
          configurationPolicy={configurationPolicy}
          onSave={async (payload) => {
            await updateTargets(payload);
          }}
        />
      )}
    </div>
  );
}

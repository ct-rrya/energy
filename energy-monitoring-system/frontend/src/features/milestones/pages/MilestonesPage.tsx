import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/permissions';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { useSystemHealth } from '@/features/dashboard/hooks/useSystemHealth';
import { useLiveSensorData } from '@/features/dashboard/hooks/useLiveSensorData';
import { MilestonesRoadmap } from '../components/MilestonesRoadmap';
import { AdminMilestonesModal } from '../components/AdminMilestonesModal';
import { useMilestones } from '../hooks/useMilestones';
import { ChevronLeft, ChevronRight, Settings2, Calendar } from 'lucide-react';

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
    updateTargets,
  } = milestoneData;

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const currentIdx = selectedMonth ? availableMonths.indexOf(selectedMonth) : -1;
  const canGoPrev = currentIdx > 0;
  const canGoNext = currentIdx >= 0 && currentIdx < availableMonths.length - 1;

  return (
    <div className="page font-sans">
      {/* Established Header matching Central and Analytics */}
      <DashboardHeader
        greeting="Calendar Goals"
        title="Energy Milestones"
        subtitle="Weekly kinetic energy goals and prototype milestone tracking."
        systemStatus={systemStatus}
        isPublicUser={isPublicUser}
        isWebSocketConnected={isWebSocketConnected}
      />

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
        </div>

        {/* Admin Configure Targets Button */}
        {isAdminUser && (
          <button
            type="button"
            onClick={() => setIsAdminModalOpen(true)}
            className="self-start sm:self-auto min-h-[34px] px-3.5 rounded-full text-xs font-semibold bg-[var(--acc)] text-white hover:bg-[var(--acc)]/90 flex items-center gap-1.5 transition-colors shadow-sm"
            title="Configure monthly and weekly targets"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Configure Targets</span>
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
          onSave={async (payload) => {
            await updateTargets(payload);
          }}
        />
      )}
    </div>
  );
}

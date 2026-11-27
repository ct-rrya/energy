import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Activity, PlayCircle, TrendingDown } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useHardwareStatus } from '@/contexts/HardwareStatusContext';
import { useDiagnosticInsights } from '../hooks/useDiagnostics';
import { HardwarePipelineCard } from '../components/HardwarePipelineCard';
import { DiagnosticWorkbenchCard } from '../components/DiagnosticWorkbenchCard';
import { FatigueDriftRadarCard } from '../components/FatigueDriftRadarCard';
import { DiagnosticHistoryTable } from '../components/DiagnosticHistoryTable';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { Dialog } from '@/components/ui/Dialog';

type DiagnosticsTab = 'health' | 'test' | 'wear';

/**
 * Diagnostics Page Component (EcoStep Tile Health Workbench)
 * 
 * Admin-only hardware diagnostics suite powered purely by existing ESP32 telemetry:
 * 1. Live Hardware Pipeline Schematic + Electrical Fault-Signature Diagnosis + 0-100 Health Score
 * 2. Guided Multi-Sample Bench Test (WebSocket + BLE + Manual/Sim) & BLE Field Check
 * 3. Passive 7-Day vs 30-Day Fatigue & Drift Radar
 * 4. On-demand Verification History & CSV Export modal (opened via History button)
 */
export function DiagnosticsPage() {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { status: hardwareConnectionStatus } = useHardwareStatus();
  const { data: insights, isLoading: insightsLoading } = useDiagnosticInsights();
  const [activeTab, setActiveTab] = useState<DiagnosticsTab>('health');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Listen for WebSocket events to keep all diagnostic cards live
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleConfigUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'baseline'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'referenceConfig'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'insights'] });
    };

    const handleTestCompleted = () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'baseline'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'insights'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'dailyTask'] });
    };

    const handleDailyTaskUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'dailyTask'] });
    };

    const handleDailyReminder = () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'dailyTask'] });
    };

    const handleNewReading = () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'insights'] });
    };

    socket.on('diagnostic:config-updated', handleConfigUpdate);
    socket.on('diagnostic:test-completed', handleTestCompleted);
    socket.on('diagnostic:step-tested', handleTestCompleted);
    socket.on('diagnostic:daily-task-updated', handleDailyTaskUpdated);
    socket.on('diagnostic:daily-task-completed', handleTestCompleted);
    socket.on('diagnostic:daily-reminder', handleDailyReminder);
    socket.on('reading:new', handleNewReading);

    return () => {
      socket.off('diagnostic:config-updated', handleConfigUpdate);
      socket.off('diagnostic:test-completed', handleTestCompleted);
      socket.off('diagnostic:step-tested', handleTestCompleted);
      socket.off('diagnostic:daily-task-updated', handleDailyTaskUpdated);
      socket.off('diagnostic:daily-task-completed', handleTestCompleted);
      socket.off('diagnostic:daily-reminder', handleDailyReminder);
      socket.off('reading:new', handleNewReading);
    };
  }, [socket, isConnected, queryClient]);

  const handleJumpToBench = () => {
    setActiveTab('test');
  };

  const tabs: Array<{
    id: DiagnosticsTab;
    label: string;
    Icon: typeof Activity;
  }> = [
    { id: 'health', label: 'Tile Health', Icon: Activity },
    { id: 'test', label: 'Step Test', Icon: PlayCircle },
    { id: 'wear', label: 'Wear Over Time', Icon: TrendingDown },
  ];

  return (
    <div className="page" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <DashboardHeader
        greeting="Tile health"
        title="Tile Performance Diagnostics"
        subtitle="Check tile health, run a quick step test, and spot wiring or wear issues early"
        systemStatus={hardwareConnectionStatus}
      />

      {/* Connected Record-Folder Tabs + Single Sheet */}
      <div>
        <div
          className="flex flex-nowrap overflow-x-auto items-end gap-1 max-w-full no-scrollbar"
          role="tablist"
          aria-label="Diagnostics sections"
        >
          {tabs.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(id)}
                className={`relative px-3.5 sm:px-4 py-2.5 text-xs sm:text-[13px] font-semibold rounded-t-xl border-t border-x transition-all cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[var(--card-bg)] text-[var(--t)] border-[var(--line)] -mb-px z-10 pb-3'
                    : 'bg-transparent text-[var(--mu)] border-transparent hover:text-[var(--t)] hover:bg-[var(--card-bg)]/50'
                }`}
              >
                {isActive && (
                  <span
                    className="absolute top-0 left-3 right-3 h-[2.5px] rounded-b-full bg-[var(--acc)]"
                    aria-hidden="true"
                  />
                )}
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[var(--acc)]' : ''}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <section
          role="tabpanel"
          className="rounded-b-2xl rounded-tr-2xl border border-[var(--line)] bg-[var(--card-bg)] px-4 sm:px-6 py-2"
        >
          {activeTab === 'health' && (
            <HardwarePipelineCard
              insights={insights}
              isLoading={insightsLoading}
              onJumpToBench={handleJumpToBench}
            />
          )}

          {activeTab === 'test' && (
            <div className="py-4">
              <DiagnosticWorkbenchCard onOpenHistory={() => setIsHistoryOpen(true)} />
            </div>
          )}

          {activeTab === 'wear' && (
            <FatigueDriftRadarCard
              radar={insights?.fatigueRadar}
              isLoading={insightsLoading}
            />
          )}
        </section>
      </div>

      {/* On-demand Verification History & CSV Export Modal */}
      <Dialog
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title="Verification History & Logs"
        size="xl"
      >
        <DiagnosticHistoryTable />
      </Dialog>
    </div>
  );
}

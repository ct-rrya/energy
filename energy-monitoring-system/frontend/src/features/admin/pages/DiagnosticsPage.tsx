import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/contexts/SocketContext';
import { DiagnosticHistoryTable } from '../components/DiagnosticHistoryTable';
import { StepDiagnosticTestCard } from '../components/StepDiagnosticTestCard';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';

/**
 * Diagnostics Page Component
 * 
 * Main page for piezoelectric tile diagnostics and health verification.
 * Clean, modern layout matching the design reference:
 * - Header with Tile health category, real-time date/time, and online status
 * - Today's on-demand physical step verification & baseline distribution scale
 * - Diagnostic verification history with grouped overdue logs and CSV export
 * - Bottom explanation of 30-day statistical baseline protection
 */
export function DiagnosticsPage() {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  // Listen for WebSocket events
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handle reference config / baseline updates
    const handleConfigUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'baseline'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'referenceConfig'] });
    };

    // Handle diagnostic test completion
    const handleTestCompleted = () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'baseline'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'dailyTask'] });
    };

    // Handle daily task updates (status changes, lock acquisition/release)
    const handleDailyTaskUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'dailyTask'] });
    };

    // Handle daily reminder received
    const handleDailyReminder = () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'dailyTask'] });
    };

    // Subscribe to events
    socket.on('diagnostic:config-updated', handleConfigUpdate);
    socket.on('diagnostic:test-completed', handleTestCompleted);
    socket.on('diagnostic:step-tested', handleTestCompleted);
    socket.on('diagnostic:daily-task-updated', handleDailyTaskUpdated);
    socket.on('diagnostic:daily-task-completed', handleTestCompleted);
    socket.on('diagnostic:daily-reminder', handleDailyReminder);

    // Cleanup
    return () => {
      socket.off('diagnostic:config-updated', handleConfigUpdate);
      socket.off('diagnostic:test-completed', handleTestCompleted);
      socket.off('diagnostic:step-tested', handleTestCompleted);
      socket.off('diagnostic:daily-task-updated', handleDailyTaskUpdated);
      socket.off('diagnostic:daily-task-completed', handleTestCompleted);
      socket.off('diagnostic:daily-reminder', handleDailyReminder);
    };
  }, [socket, isConnected, queryClient]);

  return (
    <div className="page" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Page Header matching mockup */}
      <DashboardHeader
        greeting="Tile health"
        title="Tile Performance Diagnostics"
        subtitle="Health check for your piezoelectric footstep tile"
        systemStatus={isConnected ? 'connected' : 'disconnected'}
        isWebSocketConnected={isConnected}
      />

      {/* Main Content Stack: Today Card + History Card + Bottom Note */}
      <div className="flex flex-col gap-6">
        {/* Section 1: Today's Daily Verification & Baseline Card */}
        <StepDiagnosticTestCard />

        {/* Section 2: History & Verification Logs Card */}
        <DiagnosticHistoryTable />

        {/* Section 3: Clean Footnote */}
        <p className="m-0 px-2 text-[14px] leading-[1.6] text-[var(--mu)] max-w-[740px]">
          Each test compares one step’s output with your 30-day baseline to catch hardware degradation, loose wiring or tile fatigue. There is one shared task per day, and any authorized administrator can run it.
        </p>
      </div>
    </div>
  );
}

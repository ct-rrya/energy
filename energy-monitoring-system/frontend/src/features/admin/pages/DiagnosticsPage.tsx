import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/contexts/SocketContext';
import { useHardwareStatus } from '@/contexts/HardwareStatusContext';
import { useDiagnosticInsights } from '../hooks/useDiagnostics';
import { HardwarePipelineCard } from '../components/HardwarePipelineCard';
import { DiagnosticWorkbenchCard } from '../components/DiagnosticWorkbenchCard';
import { FatigueDriftRadarCard } from '../components/FatigueDriftRadarCard';
import { DiagnosticHistoryTable } from '../components/DiagnosticHistoryTable';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { Dialog } from '@/components/ui/Dialog';

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
    const el = document.getElementById('diagnostic-workbench');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="page" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <DashboardHeader
        greeting="Tile health"
        title="Tile Performance Diagnostics"
        subtitle="Check tile health, run a quick step test, and spot wiring or wear issues early"
        systemStatus={hardwareConnectionStatus}
      />

      <div className="flex flex-col gap-6">
        {/* Section 1: Hardware Pipeline Schematic + Fault-Signature Diagnosis + Health Score */}
        <HardwarePipelineCard
          insights={insights}
          isLoading={insightsLoading}
          onJumpToBench={handleJumpToBench}
        />

        {/* Section 2: Guided Multi-Sample Bench Test + Baseline Band + BLE Field Check */}
        <DiagnosticWorkbenchCard onOpenHistory={() => setIsHistoryOpen(true)} />

        {/* Section 3: Passive 7-Day vs 30-Day Fatigue & Drift Radar */}
        <FatigueDriftRadarCard
          radar={insights?.fatigueRadar}
          isLoading={insightsLoading}
        />
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

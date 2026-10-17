import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useTheme } from '@/contexts/ThemeContext';
import { DiagnosticHistoryTable } from '../components/DiagnosticHistoryTable';
import { StepDiagnosticTestCard } from '../components/StepDiagnosticTestCard';
import { getThemeColors, TYPOGRAPHY } from '@/lib/theme';

/**
 * Diagnostics Page Component
 * 
 * Main page for system diagnostics functionality.
 * Features:
 * - Automatic 30-day historical baseline calculation
 * - On-demand single-step footstep test mode (live hardware capture or quick simulation)
 * - Visual distribution scale with deviation analysis
 * - Historical verification log
 * - Real-time WebSocket updates
 */
export function DiagnosticsPage() {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  // Listen for WebSocket events
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handle reference config / baseline updates
    const handleConfigUpdate = () => {
      console.log('🔧 Diagnostic baseline updated via WebSocket');
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'baseline'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'referenceConfig'] });
    };

    // Handle diagnostic test completion
    const handleTestCompleted = () => {
      console.log('✅ Diagnostic step test completed via WebSocket');
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'baseline'] });
    };

    // Subscribe to events
    socket.on('diagnostic:config-updated', handleConfigUpdate);
    socket.on('diagnostic:test-completed', handleTestCompleted);
    socket.on('diagnostic:step-tested', handleTestCompleted);

    // Cleanup
    return () => {
      socket.off('diagnostic:config-updated', handleConfigUpdate);
      socket.off('diagnostic:test-completed', handleTestCompleted);
      socket.off('diagnostic:step-tested', handleTestCompleted);
    };
  }, [socket, isConnected, queryClient]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.pageBackground }}>
      {/* Page Container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="p-3 rounded-lg" 
              style={{ backgroundColor: colors.accentSubtle }}
            >
              <Activity 
                className="h-6 w-6" 
                style={{ color: colors.accent }} 
              />
            </div>
            <div>
              <h1 
                className="text-2xl sm:text-3xl font-bold"
                style={{ 
                  color: colors.textPrimary,
                  fontWeight: TYPOGRAPHY.fontWeight.bold
                }}
              >
                Tile Performance Diagnostics
              </h1>
            </div>
          </div>
          <p 
            className="text-sm sm:text-base max-w-3xl leading-relaxed"
            style={{ 
              color: colors.textSecondary,
              fontSize: TYPOGRAPHY.fontSize.base
            }}
          >
            On-demand health verification for your piezoelectric footstep tile. Automatically evaluates harvested energy per step against your 30-day historical baseline to detect hardware degradation, loose wiring, or tile fatigue.
          </p>
        </div>

        {/* Content Grid */}
        <div className="space-y-6 lg:space-y-8">
          {/* Step Diagnostic Test Card (Automatic Baseline + On-Demand Single-Step Verification) */}
          <div>
            <StepDiagnosticTestCard />
          </div>

          {/* Diagnostic History Section - Full width */}
          <div>
            <DiagnosticHistoryTable />
          </div>
        </div>

        {/* Info Banner */}
        <div 
          className="mt-8 p-5 sm:p-6 rounded-2xl border transition-all" 
          style={{
            backgroundColor: colors.accentSubtle,
            borderColor: colors.accent + '30'
          }}
        >
          <h4 
            className="text-sm font-bold mb-2 flex items-center gap-2"
            style={{ 
              color: colors.accent,
            }}
          >
            <span>⚡</span>
            <span>About Tile System Diagnostics</span>
          </h4>
          <p 
            className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300"
          >
            System diagnostics provide <strong className="font-semibold text-slate-800 dark:text-slate-100">on-demand, single-tile performance verification</strong>. 
            By continuously analyzing real-world footsteps over the last 30 days, the system establishes a statistical baseline 
            (normal average: <strong className="font-semibold text-slate-800 dark:text-slate-100 tabular-nums">0.00510 mWh/step</strong>, acceptable window: <strong className="font-semibold text-slate-800 dark:text-slate-100 tabular-nums">0.00346 – 0.00674 mWh</strong>).
            When you initiate a test and step on the tile, the system captures the instantaneous telemetry reading, checks for deviation, 
            and confirms whether the tile's piezoelectric discs and energy harvesting circuits are operating within healthy parameters.
          </p>
        </div>
      </div>
    </div>
  );
}

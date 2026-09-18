import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { ReferenceConfigForm } from '../components/ReferenceConfigForm';
import { DiagnosticTestForm } from '../components/DiagnosticTestForm';
import { DiagnosticHistoryTable } from '../components/DiagnosticHistoryTable';

/**
 * Diagnostics Page Component
 * 
 * Main page for system diagnostics functionality.
 * Allows admins to configure reference values, run diagnostic tests,
 * and view historical test results.
 * 
 * Features:
 * - Reference configuration management
 * - Diagnostic test recording
 * - Historical test tracking
 * - Real-time WebSocket updates
 * - Responsive design for mobile/tablet
 */
export function DiagnosticsPage() {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  // Listen for WebSocket events
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handle reference config updates
    const handleConfigUpdate = () => {
      console.log('🔧 Diagnostic config updated via WebSocket');
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'referenceConfig'] });
    };

    // Handle diagnostic test completion
    const handleTestCompleted = () => {
      console.log('✅ Diagnostic test completed via WebSocket');
      queryClient.invalidateQueries({ queryKey: ['diagnostics', 'history'] });
    };

    // Subscribe to events
    socket.on('diagnostic:config-updated', handleConfigUpdate);
    socket.on('diagnostic:test-completed', handleTestCompleted);

    // Cleanup
    return () => {
      socket.off('diagnostic:config-updated', handleConfigUpdate);
      socket.off('diagnostic:test-completed', handleTestCompleted);
    };
  }, [socket, isConnected, queryClient]);

  return (
    <div className="min-h-screen bg-[#F5F6F8] dark:bg-[#0B0D12]">
      {/* Page Container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-[#2FBF71]/10 dark:bg-[#3ED98A]/10">
              <Activity className="h-6 w-6 text-[#2FBF71] dark:text-[#3ED98A]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1D23] dark:text-[#EDEEF0]">
                System Diagnostics
              </h1>
            </div>
          </div>
          <p className="text-sm sm:text-base text-[#6B7280] dark:text-[#9CA3AF] max-w-3xl">
            Monitor overall energy harvesting performance through standardized reference tests.
            This feature measures system-wide performance and does not track individual piezoelectric
            disc performance.
          </p>
        </div>

        {/* Content Grid */}
        <div className="space-y-6 lg:space-y-8">
          {/* Reference Configuration & Diagnostic Test - Side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reference Configuration Section */}
            <div>
              <ReferenceConfigForm />
            </div>

            {/* Diagnostic Test Section */}
            <div>
              <DiagnosticTestForm />
            </div>
          </div>

          {/* Diagnostic History Section - Full width */}
          <div>
            <DiagnosticHistoryTable />
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 p-4 sm:p-6 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
            📊 About System Diagnostics
          </h4>
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
            System diagnostics measure <strong>overall energy harvesting performance</strong> through
            standardized reference tests. These tests apply a known weight and compare actual energy
            output against expected baseline values. This feature does <strong>not</strong> monitor
            individual piezoelectric disc performance or identify specific defective components.
            For issues with individual sensors, contact the hardware team for physical inspection.
          </p>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ReferenceConfigForm } from '../components/ReferenceConfigForm';
import { DiagnosticTestForm } from '../components/DiagnosticTestForm';
import { DiagnosticHistoryTable } from '../components/DiagnosticHistoryTable';
import { getThemeColors, TYPOGRAPHY } from '@/lib/theme';

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
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

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
                System Diagnostics
              </h1>
            </div>
          </div>
          <p 
            className="text-sm sm:text-base max-w-3xl"
            style={{ 
              color: colors.textSecondary,
              fontSize: TYPOGRAPHY.fontSize.base
            }}
          >
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
        <div 
          className="mt-8 p-4 sm:p-6 rounded-lg border" 
          style={{
            backgroundColor: colors.accentSubtle,
            borderColor: colors.accent + '40'
          }}
        >
          <h4 
            className="text-sm font-semibold mb-2"
            style={{ 
              color: colors.accent,
              fontWeight: TYPOGRAPHY.fontWeight.semibold
            }}
          >
            📊 About System Diagnostics
          </h4>
          <p 
            className="text-xs sm:text-sm leading-relaxed"
            style={{ 
              color: colors.textSecondary,
              fontSize: TYPOGRAPHY.fontSize.sm
            }}
          >
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

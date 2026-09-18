import { DashboardLayout } from '@/layouts/DashboardLayout';
import { EcoPageHeader } from '@/components/common/EcoPageHeader';
import { DashboardCard } from '@/features/dashboard/components/DashboardCard';
import { Info } from 'lucide-react';

/**
 * Admin Settings Page
 * 
 * Provides admin configuration and system settings.
 * Demo data controls have been removed as per system cleanup requirements.
 */
export function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <EcoPageHeader
          title="Settings"
          subtitle="Manage system configuration"
        />

        {/* System Configuration Card */}
        <DashboardCard
          title="System Configuration"
          subtitle="Configure system settings and preferences"
          className="mt-6"
        >
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/30">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                    System Settings
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    Additional configuration options will be available here in future updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}

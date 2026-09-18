import { Activity, AlertCircle } from 'lucide-react';

/**
 * Empty Dashboard Props
 */
interface EmptyDashboardProps {
  title?: string;
  message?: string;
}

/**
 * Empty Dashboard Component
 * Displayed when no data is available
 * 
 * Requirements:
 * - 11.1: Display proper empty state when no real data exists
 * - 11.2: Remove placeholder/mock data from dashboard cards
 * - 26.1: Show helpful empty state with ESP32 connection instructions
 */
export function EmptyDashboard({
  title = 'No Data Available',
  message = 'No energy data available. Connect ESP32 sensors to begin monitoring.',
}: EmptyDashboardProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
          <Activity className="h-10 w-10 text-neutral-400" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-neutral-900">{title}</h2>
        <p className="mb-6 text-neutral-600">{message}</p>
        <div className="rounded-lg border border-accent-200 bg-accent-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-accent-600 mt-0.5" />
            <div className="text-left">
              <p className="text-sm font-medium text-accent-900">ESP32 Hardware Connection Required</p>
              <p className="mt-1 text-xs text-accent-700">
                Configure and connect your ESP32 sensors to begin collecting real-time energy data. The dashboard will update automatically once sensors start transmitting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { TrendingUp, Zap, DollarSign, TrendingDown, Activity, Clock } from 'lucide-react';
import { EcoPageHeader, EcoCard, EcoEmptyState } from '@/components/common';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { SummaryGrid } from '../components/summary';
import { useAnalytics } from '../hooks';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/permissions';
import { PublicUserBanner } from '@/components/common/PublicUserBanner';

/**
 * Analytics Page Component
 * 
 * Main analytics dashboard with comprehensive metrics and visualizations.
 * Redesigned with EcoStep design system
 */
export function AnalyticsPage() {
  const { data: analytics, isLoading, error, refetch, isRefetching } = useAnalytics();
  const { isAuthenticated, user } = useAuth();
  
  // Determine user role
  const userRole = getUserRole(isAuthenticated, user);
  const isPublicUser = userRole === 'public';

  // Loading state
  if (isLoading && !analytics) {
    return (
      <div className="eco-page-container">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !analytics) {
    return (
      <div className="eco-page-container">
        <EcoEmptyState
          icon={TrendingUp}
          title="Unable to Load Analytics"
          description="Could not fetch analytics data. Please ensure the backend server is running and try again."
          action={
            <button onClick={() => refetch()} className="eco-btn-primary">
              Try Again
            </button>
          }
        />
      </div>
    );
  }

  // Empty state (no data)
  if (!analytics) {
    return (
      <div className="eco-page-container">
        <EcoEmptyState
          icon={TrendingUp}
          title="No Data Available"
          description="No sensor data has been collected yet. Connect sensors and start collecting data to view analytics."
        />
      </div>
    );
  }

  return (
    <div className="eco-page-container">
      {/* Public User Banner - Show at top for guest users */}
      {isPublicUser && (
        <PublicUserBanner className="mb-6" />
      )}
      
      {/* Page Header */}
      <EcoPageHeader
        title="Analytics & Insights"
        subtitle="Monitor trends, discover patterns, and understand your energy consumption."
        status="connected"
        statusLabel="Live"
        onRefresh={refetch}
        isRefreshing={isRefetching}
      />

      <div className="space-y-6">
        {/* Summary Cards */}
        <SummaryGrid analytics={analytics} />

        {/* Charts Section - Future Enhancement */}
        <EcoCard>
          <div className="eco-card-header">
            <div className="flex items-center gap-3">
              <div className="eco-icon-container-lg">
                <Activity className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <h3 className="eco-card-title">Historical Charts</h3>
                <p className="text-sm text-[rgb(var(--color-neutral-600))] mt-1">
                  Visualizations coming soon
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-[rgb(var(--color-neutral-600))]">
              This section will display:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-[#428475] mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span className="text-sm text-[rgb(var(--color-neutral-600))]">
                  Energy generation trends (daily, weekly, monthly)
                </span>
              </div>
              <div className="flex items-start gap-2">
                <TrendingDown className="h-4 w-4 text-[#428475] mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span className="text-sm text-[rgb(var(--color-neutral-600))]">
                  Power consumption patterns
                </span>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-[#428475] mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span className="text-sm text-[rgb(var(--color-neutral-600))]">
                  Battery charge/discharge cycles
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Activity className="h-4 w-4 text-[#428475] mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span className="text-sm text-[rgb(var(--color-neutral-600))]">
                  Voltage and current monitoring
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-[#428475] mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span className="text-sm text-[rgb(var(--color-neutral-600))]">
                  Sensor uptime and reliability
                </span>
              </div>
            </div>
          </div>
        </EcoCard>

        {/* Insights Section - Future Enhancement */}
        <EcoCard>
          <div className="eco-card-header">
            <div className="flex items-center gap-3">
              <div className="eco-icon-container-lg">
                <TrendingUp className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <h3 className="eco-card-title">Automated Insights</h3>
                <p className="text-sm text-[rgb(var(--color-neutral-600))] mt-1">
                  AI-powered insights coming soon
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-[rgb(var(--color-neutral-600))]">
              This section will automatically detect:
            </p>
            <div className="space-y-2">
              {[
                'Peak production hours and patterns',
                'Energy efficiency opportunities',
                'Sensor performance anomalies',
                'Predictive maintenance alerts',
                'Cost optimization recommendations'
              ].map((insight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#89D7B7] mt-2 flex-shrink-0" />
                  <span className="text-sm text-[rgb(var(--color-neutral-600))]">
                    {insight}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </EcoCard>
      </div>
    </div>
  );
}

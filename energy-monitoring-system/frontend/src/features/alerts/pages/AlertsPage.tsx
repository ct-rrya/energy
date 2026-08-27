import { useState } from 'react';
import { AlertTriangle, Filter } from 'lucide-react';
import { EcoPageHeader, EcoCard, EcoEmptyState } from '@/components/common';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AlertCard } from '../components/AlertCard';
import { AlertDetailsDialog } from '../components/AlertDetailsDialog';
import {
  useAlerts,
  useAlertStats,
  useAlertActions,
  useLiveAlerts,
} from '../hooks';
import type { Alert } from '@/types/alert.types';
import { AlertStatus, AlertSeverity } from '@/types/alert.types';

/**
 * Alerts Page Component
 * Redesigned with EcoStep design system
 */
export function AlertsPage() {
  // State
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Hooks
  const { isConnected } = useLiveAlerts();
  
  const {
    data: alertsData,
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
  } = useAlerts({
    status: statusFilter === 'all' ? undefined : statusFilter,
    severity: severityFilter === 'all' ? undefined : severityFilter,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useAlertStats();

  const {
    acknowledgeAlert,
    isAcknowledging,
    resolveAlert,
    isResolving,
  } = useAlertActions();

  // Handlers
  const handleRefresh = () => {
    refetchAlerts();
    refetchStats();
  };

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedAlert(null);
  };

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert(alertId);
    handleCloseDialog();
  };

  const handleResolve = (alertId: string) => {
    resolveAlert(alertId);
    handleCloseDialog();
  };

  // Loading state
  if (alertsLoading && !alertsData) {
    return (
      <div className="eco-page-container">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (alertsError && !alertsData) {
    return (
      <div className="eco-page-container">
        <EcoEmptyState
          icon={AlertTriangle}
          title="Unable to Load Alerts"
          description="Could not connect to the backend server. Please ensure the server is running and try again."
          action={
            <button onClick={handleRefresh} className="eco-btn-primary">
              Try Again
            </button>
          }
        />
      </div>
    );
  }

  const alerts = alertsData?.data || [];
  const activeAlerts = alerts.filter((a) => a.status === AlertStatus.ACTIVE);

  return (
    <div className="eco-page-container">
      {/* Page Header */}
      <EcoPageHeader
        title="Alert Center"
        subtitle="Monitor and manage system alerts in real-time."
        status={isConnected ? 'connected' : 'disconnected'}
        statusLabel={isConnected ? 'Live' : 'Offline'}
        onRefresh={handleRefresh}
        isRefreshing={alertsLoading || statsLoading}
      />

      <div className="space-y-6">
        {/* Statistics Summary */}
        {stats && (
          <div className="eco-grid-4">
            <div className="eco-card-compact">
              <div className="metric-label mb-2">Total Alerts</div>
              <div className="metric-value-large">{stats.total}</div>
            </div>
            <div className="eco-card-compact">
              <div className="metric-label mb-2">Active</div>
              <div className="metric-value-large text-[rgb(var(--color-error-600))]">{stats.active}</div>
            </div>
            <div className="eco-card-compact">
              <div className="metric-label mb-2">Critical</div>
              <div className="metric-value-large text-[rgb(var(--color-error-700))]">{stats.critical}</div>
            </div>
            <div className="eco-card-compact">
              <div className="metric-label mb-2">This Week</div>
              <div className="metric-value-large">{stats.recent.length}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <EcoCard compact>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-[#428475]" strokeWidth={2} />
            <span className="text-sm font-semibold text-[#1A312C] dark:text-[#89D7B7]">Filters</span>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[rgb(var(--color-neutral-600))]">Status:</span>
              <div className="flex gap-1.5">
                {(['all', 'active', 'acknowledged', 'resolved'] as Array<'all' | AlertStatus>).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === status
                        ? 'bg-[#428475] text-[#FFF4E1] shadow-sm'
                        : 'bg-white/60 dark:bg-[#1A312C]/40 text-[#1A312C] dark:text-[#89D7B7] hover:bg-white/80 dark:hover:bg-[#1A312C]/60'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[rgb(var(--color-neutral-600))]">Severity:</span>
              <div className="flex gap-1.5">
                {(['all', 'info', 'warning', 'critical'] as Array<'all' | AlertSeverity>).map((severity) => (
                  <button
                    key={severity}
                    onClick={() => setSeverityFilter(severity)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      severityFilter === severity
                        ? 'bg-[#428475] text-[#FFF4E1] shadow-sm'
                        : 'bg-white/60 dark:bg-[#1A312C]/40 text-[#1A312C] dark:text-[#89D7B7] hover:bg-white/80 dark:hover:bg-[#1A312C]/60'
                    }`}
                  >
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </EcoCard>

        {/* Active Alerts Panel */}
        {activeAlerts.length > 0 && (
          <div className="rounded-xl border-2 border-[rgb(var(--color-error-200))] bg-[rgba(239,68,68,0.08)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-[rgb(var(--color-error-600))]" strokeWidth={2} />
              <h3 className="text-lg font-semibold text-[rgb(var(--color-error-900))]">
                Active Alerts ({activeAlerts.length})
              </h3>
            </div>
            <div className="space-y-3">
              {activeAlerts.slice(0, 3).map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onClick={() => handleAlertClick(alert)}
                />
              ))}
            </div>
            {activeAlerts.length > 3 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setStatusFilter('active' as AlertStatus)}
                  className="text-sm text-[rgb(var(--color-error-600))] hover:text-[rgb(var(--color-error-700))] font-medium transition-colors"
                >
                  View all {activeAlerts.length} active alerts →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Alerts List */}
        <EcoCard>
          <div className="flex items-center justify-between mb-5">
            <h3 className="eco-card-title">
              All Alerts
              {alertsData && (
                <span className="eco-badge eco-badge-neutral ml-2">
                  {alertsData.pagination.total}
                </span>
              )}
            </h3>
          </div>

          {alerts.length === 0 ? (
            <EcoEmptyState
              icon={AlertTriangle}
              title="No Alerts Found"
              description={
                statusFilter !== 'all' || severityFilter !== 'all'
                  ? 'No alerts match the current filters. Try adjusting your filter criteria.'
                  : 'No alerts have been generated yet. The system is operating normally.'
              }
            />
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onClick={() => handleAlertClick(alert)}
                />
              ))}
            </div>
          )}
        </EcoCard>
      </div>

      {/* Alert Details Dialog */}
      <AlertDetailsDialog
        alert={selectedAlert}
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onAcknowledge={handleAcknowledge}
        onResolve={handleResolve}
        isAcknowledging={isAcknowledging}
        isResolving={isResolving}
      />
    </div>
  );
}

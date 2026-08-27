import { RefreshCw } from 'lucide-react';

/**
 * EcoStep Page Header Props
 */
interface EcoPageHeaderProps {
  title: string;
  subtitle?: string;
  status?: string;
  statusLabel?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  actions?: React.ReactNode;
}

/**
 * EcoStep Page Header Component
 * Consistent header for all non-dashboard pages
 * 
 * Usage:
 * <EcoPageHeader 
 *   title="Analytics & Insights"
 *   subtitle="Monitor trends, discover patterns, and understand your energy consumption."
 *   status="connected"
 *   statusLabel="Live"
 *   onRefresh={handleRefresh}
 * />
 */
export function EcoPageHeader({
  title,
  subtitle,
  status,
  statusLabel,
  onRefresh,
  isRefreshing,
  actions,
}: EcoPageHeaderProps) {
  return (
    <div className="eco-page-header">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="eco-page-title">{title}</h1>
          {subtitle && (
            <p className="eco-page-subtitle">{subtitle}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Status indicator */}
          {status && statusLabel && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-[#1A312C]/40 border border-white/70 dark:border-[#89D7B7]/10">
              <div
                className={`h-2 w-2 rounded-full ${
                  status === 'connected'
                    ? 'bg-[#89D7B7]'
                    : 'bg-[rgb(var(--color-neutral-400))]'
                }`}
              />
              <span className="text-xs font-medium text-[#1A312C] dark:text-[#89D7B7]">
                {statusLabel}
              </span>
            </div>
          )}

          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-[#1A312C]/40 hover:bg-white/80 dark:hover:bg-[#1A312C]/60 border border-white/70 dark:border-[#89D7B7]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh"
            >
              <RefreshCw
                className={`h-4 w-4 text-[#428475] ${isRefreshing ? 'animate-spin' : ''}`}
                strokeWidth={2}
              />
              <span className="text-xs font-medium text-[#1A312C] dark:text-[#89D7B7]">
                Refresh
              </span>
            </button>
          )}

          {/* Custom actions */}
          {actions}
        </div>
      </div>
    </div>
  );
}

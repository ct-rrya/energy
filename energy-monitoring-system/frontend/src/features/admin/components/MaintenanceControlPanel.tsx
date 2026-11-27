import { useNavigate } from 'react-router-dom';
import { Wrench, ChevronRight } from 'lucide-react';
import { useMaintenance } from '@/contexts/MaintenanceContext';
import { showToast } from '@/components/common/Toast';
import { ROUTES } from '@/routes/routes.config';

/**
 * Compact Maintenance Mode Row for Admin Settings
 *
 * Keeps Title + Toggle on one clean horizontal row even on narrow phones.
 * - Clicking the toggle switch pauses/resumes immediately in place.
 * - Clicking anywhere else on the row opens the dedicated Maintenance Mode page.
 */
export function MaintenanceControlPanel() {
  const navigate = useNavigate();
  const { state, isUpdating, updateMaintenance, resumeNormalOperation } =
    useMaintenance();

  const handleToggleSwitch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpdating) return;

    try {
      if (state.enabled) {
        await resumeNormalOperation();
        showToast('Normal operation resumed — floor mat recording active', 'success');
      } else {
        await updateMaintenance({
          enabled: true,
          message:
            state.message ||
            'Scheduled floor mat wiring inspection and calibration in progress.',
        });
        showToast('Maintenance Mode enabled — hardware ingestion paused', 'success');
      }
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || 'Failed to update Maintenance Mode',
        'error',
      );
    }
  };

  return (
    <section
      aria-label="Maintenance Mode and Hardware Pause"
      onClick={() => navigate(ROUTES.SETTINGS_MAINTENANCE)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(ROUTES.SETTINGS_MAINTENANCE);
        }
      }}
      className="py-5 first:pt-2 cursor-pointer group outline-none focus-visible:ring-1 focus-visible:ring-[var(--acc)] rounded-lg"
    >
      {/* Top row: Title on left, Toggle on right — stays on 1 line on mobile */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Wrench
            className={`h-4 w-4 shrink-0 ${
              state.enabled ? 'text-amber-500' : 'text-[var(--acc)]'
            }`}
          />
          <h2 className="text-base font-semibold text-[var(--t)] m-0 truncate group-hover:text-[var(--acc)] transition-colors">
            Maintenance Mode
          </h2>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={state.enabled}
          aria-label="Toggle Maintenance Mode"
          disabled={isUpdating}
          onClick={handleToggleSwitch}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors cursor-pointer disabled:opacity-50 ${
            state.enabled
              ? 'bg-amber-500 border-amber-500'
              : 'bg-[var(--soft)] border-[var(--line)]'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              state.enabled ? 'translate-x-5.5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Description + Status + Chevron */}
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-[var(--mu)] m-0 leading-relaxed">
          Pause floor mat uploads &amp; show a public notice during inspection or calibration.{' '}
          <span
            className={`font-medium ${
              state.enabled ? 'text-amber-500' : 'text-[#19D46A]'
            }`}
          >
            {state.enabled ? 'Active · Hardware Paused' : 'Normal Operation'}
          </span>
        </p>
        <ChevronRight className="w-4 h-4 text-[var(--mu)] shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </section>
  );
}

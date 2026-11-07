import { createPortal } from 'react-dom';
import { Key, Trash2, CheckCircle, XCircle, Loader2, X, AlertTriangle } from 'lucide-react';
import type { Administrator } from '@/api/services/admin-management.service';
import { useAuth } from '@/contexts/AuthContext';

interface ConfirmationModalProps {
  type: 'reset' | 'delete' | 'activate' | 'deactivate';
  administrator: Administrator;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Confirmation Modal
 * Confirms destructive or important administrator actions with DM Sans typography and dark/light mode support.
 */
export function ConfirmationModal({
  type,
  administrator,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmationModalProps) {
  const { user } = useAuth();
  const currentUserId = (user as any)?.id || (user as any)?._id;
  const isSelf = currentUserId === administrator.id || user?.email === administrator.email;
  const isBlockedSelfDelete = type === 'delete' && Boolean(isSelf);

  const getConfig = () => {
    switch (type) {
      case 'reset':
        return {
          icon: Key,
          iconColor: 'text-[#10B981]',
          iconBg: 'bg-[#10B981]/15 border border-[#10B981]/30',
          title: 'Reset Access Code?',
          message: `Reset the access code for ${administrator.name}?`,
          details: [
            'A new secure access code will be generated',
            'The current access code will be immediately invalidated',
            "The administrator's active session will end",
            'You must provide the new code to the administrator',
          ],
          confirmText: 'Reset Access Code',
          confirmClass: 'bg-[#10B981] hover:bg-[#059669] text-white',
        };
      case 'delete':
        return {
          icon: Trash2,
          iconColor: 'text-rose-500',
          iconBg: 'bg-rose-500/15 border border-rose-500/30',
          title: 'Delete Administrator?',
          message: `Permanently delete ${administrator.name}?`,
          details: isBlockedSelfDelete
            ? ['You cannot delete your own administrator account.']
            : [
                'This action cannot be undone',
                'The administrator account will be permanently removed',
                'Access code will be invalidated immediately',
                'Historical audit logs will be preserved',
                administrator.role === 'SUPER_ADMIN'
                  ? '⚠️ WARNING: Deleting the last SUPER_ADMIN is not allowed'
                  : '',
              ].filter(Boolean),
          confirmText: 'Delete Administrator',
          confirmClass: 'bg-rose-600 hover:bg-rose-700 text-white',
        };
      case 'activate':
        return {
          icon: CheckCircle,
          iconColor: 'text-[#10B981]',
          iconBg: 'bg-[#10B981]/15 border border-[#10B981]/30',
          title: 'Activate Administrator?',
          message: `Activate ${administrator.name}?`,
          details: [
            'The administrator will be able to login',
            'Their access code will become valid',
            'They will regain full access to their assigned functions',
          ],
          confirmText: 'Activate Account',
          confirmClass: 'bg-[#10B981] hover:bg-[#059669] text-white',
        };
      case 'deactivate':
        return {
          icon: XCircle,
          iconColor: 'text-amber-500',
          iconBg: 'bg-amber-500/15 border border-amber-500/30',
          title: 'Deactivate Administrator?',
          message: `Deactivate ${administrator.name}?`,
          details: [
            'The administrator will not be able to login',
            'Their access code will be rejected',
            'Any active session will end',
            'Historical audit logs will be preserved',
          ],
          confirmText: 'Deactivate Account',
          confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/75 backdrop-blur-sm p-4 sm:p-6 font-['DM_Sans',sans-serif]"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div className="min-h-full flex items-center justify-center">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md my-8 rounded-2xl border border-[var(--line,rgba(255,255,255,0.12))] bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] shadow-2xl overflow-hidden flex flex-col p-6 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 p-1 rounded-lg text-[var(--mu,#87A993)] hover:text-[var(--t,#E4F7EA)] hover:bg-[var(--soft,rgba(255,255,255,0.06))] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div className={`w-12 h-12 ${config.iconBg} rounded-2xl flex items-center justify-center shrink-0`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1 pr-6">
              <h2 className="text-lg font-bold text-[var(--t,#E4F7EA)] mb-1">
                {config.title}
              </h2>
              <p className="text-xs text-[var(--mu,#87A993)] leading-relaxed">
                {config.message}
              </p>
            </div>
          </div>

          {/* Self-delete block warning */}
          {isBlockedSelfDelete && (
            <div className="p-3.5 mb-5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle size={16} className="shrink-0 text-amber-400 mt-0.5" />
              <div>
                <strong className="block font-semibold">Self-Deletion Blocked</strong>
                As a security safeguard, Super Administrators cannot delete their own account.
              </div>
            </div>
          )}

          {/* Details */}
          {!isBlockedSelfDelete && (
            <div className="rounded-xl p-3.5 mb-5 bg-[var(--soft,rgba(255,255,255,0.04))] border border-[var(--line,rgba(255,255,255,0.08))]">
              <ul className="space-y-1.5">
                {config.details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-[var(--mu,#87A993)]">
                    <span className="text-[#10B981] mt-0.5 font-bold">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Administrator Info Badge */}
          <div className="rounded-xl p-3 mb-6 bg-[var(--soft,rgba(255,255,255,0.04))] border border-[var(--line,rgba(255,255,255,0.08))] text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[var(--mu,#87A993)]">Name:</span>
              <span className="font-semibold text-[var(--t,#E4F7EA)]">{administrator.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--mu,#87A993)]">Email:</span>
              <span className="text-[var(--t,#E4F7EA)] text-[11px] font-medium">{administrator.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--mu,#87A993)]">Role:</span>
              <span className="font-semibold text-[var(--t,#E4F7EA)]">
                {administrator.role === 'SUPER_ADMIN' ? 'Super Admin' : 'System Admin'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--line,rgba(255,255,255,0.15))] text-[var(--t,#E4F7EA)] hover:bg-[var(--soft,rgba(255,255,255,0.08))] transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading || isBlockedSelfDelete}
              className={`flex-1 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmClass}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{config.confirmText}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

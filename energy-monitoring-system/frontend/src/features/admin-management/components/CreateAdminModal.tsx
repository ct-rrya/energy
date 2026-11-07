import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@tanstack/react-query';
import { X, UserPlus, Loader2, Shield, Lock } from 'lucide-react';
import { adminManagementService, type CreateAdministratorDto } from '@/api/services/admin-management.service';

interface CreateAdminModalProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
}

/**
 * Create Administrator Modal
 * Allows Super Admin to create a new administrator account with DM Sans typography and EcoStep styling.
 */
export function CreateAdminModal({ onClose, onSuccess }: CreateAdminModalProps) {
  const [formData, setFormData] = useState<CreateAdministratorDto>({
    name: '',
    email: '',
    role: 'SYSTEM_ADMIN',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAdministratorDto) =>
      adminManagementService.createAdministrator(data),
    onSuccess: (response) => {
      onSuccess(response.data?.message || 'Administrator created successfully');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/75 backdrop-blur-sm p-4 sm:p-6 font-['DM_Sans',sans-serif]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="min-h-full flex items-center justify-center">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md my-8 rounded-2xl border border-[var(--line,rgba(255,255,255,0.12))] bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] shadow-2xl overflow-hidden flex flex-col p-6 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
                <UserPlus size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--t,#E4F7EA)]">
                  Add Administrator
                </h2>
                <p className="text-xs text-[var(--mu,#87A993)]">
                  Create a new administrator account
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--mu,#87A993)] hover:text-[var(--t,#E4F7EA)] hover:bg-[var(--soft,rgba(255,255,255,0.06))] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[var(--t,#E4F7EA)] mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Maria Santos"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[var(--line,rgba(255,255,255,0.12))] bg-[var(--soft,rgba(255,255,255,0.04))] text-[var(--t,#E4F7EA)] placeholder:text-[var(--mu,#87A993)]/60 focus:outline-hidden focus:ring-1 focus:ring-[#10B981]"
                required
                minLength={2}
                maxLength={50}
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-[var(--t,#E4F7EA)] mb-1.5">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. maria.santos@ecostep.local"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[var(--line,rgba(255,255,255,0.12))] bg-[var(--soft,rgba(255,255,255,0.04))] text-[var(--t,#E4F7EA)] placeholder:text-[var(--mu,#87A993)]/60 focus:outline-hidden focus:ring-1 focus:ring-[#10B981]"
                required
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-[var(--t,#E4F7EA)] mb-1.5">
                Role <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-[#10B981] bg-[#10B981]/15 text-[#10B981] font-semibold"
                >
                  <Shield size={16} className="shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">System Admin</div>
                    <div className="text-[10px] opacity-80">Day-to-day operations</div>
                  </div>
                </div>

                <div
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--line,rgba(255,255,255,0.08))] bg-[var(--soft,rgba(255,255,255,0.02))] text-[var(--mu,#87A993)] opacity-50 cursor-not-allowed select-none"
                  title="Super Admin accounts are fixed and protected. You cannot add another Super Admin."
                >
                  <Lock size={15} className="shrink-0 text-amber-400" />
                  <div>
                    <div className="text-xs font-semibold">Super Admin</div>
                    <div className="text-[10px] text-amber-400 font-medium">Not permitted</div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[var(--mu,#87A993)] mt-1.5">
                Super admin accounts are protected. A super-admin cannot create another super-admin.
              </p>
            </div>

            {/* Error Message */}
            {createMutation.isError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {(createMutation.error as any)?.response?.data?.message || 'Failed to create administrator. Please try again.'}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--line,rgba(255,255,255,0.15))] text-[var(--t,#E4F7EA)] hover:bg-[var(--soft,rgba(255,255,255,0.08))] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 px-4 py-2 text-xs font-bold rounded-xl bg-[#10B981] hover:bg-[#059669] text-white transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}

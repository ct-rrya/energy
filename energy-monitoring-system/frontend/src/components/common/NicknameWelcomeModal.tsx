import { useState, useEffect, type FormEvent } from 'react';
import { RefreshCw, Sparkles, UserCheck } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useVisitor } from '@/contexts/VisitorContext';

/**
 * Welcome / Change Nickname modal for public visitors.
 * Shown once per browser on first entry, and re-openable anytime from the
 * sidebar user menu to set or change the browser nickname.
 */
export function NicknameWelcomeModal() {
  const { isAuthenticated, isLoading } = useAuth();
  const {
    suggestedNickname,
    hasCompletedWelcome,
    isNicknameModalOpen,
    completeWelcome,
    dismissWelcome,
    closeNicknameModal,
    regenerateSuggestedNickname,
  } = useVisitor();

  const [customNickname, setCustomNickname] = useState('');

  const isManualEdit = hasCompletedWelcome && isNicknameModalOpen;
  const shouldShow = !isLoading && !isAuthenticated && (!hasCompletedWelcome || isNicknameModalOpen);

  useEffect(() => {
    if (shouldShow) {
      setCustomNickname('');
    }
  }, [shouldShow]);

  if (!shouldShow) {
    return null;
  }

  const handleClose = () => {
    if (isManualEdit) {
      closeNicknameModal();
    } else {
      dismissWelcome();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    completeWelcome(customNickname);
  };

  return (
    <Dialog
      open={shouldShow}
      onClose={handleClose}
      title={isManualEdit ? 'Change Nickname' : 'Welcome to EcoStep'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-[var(--mu)] leading-relaxed m-0">
          {isManualEdit
            ? 'Update your nickname for this browser. It will appear on your ECommunity posts, admin chats, and generated reports.'
            : 'Pick a nickname for this browser so your ECommunity posts, admin chats, and generated reports carry your name — no account required.'}
        </p>

        {/* Offered / Current Nickname (Flat hairline row) */}
        <div className="py-3 border-y border-[var(--line)]">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--mu)]">
                <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
                <span>{isManualEdit ? 'Current / Suggested Nickname' : 'Your Assigned Nickname'}</span>
              </div>
              <div className="text-base font-bold text-[var(--t)] mt-0.5 truncate">
                {suggestedNickname}
              </div>
            </div>
            <button
              type="button"
              onClick={regenerateSuggestedNickname}
              title="Generate another nickname"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--line)] bg-transparent text-[var(--t)] hover:border-[var(--acc)] transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Shuffle</span>
            </button>
          </div>
        </div>

        {/* Optional Custom Nickname Input */}
        <div>
          <label
            htmlFor="welcome-custom-nickname"
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--mu)] mb-1.5"
          >
            Or create your own (optional)
          </label>
          <Input
            id="welcome-custom-nickname"
            type="text"
            value={customNickname}
            onChange={(e) => setCustomNickname(e.target.value)}
            placeholder={`Leave blank to use ${suggestedNickname}`}
            maxLength={32}
            autoComplete="off"
          />
          {!isManualEdit && (
            <p className="text-[11px] text-[var(--mu)] mt-1.5 mb-0">
              If you skip or close this window, we&apos;ll automatically use <strong>{suggestedNickname}</strong> for this browser.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
          >
            {isManualEdit ? 'Cancel' : 'Skip for now'}
          </Button>
          <Button type="submit" variant="primary">
            <UserCheck className="w-4 h-4 mr-1.5" />
            {customNickname.trim() ? 'Save Nickname' : `Use ${suggestedNickname}`}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

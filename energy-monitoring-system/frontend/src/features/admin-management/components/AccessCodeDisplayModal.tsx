import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Key, X, AlertTriangle } from 'lucide-react';

interface AccessCodeDisplayModalProps {
  accessCode: string;
  administratorName: string;
  onClose: () => void;
}

/**
 * Access Code Display Modal
 * Displays the administrator's access code ONCE with DM Sans typography and clean copy controls.
 */
export function AccessCodeDisplayModal({
  accessCode,
  administratorName,
  onClose,
}: AccessCodeDisplayModalProps) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleClose = () => {
    if (confirmed) {
      onClose();
    } else {
      alert('Please check the box confirming you have saved this access code before closing.');
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6 font-['DM_Sans',sans-serif]"
      role="dialog"
      aria-modal="true"
    >
      <div className="min-h-full flex items-center justify-center">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md my-8 rounded-2xl border border-[var(--line,rgba(255,255,255,0.12))] bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] shadow-2xl overflow-hidden flex flex-col p-6 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Close button if confirmed */}
          {confirmed && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg text-[var(--mu,#87A993)] hover:text-[var(--t,#E4F7EA)] hover:bg-[var(--soft,rgba(255,255,255,0.06))] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}

          {/* Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] rounded-2xl mb-3 shadow-sm">
              <Key size={22} />
            </div>
            <h2 className="text-lg font-bold text-[var(--t,#E4F7EA)] mb-1">
              Access Code Generated
            </h2>
            <p className="text-xs text-[var(--mu,#87A993)]">
              For: <strong className="text-[var(--t,#E4F7EA)]">{administratorName}</strong>
            </p>
          </div>

          {/* Warning banner */}
          <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-300">
            <AlertTriangle size={15} className="shrink-0 text-amber-400 mt-0.5" />
            <span>
              This access code is shown <strong>only once</strong>. Please copy and store it securely.
            </span>
          </div>

          {/* Code box */}
          <div className="p-4 mb-4 rounded-xl bg-[var(--soft,rgba(255,255,255,0.04))] border border-[var(--line,rgba(255,255,255,0.1))] text-center">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--mu,#87A993)] mb-1.5">
              Secure Access Code
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-widest text-[#10B981] select-all my-2 font-['DM_Sans',sans-serif]">
              {accessCode}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                copied
                  ? 'bg-[#10B981] text-white'
                  : 'bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] border border-[var(--line,rgba(255,255,255,0.15))] hover:border-[#10B981]'
              }`}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Access Code'}</span>
            </button>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--soft,rgba(255,255,255,0.03))] border border-[var(--line,rgba(255,255,255,0.08))] mb-5 cursor-pointer text-xs text-[var(--mu,#87A993)]">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-[#10B981] rounded cursor-pointer"
            />
            <span>I have copied or safely stored this access code and understand it cannot be displayed again.</span>
          </label>

          {/* Close Action */}
          <button
            type="button"
            onClick={handleClose}
            disabled={!confirmed}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-[#10B981] hover:bg-[#059669] text-white"
          >
            Done & Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

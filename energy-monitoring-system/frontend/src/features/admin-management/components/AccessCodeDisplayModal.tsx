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
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/65 p-4 sm:p-6 font-['DM_Sans',sans-serif]"
      role="dialog"
      aria-modal="true"
    >
      <div className="min-h-full flex items-center justify-center">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md my-8 rounded-xl border border-[var(--line)] bg-white dark:bg-[#131916] text-[var(--t)] overflow-hidden flex flex-col p-6"
        >
          {/* Close button if confirmed */}
          {confirmed && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg text-[var(--mu)] hover:text-[var(--t)] hover:bg-[var(--soft)] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}

          {/* Header */}
          <div className="mb-4 pb-3 border-b border-[var(--line)]">
            <div className="flex items-center gap-2 text-[var(--acc)] mb-1">
              <Key size={18} />
              <h2 className="text-lg font-bold text-[var(--t)]">
                Access Code Generated
              </h2>
            </div>
            <p className="text-xs text-[var(--mu)]">
              For: <strong className="text-[var(--t)]">{administratorName}</strong>
            </p>
          </div>

          {/* Warning notice (flat left accent) */}
          <div className="pl-3 py-1.5 mb-4 border-l-2 border-amber-500 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-300">
            <AlertTriangle size={15} className="shrink-0 text-amber-500 mt-0.5" />
            <span>
              This access code is shown <strong>only once</strong>. Please copy and store it securely.
            </span>
          </div>

          {/* Code block (flat hairline section) */}
          <div className="py-4 mb-4 border-y border-[var(--line)] text-center">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--mu)] mb-1.5">
              Secure Access Code
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-widest text-[#10B981] select-all my-2 font-['DM_Sans',sans-serif]">
              {accessCode}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                copied
                  ? 'bg-[#10B981] text-white'
                  : 'bg-transparent text-[var(--t)] border border-[var(--line)] hover:border-[#10B981]'
              }`}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Access Code'}</span>
            </button>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 py-2 mb-5 cursor-pointer text-xs text-[var(--mu)]">
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

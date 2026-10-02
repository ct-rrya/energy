import { useState } from 'react';
import { Check, Copy, Key, AlertTriangle, X } from 'lucide-react';

interface AccessCodeDisplayModalProps {
  accessCode: string;
  administratorName: string;
  onClose: () => void;
}

/**
 * Access Code Display Modal
 *
 * Displays the administrator's access code ONCE after creation or reset.
 *
 * Security:
 * - Code is shown only once
 * - Cannot be retrieved later
 * - Requires manual confirmation before closing
 * - Provides copy-to-clipboard functionality
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
      alert('Please confirm that you have saved the access code before closing.');
    }
  };

  return (
    <>
      {/* Backdrop - Cannot click to close */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-8 animate-in fade-in zoom-in duration-200">
          {/* Close Button (only if confirmed) */}
          {confirmed && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Code Generated
            </h2>
            <p className="text-sm text-gray-600">
              For: <strong>{administratorName}</strong>
            </p>
          </div>

          {/* Access Code Display */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border-2 border-blue-200">
            <div className="text-center">
              <p className="text-sm text-blue-800 font-medium mb-2">
                Administrator Access Code
              </p>
              <div className="font-mono text-3xl font-bold text-blue-900 tracking-widest mb-4">
                {accessCode}
              </div>
              <button
                onClick={handleCopy}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-blue-700 hover:bg-blue-100 border border-blue-300'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Critical Warning */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-900 mb-2">
                  ⚠️ CRITICAL: Save This Code Immediately
                </h3>
                <ul className="text-xs text-amber-800 space-y-1">
                  <li>• This code will <strong>NEVER be shown again</strong></li>
                  <li>• It cannot be retrieved from the system later</li>
                  <li>• The administrator needs this code to login</li>
                  <li>• Store it securely (password manager recommended)</li>
                  <li>• You can reset it later, but it will generate a new code</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg mb-6 cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              I confirm that I have <strong>saved this access code</strong> and
              understand it will not be displayed again
            </span>
          </label>

          {/* Action Button */}
          <button
            onClick={handleClose}
            disabled={!confirmed}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
              confirmed
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {confirmed ? 'Close (Code Saved)' : 'Confirm Above to Close'}
          </button>

          {/* Footer Note */}
          <p className="text-xs text-center text-gray-500 mt-4">
            Provide this code securely to {administratorName}
          </p>
        </div>
      </div>
    </>
  );
}

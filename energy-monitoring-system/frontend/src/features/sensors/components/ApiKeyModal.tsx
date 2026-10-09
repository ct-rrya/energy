import { useState } from 'react';
import { Copy, Check, Key, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/theme';

interface ApiKeyModalProps {
  apiKey: string;
  sensorName: string;
  onClose: () => void;
}

/**
 * API Key Display Modal
 * 
 * Shows the API key after sensor registration or regeneration
 * ONE-TIME DISPLAY - Cannot be retrieved again!
 */
export function ApiKeyModal({ apiKey, sensorName, onClose }: ApiKeyModalProps) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={(e) => {
        // Prevent accidental close - must click Close button
        e.stopPropagation();
      }}
    >
      <div 
        className="rounded-xl shadow-2xl max-w-2xl w-full"
        style={{ backgroundColor: colors.cardBackground }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ 
            backgroundColor: colors.cardBackground,
            borderColor: colors.border 
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: theme === 'light' ? 'rgba(66, 132, 117, 0.1)' : 'rgba(137, 215, 183, 0.1)'
              }}
            >
              <Key 
                className="w-5 h-5"
                style={{ color: colors.accent }}
              />
            </div>
            <h2 
              className="text-xl font-semibold"
              style={{ color: colors.textPrimary }}
            >
              Sensor API Key
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Warning */}
          <div 
            className="flex gap-3 p-4 rounded-lg border-l-4"
            style={{
              backgroundColor: theme === 'light' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.1)',
              borderLeftColor: '#ef4444',
            }}
          >
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-red-600 mb-1">
                ⚠️ IMPORTANT: Save This Key Now!
              </div>
              <div className="text-sm" style={{ color: colors.textSecondary }}>
                This API key will only be shown once and cannot be retrieved later. 
                Copy it now and configure your ESP32 device immediately. 
                If you lose it, you'll need to regenerate a new key.
              </div>
            </div>
          </div>

          {/* Sensor Info */}
          <div>
            <div 
              className="text-xs mb-1 uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              Sensor Name
            </div>
            <div 
              className="text-sm font-medium"
              style={{ color: colors.textPrimary }}
            >
              {sensorName}
            </div>
          </div>

          {/* API Key */}
          <div>
            <div 
              className="text-xs mb-2 uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              API Key
            </div>
            <div className="flex gap-2">
              <div 
                className="flex-1 px-4 py-3 rounded-lg font-mono text-sm break-all"
                style={{
                  backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                  color: colors.textPrimary,
                  border: `2px solid ${colors.accent}`,
                }}
              >
                {apiKey}
              </div>
              <button
                onClick={handleCopy}
                className="px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors"
                style={{
                  backgroundColor: copied ? '#10b981' : colors.accent,
                  color: 'white',
                }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Usage Instructions */}
          <div>
            <div 
              className="text-sm font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Next Steps:
            </div>
            <ol className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
              <li className="flex gap-2">
                <span className="font-semibold">1.</span>
                <span>Copy the API key above (click "Copy" button)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">2.</span>
                <span>Open your ESP32 Arduino code</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">3.</span>
                <span>Update the <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">API_KEY</code> variable with this key</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">4.</span>
                <span>Upload the code to your ESP32 device</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">5.</span>
                <span>Verify the device connects and sends data</span>
              </li>
            </ol>
          </div>

          {/* Code Example */}
          <div>
            <div 
              className="text-sm font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              ESP32 Configuration:
            </div>
            <div 
              className="p-3 rounded-lg font-mono text-xs overflow-x-auto"
              style={{
                backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                color: colors.textSecondary,
              }}
            >
              <div>const char* API_KEY = "{apiKey}";</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="flex justify-end p-6 border-t"
          style={{ borderColor: colors.border }}
        >
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: colors.accent,
              color: 'white',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'light' ? '#35c27b' : '#35c27b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.accent;
            }}
          >
            I've Saved the API Key
          </button>
        </div>
      </div>
    </div>
  );
}

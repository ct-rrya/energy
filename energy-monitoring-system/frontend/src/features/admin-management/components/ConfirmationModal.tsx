import { Key, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { Administrator } from '@/api/services/admin-management.service';

interface ConfirmationModalProps {
  type: 'reset' | 'delete' | 'activate' | 'deactivate';
  administrator: Administrator;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Confirmation Modal
 *
 * Confirms destructive or important administrator actions.
 */
export function ConfirmationModal({
  type,
  administrator,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmationModalProps) {
  const getConfig = () => {
    switch (type) {
      case 'reset':
        return {
          icon: Key,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          title: 'Reset Access Code?',
          message: `Reset the access code for ${administrator.name}?`,
          details: [
            'A new secure access code will be generated',
            'The current access code will be immediately invalidated',
            "The administrator's active session will end",
            'You must provide the new code to the administrator',
          ],
          confirmText: 'Reset Access Code',
          confirmClass: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
        };
      case 'delete':
        return {
          icon: Trash2,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          title: 'Delete Administrator?',
          message: `Permanently delete ${administrator.name}?`,
          details: [
            'This action cannot be undone',
            'The administrator account will be permanently removed',
            'Access code will be invalidated immediately',
            'Historical audit logs will be preserved',
            administrator.role === 'SUPER_ADMIN'
              ? '⚠️ WARNING: Deleting the last SUPER_ADMIN is not allowed'
              : '',
          ].filter(Boolean),
          confirmText: 'Delete Administrator',
          confirmClass: 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
        };
      case 'activate':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          iconBg: 'bg-green-100',
          title: 'Activate Administrator?',
          message: `Activate ${administrator.name}?`,
          details: [
            'The administrator will be able to login',
            'Their access code will become valid',
            'They will regain full access to their assigned functions',
          ],
          confirmText: 'Activate Account',
          confirmClass: 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
        };
      case 'deactivate':
        return {
          icon: XCircle,
          iconColor: 'text-amber-600',
          iconBg: 'bg-amber-100',
          title: 'Deactivate Administrator?',
          message: `Deactivate ${administrator.name}?`,
          details: [
            'The administrator will not be able to login',
            'Their access code will be rejected',
            "Any active session will end",
            'Historical audit logs will be preserved',
          ],
          confirmText: 'Deactivate Account',
          confirmClass: 'from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-12 h-12 ${config.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {config.title}
              </h2>
              <p className="text-sm text-gray-600">{config.message}</p>
            </div>
          </div>

          {/* Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <ul className="space-y-2">
              {config.details.map((detail, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Administrator Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">{administrator.name}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{administrator.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium text-gray-900">{administrator.role}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 bg-gradient-to-r ${config.confirmClass} text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{config.confirmText}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

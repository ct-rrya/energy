import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/theme';
import { SensorStatus, type CreateSensorDto } from '@/types/sensor.types';

interface RegisterSensorDialogProps {
  open: boolean;
  onClose: () => void;
  onRegister: (data: CreateSensorDto) => void;
  isRegistering: boolean;
}

/**
 * Register Sensor Dialog Component
 * 
 * Form to register a new ESP32 sensor device
 */
export function RegisterSensorDialog({
  open,
  onClose,
  onRegister,
  isRegistering,
}: RegisterSensorDialogProps) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  const [formData, setFormData] = useState<CreateSensorDto>({
    name: '',
    location: '',
    status: SensorStatus.ACTIVE,
    metadata: {
      hardwareVersion: '',
      firmwareVersion: '',
      model: '',
      notes: '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Sensor name is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clean up metadata (remove empty fields)
    const cleanedData = {
      ...formData,
      metadata: Object.entries(formData.metadata || {})
        .filter(([_, value]) => value && value.trim())
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    };

    onRegister(cleanedData);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      location: '',
      status: SensorStatus.ACTIVE,
      metadata: {
        hardwareVersion: '',
        firmwareVersion: '',
        model: '',
        notes: '',
      },
    });
    setErrors({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={handleClose}
    >
      <div 
        className="rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: colors.cardBackground }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="sticky top-0 z-10 flex items-center justify-between p-6 border-b"
          style={{ 
            backgroundColor: colors.cardBackground,
            borderColor: colors.border 
          }}
        >
          <h2 
            className="text-xl font-semibold"
            style={{ color: colors.textPrimary }}
          >
            Register New Sensor
          </h2>
          <button
            onClick={handleClose}
            disabled={isRegistering}
            className="p-2 rounded-lg transition-colors"
            style={{ color: colors.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.hoverBackground;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Basic Information */}
          <div>
            <h3 
              className="text-sm font-semibold mb-4 uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              Basic Information
            </h3>
            <div className="space-y-4">
              {/* Sensor Name */}
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Sensor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setErrors({ ...errors, name: '' });
                  }}
                  placeholder="e.g., MainEntrance-Piezo-01"
                  disabled={isRegistering}
                  className="w-full px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderColor: errors.name ? '#ef4444' : colors.border,
                    color: colors.textPrimary,
                  }}
                />
                {errors.name && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </div>
                )}
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  Format: Location-Type-Number (e.g., MainEntrance-Piezo-01)
                </p>
              </div>

              {/* Location */}
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
                    setErrors({ ...errors, location: '' });
                  }}
                  placeholder="e.g., Building A - Main Entrance - Left Door"
                  disabled={isRegistering}
                  className="w-full px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderColor: errors.location ? '#ef4444' : colors.border,
                    color: colors.textPrimary,
                  }}
                />
                {errors.location && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                    <AlertCircle className="w-3 h-3" />
                    {errors.location}
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as SensorStatus })}
                  disabled={isRegistering}
                  className="w-full px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }}
                >
                  <option value={SensorStatus.ACTIVE}>Active</option>
                  <option value={SensorStatus.INACTIVE}>Inactive</option>
                  <option value={SensorStatus.MAINTENANCE}>Maintenance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hardware Information (Optional) */}
          <div>
            <h3 
              className="text-sm font-semibold mb-4 uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              Hardware Information (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hardware Version */}
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Hardware Version
                </label>
                <input
                  type="text"
                  value={formData.metadata?.hardwareVersion || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, hardwareVersion: e.target.value }
                  })}
                  placeholder="e.g., v1.0"
                  disabled={isRegistering}
                  className="w-full px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }}
                />
              </div>

              {/* Firmware Version */}
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Firmware Version
                </label>
                <input
                  type="text"
                  value={formData.metadata?.firmwareVersion || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, firmwareVersion: e.target.value }
                  })}
                  placeholder="e.g., v1.0.0"
                  disabled={isRegistering}
                  className="w-full px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }}
                />
              </div>

              {/* Model */}
              <div className="md:col-span-2">
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Model
                </label>
                <input
                  type="text"
                  value={formData.metadata?.model || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, model: e.target.value }
                  })}
                  placeholder="e.g., ESP32-DevKitC-V4"
                  disabled={isRegistering}
                  className="w-full px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }}
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Notes
                </label>
                <textarea
                  value={formData.metadata?.notes || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, notes: e.target.value }
                  })}
                  placeholder="Additional notes about this sensor..."
                  disabled={isRegistering}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border transition-colors resize-none"
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div 
            className="flex gap-3 pt-4 border-t"
            style={{ borderColor: colors.border }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={isRegistering}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: colors.hoverBackground,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
              }}
              onMouseEnter={(e) => {
                if (!isRegistering) {
                  e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.hoverBackground;
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRegistering}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: colors.accent,
                color: 'white',
              }}
              onMouseEnter={(e) => {
                if (!isRegistering) {
                  e.currentTarget.style.backgroundColor = theme === 'light' ? '#35c27b' : '#35c27b';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.accent;
              }}
            >
              {isRegistering ? 'Registering...' : 'Register Sensor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

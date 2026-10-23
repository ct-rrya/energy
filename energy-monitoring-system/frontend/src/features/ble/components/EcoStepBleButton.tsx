import React, { useState } from 'react';
import { Bluetooth, Wifi } from 'lucide-react';
import { EcoStepBleModal } from './EcoStepBleModal';

interface EcoStepBleButtonProps {
  className?: string;
  variant?: 'default' | 'header' | 'compact' | 'outline';
  showIcon?: boolean;
  label?: string;
}

export const EcoStepBleButton: React.FC<EcoStepBleButtonProps> = ({
  className = '',
  variant = 'default',
  showIcon = true,
  label = 'Setup Harvester Wi-Fi',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'header':
        return 'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-[#39FF88] border border-emerald-500/30 hover:bg-emerald-500/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#39FF88]';
      case 'compact':
        return 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#10b981] hover:bg-[#059669] text-white transition-all shadow-sm';
      case 'outline':
        return 'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-emerald-500/40 text-[#39FF88] hover:bg-emerald-500/10 transition-all duration-200';
      case 'default':
      default:
        return 'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#10b981] hover:bg-[#059669] text-white shadow-md shadow-emerald-500/15 transition-all duration-200 cursor-pointer';
    }
  };

  return (
    <>
      <button
        id="ecostep-ble-btn"
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${getVariantStyles()} ${className}`}
        aria-label="Setup EcoStep Harvester Wi-Fi via Web Bluetooth"
      >
        {showIcon && (
          <span className="flex items-center gap-1">
            <Bluetooth className="h-3.5 w-3.5 text-blue-400 sm:h-4 sm:w-4" />
            <Wifi className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
          </span>
        )}
        <span>{label}</span>
      </button>

      <EcoStepBleModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

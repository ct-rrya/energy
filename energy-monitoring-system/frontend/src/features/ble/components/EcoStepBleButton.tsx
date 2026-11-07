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
        return 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-[#19D46A] border border-emerald-500/30 hover:bg-emerald-500/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#19D46A]';
      case 'compact':
        return 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#19D46A] hover:bg-[#16C763] text-[#0D1B14] transition-all shadow-xs';
      case 'outline':
        return 'inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-emerald-500/40 text-[#19D46A] hover:bg-emerald-500/10 transition-all duration-200';
      case 'default':
      default:
        return 'inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#19D46A] hover:bg-[#16C763] text-[#0D1B14] shadow-md shadow-emerald-500/15 transition-all duration-200 cursor-pointer';
    }
  };

  return (
    <>
      <button
        id="ecostep-ble-btn"
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${getVariantStyles()} ${className}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        aria-label="Setup EcoStep Harvester Wi-Fi via Web Bluetooth"
      >
        {showIcon && (
          <span className="flex items-center gap-1.5">
            <Bluetooth className="h-4 w-4 text-[#0D1B14]" />
            <Wifi className="h-4 w-4 text-[#0D1B14]" />
          </span>
        )}
        <span>{label}</span>
      </button>

      <EcoStepBleModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * System Status Type
 * Represents the connection status of the system
 */
export type SystemStatusType = 'connected' | 'disconnected' | 'unknown';

/**
 * Dashboard Header Props
 */
export interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  systemStatus: SystemStatusType;
  alertsCount?: number;
  isPublicUser: boolean;
  onAlertsClick?: () => void;
  isWebSocketConnected?: boolean;
}

/**
 * Dashboard Header Component - Compact version with minimal spacing
 */
export const DashboardHeader = React.memo(function DashboardHeader({
  title,
  subtitle,
  systemStatus,
  isWebSocketConnected = true,
}: DashboardHeaderProps) {
  const { theme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <header 
      className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto] items-start sm:items-center justify-between gap-3 sm:gap-6 mb-4"
    >
      {/* Title and Subtitle Section */}
      <div className="flex flex-col">
        <h1 
          className="text-xl sm:text-2xl font-bold uppercase"
          style={{
            color: theme === 'dark' ? '#F9FAFB' : '#0B132B',
            letterSpacing: '0.05em',
            marginBottom: '2px', // Reduced from 4px
          }}
        >
          {title}
        </h1>
        <p 
          className="text-xs uppercase"
          style={{
            color: theme === 'dark' ? '#9CA3AF' : '#374151',
            letterSpacing: '0.05em',
          }}
        >
          {subtitle}
        </p>
      </div>

      <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:contents">
        {/* Date/Time Section */}
        <div className="flex flex-col items-start sm:items-center">
          <div 
            className="text-xs sm:text-sm font-semibold uppercase"
            style={{
              color: theme === 'dark' ? '#F9FAFB' : '#0B132B',
              letterSpacing: '0.05em',
            }}
          >
            TODAY
          </div>
          <div 
            className="text-[11px] sm:text-xs"
            style={{
              color: theme === 'dark' ? '#9CA3AF' : '#374151',
            }}
          >
            {formattedDate}
          </div>
          <div 
            className="text-[11px] sm:text-xs"
            style={{
              color: theme === 'dark' ? '#9CA3AF' : '#374151',
            }}
          >
            {formattedTime}
          </div>
        </div>

        {/* System Status Badge */}
        <SystemStatusBadge 
          status={systemStatus} 
          isWebSocketConnected={isWebSocketConnected}
        />
      </div>
    </header>
  );
});

interface SystemStatusBadgeProps {
  status: SystemStatusType;
  isWebSocketConnected: boolean;
}

function SystemStatusBadge({ status, isWebSocketConnected }: SystemStatusBadgeProps) {
  const getStatusConfig = () => {
    if (!isWebSocketConnected) {
      return {
        label: 'Offline',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        textColor: 'text-red-700 dark:text-red-400',
        borderColor: 'border-red-200 dark:border-red-800',
        dotColor: 'bg-red-500',
      };
    }

    switch (status) {
      case 'connected':
        return {
          label: 'Online',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-700 dark:text-green-400',
          borderColor: 'border-green-200 dark:border-green-800',
          dotColor: 'bg-[#3ED98A]',
        };
      case 'disconnected':
        return {
          label: 'Offline',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          textColor: 'text-red-700 dark:text-red-400',
          borderColor: 'border-red-200 dark:border-red-800',
          dotColor: 'bg-red-500',
        };
      case 'unknown':
      default:
        return {
          label: 'Warning',
          bgColor: 'bg-amber-50 dark:bg-amber-900/20',
          textColor: 'text-amber-700 dark:text-amber-400',
          borderColor: 'border-amber-200 dark:border-amber-800',
          dotColor: 'bg-amber-500',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div 
      className={`flex items-center justify-center gap-2 sm:gap-3 min-w-0 sm:min-w-[180px] h-12 sm:h-[80px] px-3.5 sm:px-6 ${config.bgColor} ${config.textColor} border sm:border-2 ${config.borderColor} rounded-lg`}
    >
      <div className="flex flex-col items-center">
        <div 
          className="hidden sm:block text-xs uppercase font-semibold"
          style={{
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}
        >
          SYSTEM STATUS
        </div>
        <div className="flex items-center gap-2">
          <div 
            className={`w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full ${config.dotColor}`}
            role="status"
            aria-label={`System status: ${config.label}`}
          />
          <span className="font-bold text-xs sm:text-sm">
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { InfoTooltip } from '@/components/common/InfoTooltip';
import { PlayerNavPill } from '@/features/gamification';

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
  greeting?: string;
}

/**
 * Dashboard Header Component - Clean, uncluttered header with subtle live status indicator
 */
export const DashboardHeader = React.memo(function DashboardHeader({
  title,
  subtitle,
  systemStatus,
  isWebSocketConnected = true,
  greeting = 'Welcome to EcoStep',
}: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    month: 'short',
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
      className="top flex flex-col sm:flex-row mb-5"
    >
      {/* Title and Subtitle Section */}
      <div className="title flex flex-col min-w-0">
        <div className="gr text-[15px] font-medium text-[var(--greeting)]">
          {greeting}
        </div>
        <h1 
          className="text-[44px] font-[500] tracking-[-0.02em] mt-1 text-[var(--t)] leading-tight"
        >
          {title}
        </h1>
        <p className="sub text-[15px] text-[var(--mu)] mt-1.5">
          {subtitle}
        </p>
      </div>

      {/* Date/Time, Status Pill, and User Chip Section */}
      <div className="meta flex items-center">
        {/* Date & Time Display */}
        <span className="meta-time text-[13px] text-[var(--mu)] font-normal tabular-nums flex items-center whitespace-nowrap">
          <Calendar className="h-3.5 w-3.5 opacity-70 shrink-0 mr-1.5 date-icon" strokeWidth={2} />
          <span className="date-text">{formattedDate}</span>
          <span className="date-sep mx-1.5 opacity-40">·</span>
          <span className="time-text">{formattedTime}</span>
        </span>

        {/* Subtle Live System Status Pill */}
        <SystemStatusInfo
          status={systemStatus} 
          isWebSocketConnected={isWebSocketConnected}
        />

        {/* Guest Gamification Player Entry / Profile Pill */}
        <PlayerNavPill />
      </div>
    </header>
  );
});

interface SystemStatusInfoProps {
  status: SystemStatusType;
  isWebSocketConnected: boolean;
}

function SystemStatusInfo({ status, isWebSocketConnected }: SystemStatusInfoProps) {
  const getStatusConfig = () => {
    if (!isWebSocketConnected) {
      return {
        label: 'Offline',
        statusKey: 'disconnected',
        dotColor: 'bg-[#EF4444]',
        statusClass: 'status-offline',
        title: 'System Status: Offline',
        description: 'The real-time connection to the EcoStep IoT stream is currently disconnected. The system will automatically attempt to reconnect.',
        technicalNote: 'WebSocket telemetry link is disconnected.',
      };
    }

    switch (status) {
      case 'connected':
        return {
          label: 'Online',
          statusKey: 'connected',
          dotColor: 'bg-[#3ED98A]',
          pulseColor: 'bg-[#3ED98A]',
          statusClass: 'status-online',
          title: 'System Status: Online',
          description: 'All EcoStep hardware telemetry and database services are connected and operating normally. As students walk across the piezoelectric tiles, live readings stream in real time.',
          technicalNote: 'WebSocket telemetry: Connected. Database: Healthy. (Zero footsteps is normal when the tile is at rest).',
        };
      case 'disconnected':
        return {
          label: 'Offline',
          statusKey: 'disconnected',
          dotColor: 'bg-[#EF4444]',
          statusClass: 'status-offline',
          title: 'System Status: Disconnected',
          description: 'The backend database or telemetry service is reporting a disconnection. Data updates may be paused until connectivity restores.',
          technicalNote: 'Database service is disconnected or unreachable.',
        };
      case 'unknown':
      default:
        return {
          label: 'Standby',
          statusKey: 'unknown',
          dotColor: 'bg-[#F59E0B] bg-[#F5A623]',
          statusClass: 'status-standby',
          title: 'System Status: Standby',
          description: 'EcoStep is in active standby and ready for footsteps. Zero recorded footsteps is normal when the tile is at rest and does not indicate a system fault.',
          technicalNote: 'Telemetry receiver is listening. Sensor heartbeat pending next active compression.',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div 
      className={`status-pill ${config.statusClass}`}
    >
      <span className="relative flex h-2 w-2 flex-shrink-0">
        {config.pulseColor && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pulseColor}`} />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`}
          role="status"
          aria-label={`System status: ${config.statusKey}`}
          style={config.statusKey === 'unknown' ? { backgroundColor: '#F5A623' } : undefined}
        />
      </span>
      <span>{config.label}</span>
      <span className="status-pill-info inline-flex items-center">
        <InfoTooltip
          title={config.title}
          description={config.description}
          technicalNote={config.technicalNote}
          size={16}
          position="bottom"
          align="right"
          ariaLabel={`View operating status details for ${config.label}`}
        />
      </span>
    </div>
  );
}
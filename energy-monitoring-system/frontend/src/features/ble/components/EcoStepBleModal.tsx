import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bluetooth, 
  Wifi, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Loader2, 
  Eye, 
  EyeOff, 
  Radio, 
  Zap,
  Copy,
  Check
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

import { EcoStepBleClient, BLE_CONFIG } from '../EcoStepBleClient';
import type { 
  BleStatusMessage, 
  WiFiStatusNotification, 
  StepTelemetryNotification 
} from '../types';

interface EcoStepBleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EcoStepBleModal: React.FC<EcoStepBleModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [step, setStep] = useState<1 | 2>(1);
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [copiedFlag, setCopiedFlag] = useState(false);
  
  // Status state
  const [statusText, setStatusText] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error' | 'warning'>('info');
  const [wifiStatus, setWifiStatus] = useState<WiFiStatusNotification | null>(null);
  const [latestTelemetry, setLatestTelemetry] = useState<StepTelemetryNotification | null>(null);

  // Client reference
  const bleClientRef = useRef<EcoStepBleClient | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const ssidInputRef = useRef<HTMLInputElement>(null);

  // Initialize BLE Client
  useEffect(() => {
    const client = new EcoStepBleClient((status: BleStatusMessage) => {
      if (status.message) {
        setStatusText(status.message);
      }
      if (status.type) {
        setStatusType(status.type);
      }

      if (status.state === 'connected') {
        setIsConnecting(false);
        setStep(2);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ecostep:hardware-connected', { detail: { source: 'ble' } }));
        }
      } else if (status.state === 'disconnected') {
        setIsConnecting(false);
        setIsProvisioning(false);
        setStep(1);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ecostep:hardware-disconnected', { detail: { source: 'ble' } }));
        }
      } else if (status.state === 'error') {
        setIsConnecting(false);
        setIsProvisioning(false);
      }

      // Handle real-time notification events from ESP32
      if (status.state === 'notification' && status.payload) {
        const payload = status.payload as any;
        if (payload.event === 'wifi_status') {
          const wifiEvt = payload as WiFiStatusNotification;
          setWifiStatus(wifiEvt);
          if (wifiEvt.status === 'CONNECTING') {
            setIsProvisioning(true);
            setStatusText(`ESP32 is attempting to connect to "${wifiEvt.ssid || ssid}"...`);
            setStatusType('info');
          } else if (wifiEvt.status === 'CONNECTED') {
            setIsProvisioning(false);
            setStatusText(`Successfully connected to Wi-Fi! Assigned IP: ${wifiEvt.ip || '192.168.1.xxx'}`);
            setStatusType('success');
          } else if (wifiEvt.status === 'FAILED') {
            setIsProvisioning(false);
            setStatusText(`Wi-Fi connection failed: ${wifiEvt.error || 'Please check SSID and password'}`);
            setStatusType('error');
          }
        } else if (payload.event === 'step') {
          setLatestTelemetry(payload as StepTelemetryNotification);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ecostep:hardware-connected', {
              detail: {
                reading: {
                  power: payload.power,
                  voltage: payload.voltage,
                  current: payload.current,
                  energy: payload.energy,
                  stepCount: payload.stepCount,
                  timestamp: payload.timestamp || new Date().toISOString(),
                }
              }
            }));
          }
        }
      }
    });

    bleClientRef.current = client;

    return () => {
      client.disconnect();
    };
  }, [ssid]);

  const isSupported = bleClientRef.current?.isSupported() ?? true;
  const isSecure = bleClientRef.current?.isSecureContext() ?? true;

  // Browser check for Brave or Chromium flag URL
  const isBrave = typeof window !== 'undefined' && Boolean((navigator as any)?.brave);
  const flagUrl = isBrave 
    ? 'brave://flags/#enable-web-bluetooth' 
    : 'chrome://flags/#enable-web-bluetooth';

  const isGloballyDisabled = statusText.toLowerCase().includes('globally disabled');

  const handleCopyFlagUrl = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(flagUrl);
        setCopiedFlag(true);
        setTimeout(() => setCopiedFlag(false), 2000);
      }
    } catch {
      // fallback
    }
  };

  // Reset or focus on open
  useEffect(() => {
    if (isOpen) {
      if (step === 2 && ssidInputRef.current) {
        ssidInputRef.current.focus();
      }
    }
  }, [isOpen, step]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (bleClientRef.current?.isConnected()) {
      bleClientRef.current.disconnect();
    }
    setStep(1);
    setStatusText('');
    setWifiStatus(null);
    setLatestTelemetry(null);
    setIsConnecting(false);
    setIsProvisioning(false);
    onClose();
  }, [onClose]);

  // Pair & Connect action
  const handleConnect = async () => {
    if (!bleClientRef.current) return;
    setIsConnecting(true);
    setStatusText('');
    try {
      await bleClientRef.current.connect();
    } catch {
      setIsConnecting(false);
    }
  };

  // Simulated connect for testing without BLE hardware or when flags are disabled
  const handleSimulatedConnect = async () => {
    if (!bleClientRef.current) return;
    setIsConnecting(true);
    setStatusText('');
    try {
      await bleClientRef.current.connectSimulated();
    } catch {
      setIsConnecting(false);
    }
  };

  // Send Wi-Fi credentials action
  const handleSendCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssid.trim()) {
      setStatusText('Please enter your Wi-Fi network name (SSID).');
      setStatusType('error');
      return;
    }
    if (!bleClientRef.current) return;

    try {
      setIsProvisioning(true);
      await bleClientRef.current.sendWiFiCredentials(ssid, password);
    } catch {
      setIsProvisioning(false);
    }
  };

  if (!isOpen) return null;

  const modalElement = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ble-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        ref={modalRef}
        className="relative z-10 w-full max-w-lg rounded-2xl border p-5 sm:p-6 shadow-2xl my-auto max-h-[calc(100dvh-32px)] overflow-y-auto transition-all duration-300"
        style={{
          fontFamily: "var(--font-dm, 'DM Sans', sans-serif)",
          backgroundColor: isDark ? '#0D1B14' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
          color: 'var(--t)',
          boxShadow: isDark 
            ? '0 30px 60px -15px rgba(0, 0, 0, 0.95), 0 0 1px 1px rgba(25, 212, 106, 0.25)' 
            : '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#19D46A]">
              <Bluetooth className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 id="ble-modal-title" className="text-base sm:text-lg font-bold tracking-tight text-[var(--t)] flex items-center gap-2">
                EcoStep Wi-Fi Provisioning
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#19D46A] border border-emerald-500/30">
                  Web BLE
                </span>
              </h2>
              <p className="text-xs text-[var(--mu)] mt-0.5">
                Direct browser pairing with the EcoStep Harvester device
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-[var(--mu)] hover:text-[var(--t)] hover:bg-[var(--soft)] transition-colors focus:outline-none cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Browser compatibility check warning */}
        {(!isSupported || !isSecure) && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex gap-2.5 items-start">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">
                {!isSupported ? 'Web Bluetooth Not Supported' : 'Secure Context (HTTPS) Required'}
              </p>
              <p className="mt-1 text-gray-300">
                {!isSupported 
                  ? 'Your current browser does not support the Web Bluetooth API. Please open this website in Google Chrome, Microsoft Edge, or Samsung Internet. On iOS devices, you can use the free Bluefy browser app.'
                  : 'Web Bluetooth requires an HTTPS connection or localhost. Please ensure you are viewing this page over a secure URL.'}
              </p>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="mt-5 space-y-5">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 1 ? 'bg-[#19D46A] text-[#0D1B14]' : 'bg-emerald-500/15 text-[#19D46A] border border-emerald-500/30'
              }`}>
                1
              </span>
              <span className={`text-xs font-semibold ${step === 1 ? 'text-[var(--t)]' : 'text-[var(--mu)]'}`}>
                Pair BLE Device
              </span>
            </div>
            <div className="h-[1px] flex-1 mx-3 bg-[var(--line)]" />
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 2 ? 'bg-[#19D46A] text-[#0D1B14]' : 'bg-[var(--soft)] text-[var(--mu)] border border-[var(--line)]'
              }`}>
                2
              </span>
              <span className={`text-xs font-semibold ${step === 2 ? 'text-[var(--t)]' : 'text-[var(--mu)]'}`}>
                Configure Wi-Fi
              </span>
            </div>
          </div>

          {/* STEP 1: Scan & Pair */}
          {step === 1 && (
            <div 
              className="rounded-2xl border p-5 text-center"
              style={{
                backgroundColor: isDark ? '#12241A' : 'var(--soft)',
                borderColor: 'var(--line)',
              }}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
                <Radio className={`h-7 w-7 ${isConnecting ? 'animate-pulse text-[#19D46A]' : ''}`} />
              </div>
              <h3 className="text-base font-bold text-[var(--t)] tracking-wide">
                Pair with {BLE_CONFIG.deviceName}
              </h3>
              <p className="text-xs text-[var(--mu)] mt-1.5 max-w-sm mx-auto leading-relaxed">
                Make sure your EcoStep Harvester ESP32 is powered on and within Bluetooth range of this computer or mobile device.
              </p>

              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  id="ble-connect-btn"
                  onClick={handleConnect}
                  disabled={isConnecting || !isSupported}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: '#19D46A', color: '#0D1B14' }}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scanning & Connecting...
                    </>
                  ) : (
                    <>
                      <Bluetooth className="h-4 w-4" />
                      Pair with EcoStep via Bluetooth
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="ble-simulated-connect-btn"
                  onClick={handleSimulatedConnect}
                  disabled={isConnecting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-[var(--t)] bg-[var(--panel)] hover:bg-[var(--soft)] border border-[var(--line)] transition-all duration-200 cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5 text-[#19D46A]" />
                  Blocked or No Hardware? Try Demo / Simulation Mode
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Wi-Fi Credentials Form */}
          {step === 2 && (
            <form onSubmit={handleSendCredentials} className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#19D46A]"></span>
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-[#19D46A]">
                      Connected to {BLE_CONFIG.deviceName} {bleClientRef.current?.isSimulation ? '(Demo Mode)' : ''}
                    </p>
                    <p className="text-[11px] text-[var(--mu)]">GATT Service Active & Subscribed</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    bleClientRef.current?.disconnect();
                    setStep(1);
                  }}
                  className="text-xs text-[var(--mu)] hover:text-[var(--t)] underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>

              {/* Wi-Fi SSID Field */}
              <div>
                <label 
                  htmlFor="ble-ssid" 
                  className="block text-xs font-semibold text-[var(--mu)] uppercase tracking-wider mb-1.5"
                >
                  Wi-Fi Network Name (SSID)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--mu)]">
                    <Wifi className="h-4 w-4" />
                  </div>
                  <input
                    ref={ssidInputRef}
                    id="ble-ssid"
                    type="text"
                    required
                    value={ssid}
                    onChange={(e) => setSsid(e.target.value)}
                    placeholder="e.g. Campus-WiFi or HomeNetwork"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-[var(--line)] text-[var(--t)] placeholder-[var(--mu)] focus:outline-none focus:border-[#19D46A] transition-colors"
                    style={{ 
                      backgroundColor: isDark ? '#12241A' : 'var(--soft)',
                      fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" 
                    }}
                  />
                </div>
              </div>

              {/* Wi-Fi Password Field */}
              <div>
                <label 
                  htmlFor="ble-pass" 
                  className="block text-xs font-semibold text-[var(--mu)] uppercase tracking-wider mb-1.5"
                >
                  Wi-Fi Password
                </label>
                <div className="relative">
                  <input
                    id="ble-pass"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter network password (leave empty if open)"
                    className="w-full pl-3 pr-10 py-2.5 text-sm rounded-xl border border-[var(--line)] text-[var(--t)] placeholder-[var(--mu)] focus:outline-none focus:border-[#19D46A] transition-colors"
                    style={{ 
                      backgroundColor: isDark ? '#12241A' : 'var(--soft)',
                      fontFamily: "var(--font-dm, 'DM Sans', sans-serif)" 
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--mu)] hover:text-[var(--t)] transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[var(--mu)] mt-1">
                  Credentials are sent securely via local BLE direct to your ESP32.
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="ble-send-btn"
                  disabled={isProvisioning || !ssid.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: '#19D46A', color: '#0D1B14' }}
                >
                  {isProvisioning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#0D1B14]" />
                      Saving & Connecting ESP32...
                    </>
                  ) : (
                    <>
                      <Wifi className="h-4 w-4" />
                      Save & Connect
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Real-time Status Box */}
          {statusText && (
            <div 
              id="ble-status-box"
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 transition-all duration-200 ${
                statusType === 'success' 
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300' 
                  : statusType === 'error'
                  ? 'bg-red-500/15 border border-red-500/40 text-red-300'
                  : statusType === 'warning'
                  ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                  : 'bg-blue-500/15 border border-blue-500/40 text-blue-300'
              }`}
            >
              {statusType === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-[#19D46A] shrink-0 mt-0.5" />
              ) : statusType === 'error' ? (
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              ) : statusType === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Loader2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5 animate-spin" />
              )}
              <div className="flex-1 font-medium leading-relaxed">
                {statusText}
                {wifiStatus?.status === 'CONNECTED' && wifiStatus.ip && (
                  <div className="mt-1 text-[11px] text-emerald-300 font-semibold tabular-nums bg-emerald-950/40 px-2 py-1 rounded inline-block">
                    IP Address: {wifiStatus.ip}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dedicated Web Bluetooth API Globally Disabled Troubleshooting Guide */}
          {isGloballyDisabled && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-300 text-sm">
                    How to Enable Web Bluetooth in {isBrave ? 'Brave Browser' : 'Chromium'}
                  </h4>
                  <p className="mt-1 text-[var(--mu)] leading-relaxed text-[11px]">
                    {isBrave ? 'Brave' : 'Your browser'} disables the Web Bluetooth API by default for privacy. To allow direct ESP32 Wi-Fi pairing:
                  </p>
                </div>
              </div>

              <div className="bg-[var(--soft)] rounded-lg p-3 border border-[var(--line)] space-y-2 text-[11px]">
                <p className="text-[var(--t)] font-medium">1. Open a new tab and paste this URL into your address bar:</p>
                <div className="flex items-center gap-2 bg-[var(--panel)] px-3 py-1.5 rounded-lg border border-[var(--line)] text-emerald-400">
                  <span className="flex-1 select-all truncate">{flagUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopyFlagUrl}
                    className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-[#19D46A] font-medium transition-colors cursor-pointer"
                  >
                    {copiedFlag ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy URL
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[var(--t)] space-y-1 pt-1">
                  <p>2. Locate <strong className="text-[var(--t)]">Web Bluetooth</strong> and change it from <span className="text-[var(--mu)]">Default/Disabled</span> to <strong className="text-emerald-400">Enabled</strong>.</p>
                  <p>3. Click the blue <strong className="text-[var(--t)]">Relaunch</strong> button at the bottom of the browser.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[var(--line)]">
                <span className="text-[11px] text-[var(--mu)]">
                  Or use standard Google Chrome or Microsoft Edge.
                </span>
                <button
                  type="button"
                  onClick={handleSimulatedConnect}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#19D46A] hover:bg-[#16C763] text-[#0D1B14] transition-colors cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Proceed in Demo Mode Now
                </button>
              </div>
            </div>
          )}

          {/* Real-Time Step Telemetry Preview (Received from ESP32 notifications) */}
          {latestTelemetry && (
            <div className="p-3 rounded-xl bg-[var(--soft)] border border-[var(--line)] text-xs">
              <div className="flex items-center justify-between text-[var(--t)] font-semibold mb-2">
                <span className="flex items-center gap-1.5 text-[#19D46A]">
                  <Zap className="h-3.5 w-3.5" />
                  Live Harvester Telemetry (BLE)
                </span>
                <span className="text-[10px] text-[var(--mu)] font-normal">Active</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-[var(--panel)] border border-[var(--line)] p-1.5">
                  <div className="text-[10px] text-[var(--mu)]">Steps</div>
                  <div className="text-xs font-bold text-[var(--t)] tabular-nums">{latestTelemetry.steps ?? '--'}</div>
                </div>
                <div className="rounded-lg bg-[var(--panel)] border border-[var(--line)] p-1.5">
                  <div className="text-[10px] text-[var(--mu)]">Voltage</div>
                  <div className="text-xs font-bold text-[var(--t)] tabular-nums">{latestTelemetry.voltage?.toFixed(2) ?? '--'} V</div>
                </div>
                <div className="rounded-lg bg-[var(--panel)] border border-[var(--line)] p-1.5">
                  <div className="text-[10px] text-[var(--mu)]">Power</div>
                  <div className="text-xs font-bold text-[var(--t)] tabular-nums">{latestTelemetry.power?.toFixed(4) ?? '--'} W</div>
                </div>
                <div className="rounded-lg bg-[var(--panel)] border border-[var(--line)] p-1.5">
                  <div className="text-[10px] text-[var(--mu)]">Freq</div>
                  <div className="text-xs font-bold text-[var(--t)] tabular-nums">{latestTelemetry.freq?.toFixed(1) ?? '--'} Hz</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[var(--line)] flex items-center justify-between">
          <div className="text-[11px] text-[var(--mu)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            ESP32 GATT Client v1.0
          </div>
          <button
            type="button"
            id="ble-close-btn"
            onClick={handleClose}
            className="px-4 py-1.5 rounded-full text-xs font-semibold text-[var(--t)] bg-[var(--soft)] hover:bg-[var(--line)] border border-[var(--line)] transition-colors cursor-pointer"
          >
            {wifiStatus?.status === 'CONNECTED' ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalElement, document.body);
  }

  return modalElement;
};

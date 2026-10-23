import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Zap 
} from 'lucide-react';

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
  const [step, setStep] = useState<1 | 2>(1);
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  
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
      } else if (status.state === 'disconnected') {
        setIsConnecting(false);
        setIsProvisioning(false);
        setStep(1);
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
            setStatusText(`✓ Successfully connected to Wi-Fi! Assigned IP: ${wifiEvt.ip || '192.168.1.xxx'}`);
            setStatusType('success');
          } else if (wifiEvt.status === 'FAILED') {
            setIsProvisioning(false);
            setStatusText(`✗ Wi-Fi connection failed: ${wifiEvt.error || 'Please check SSID and password'}`);
            setStatusType('error');
          }
        } else if (payload.event === 'step') {
          setLatestTelemetry(payload as StepTelemetryNotification);
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
    } catch (err: any) {
      // User cancelled device chooser or pairing failed
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
    } catch (err: any) {
      setIsProvisioning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-200"
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
        className="relative w-full max-w-lg rounded-2xl border border-emerald-500/20 bg-[#0B132B]/95 p-6 text-white shadow-2xl backdrop-blur-md transition-all duration-300"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(57, 255, 136, 0.1)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#39FF88]">
              <Bluetooth className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h2 id="ble-modal-title" className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                EcoStep Wi-Fi Provisioning
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#39FF88] border border-emerald-500/30">
                  Web BLE
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Direct browser pairing with the EcoStep Harvester device
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#39FF88]"
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
                step === 1 ? 'bg-[#39FF88] text-[#0B132B]' : 'bg-emerald-500/20 text-[#39FF88] border border-emerald-500/30'
              }`}>
                1
              </span>
              <span className={`text-xs font-medium ${step === 1 ? 'text-white' : 'text-gray-400'}`}>
                Pair BLE Device
              </span>
            </div>
            <div className="h-[1px] flex-1 mx-3 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 2 ? 'bg-[#39FF88] text-[#0B132B]' : 'bg-white/10 text-gray-400'
              }`}>
                2
              </span>
              <span className={`text-xs font-medium ${step === 2 ? 'text-white' : 'text-gray-400'}`}>
                Configure Wi-Fi
              </span>
            </div>
          </div>

          {/* STEP 1: Scan & Pair */}
          {step === 1 && (
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
                <Radio className={`h-7 w-7 ${isConnecting ? 'animate-pulse text-[#39FF88]' : ''}`} />
              </div>
              <h3 className="text-sm font-semibold text-white">
                Pair with {BLE_CONFIG.deviceName}
              </h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Make sure your EcoStep Harvester ESP32 is powered on and within Bluetooth range of this computer or mobile device.
              </p>

              <div className="mt-5">
                <button
                  type="button"
                  id="ble-connect-btn"
                  onClick={handleConnect}
                  disabled={isConnecting || !isSupported}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              </div>
            </div>
          )}

          {/* STEP 2: Wi-Fi Credentials Form */}
          {step === 2 && (
            <form onSubmit={handleSendCredentials} className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#39FF88]"></span>
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-[#39FF88]">Connected to {BLE_CONFIG.deviceName}</p>
                    <p className="text-[11px] text-gray-400">GATT Service Active & Subscribed</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    bleClientRef.current?.disconnect();
                    setStep(1);
                  }}
                  className="text-xs text-gray-400 hover:text-white underline underline-offset-2 transition-colors"
                >
                  Disconnect
                </button>
              </div>

              {/* Wi-Fi SSID Field */}
              <div>
                <label 
                  htmlFor="ble-ssid" 
                  className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5"
                >
                  Wi-Fi Network Name (SSID)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
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
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#39FF88] focus:ring-1 focus:ring-[#39FF88] transition-colors"
                  />
                </div>
              </div>

              {/* Wi-Fi Password Field */}
              <div>
                <label 
                  htmlFor="ble-pass" 
                  className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5"
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
                    className="w-full pl-3 pr-10 py-2.5 text-sm rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#39FF88] focus:ring-1 focus:ring-[#39FF88] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Credentials are sent securely via local BLE direct to your ESP32.
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="ble-send-btn"
                  disabled={isProvisioning || !ssid.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-400 text-[#0B132B] shadow-lg shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {isProvisioning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#0B132B]" />
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
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-200' 
                  : statusType === 'error'
                  ? 'bg-red-500/15 border border-red-500/40 text-red-200'
                  : statusType === 'warning'
                  ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200'
                  : 'bg-blue-500/15 border border-blue-500/40 text-blue-200'
              }`}
            >
              {statusType === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-[#39FF88] shrink-0 mt-0.5" />
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
                  <div className="mt-1 text-[11px] text-emerald-300 font-mono bg-emerald-950/40 px-2 py-1 rounded inline-block">
                    IP Address: {wifiStatus.ip}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Real-Time Step Telemetry Preview (Received from ESP32 notifications) */}
          {latestTelemetry && (
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
              <div className="flex items-center justify-between text-gray-300 font-semibold mb-2">
                <span className="flex items-center gap-1.5 text-[#39FF88]">
                  <Zap className="h-3.5 w-3.5" />
                  Live Harvester Telemetry (BLE)
                </span>
                <span className="text-[10px] text-gray-400 font-normal">Active</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-black/30 p-1.5">
                  <div className="text-[10px] text-gray-400">Steps</div>
                  <div className="text-xs font-bold text-white">{latestTelemetry.steps ?? '--'}</div>
                </div>
                <div className="rounded-lg bg-black/30 p-1.5">
                  <div className="text-[10px] text-gray-400">Voltage</div>
                  <div className="text-xs font-bold text-white">{latestTelemetry.voltage?.toFixed(2) ?? '--'} V</div>
                </div>
                <div className="rounded-lg bg-black/30 p-1.5">
                  <div className="text-[10px] text-gray-400">Power</div>
                  <div className="text-xs font-bold text-white">{latestTelemetry.power?.toFixed(4) ?? '--'} W</div>
                </div>
                <div className="rounded-lg bg-black/30 p-1.5">
                  <div className="text-[10px] text-gray-400">Freq</div>
                  <div className="text-xs font-bold text-white">{latestTelemetry.freq?.toFixed(1) ?? '--'} Hz</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            ESP32 GATT Client v1.0
          </div>
          <button
            type="button"
            id="ble-close-btn"
            onClick={handleClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            {wifiStatus?.status === 'CONNECTED' ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

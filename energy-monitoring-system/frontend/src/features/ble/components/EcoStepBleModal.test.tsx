import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BleProvider, SAVED_BLE_DEVICE_STORAGE_KEY } from '@/contexts/BleContext';
import { SAVED_WIFI_SSIDS_STORAGE_KEY } from '../wifiNetworks';
import { EcoStepBleModal } from './EcoStepBleModal';
import { EcoStepBleButton } from './EcoStepBleButton';

// Mock EcoStepBleClient
const mockConnect = vi.fn();
const mockConnectSimulated = vi.fn();
const mockReconnectSavedDevice = vi.fn().mockResolvedValue(false);
const mockDisconnect = vi.fn();
const mockSendCredentials = vi.fn();
const mockRequestWiFiScan = vi.fn().mockResolvedValue(undefined);
const mockIsConnected = vi.fn(() => false);
let capturedCallback: any = null;

vi.mock('../EcoStepBleClient', () => {
  return {
    BLE_CONFIG: {
      serviceUuid: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
      charWriteUuid: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
      charNotifyUuid: 'beb5483e-36e1-4688-b7f5-ea07361b26a9',
      deviceName: 'EcoStep-Harvester',
    },
    EcoStepBleClient: class {
      device: any = { id: 'esp32-tile-01', name: 'EcoStep-Harvester' };
      isSimulation = false;
      constructor(callback: any) {
        capturedCallback = callback;
      }
      isSupported() {
        return true;
      }
      isSecureContext() {
        return true;
      }
      isConnected = mockIsConnected;
      connect = mockConnect;
      connectSimulated = mockConnectSimulated;
      reconnectSavedDevice = mockReconnectSavedDevice;
      disconnect = mockDisconnect;
      sendWiFiCredentials = mockSendCredentials;
      requestWiFiScan = mockRequestWiFiScan;
    },
  };
});

describe('EcoStep BLE Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockIsConnected.mockReturnValue(false);
    mockReconnectSavedDevice.mockResolvedValue(false);
    capturedCallback = null;

    // Mock laptop Wi-Fi scan endpoint by default
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          source: 'laptop',
          networks: [
            { ssid: 'Laptop-Campus-WiFi', rssi: -48, secure: true },
            { ssid: 'Laptop-Guest', rssi: -67, secure: false },
          ],
        }),
      }),
    );
  });

  describe('EcoStepBleButton', () => {
    it('renders the trigger button with default label and icon', () => {
      render(
        <BleProvider>
          <EcoStepBleButton />
        </BleProvider>,
      );
      const btn = screen.getByRole('button', { name: /setup ecostep harvester wi-fi/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveTextContent('Setup Harvester Wi-Fi');
    });

    it('opens modal dialog when trigger button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <BleProvider>
          <EcoStepBleButton />
        </BleProvider>,
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /setup ecostep harvester wi-fi/i });
      await user.click(btn);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Connect Tile to Wi-Fi')).toBeInTheDocument();
    });
  });

  describe('EcoStepBleModal', () => {
    it('renders modal in Step 1 with Pair button and Simulation button', () => {
      render(<EcoStepBleModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Connect Tile to Wi-Fi')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pair with ecostep via bluetooth/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try demo \/ simulation mode/i })).toBeInTheDocument();
    });

    it('invokes onClose when Close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<EcoStepBleModal isOpen={true} onClose={onClose} />);

      const closeBtn = screen.getByRole('button', { name: /close modal/i });
      await user.click(closeBtn);

      expect(onClose).toHaveBeenCalled();
    });

    it('invokes connect when Pair button is clicked', async () => {
      const user = userEvent.setup();
      mockConnect.mockResolvedValue(true);
      render(<EcoStepBleModal isOpen={true} onClose={vi.fn()} />);

      const pairBtn = screen.getByRole('button', { name: /pair with ecostep via bluetooth/i });
      await user.click(pairBtn);

      expect(mockConnect).toHaveBeenCalled();
    });

    it('invokes connectSimulated when Simulation button is clicked', async () => {
      const user = userEvent.setup();
      mockConnectSimulated.mockResolvedValue(true);
      render(<EcoStepBleModal isOpen={true} onClose={vi.fn()} />);

      const simBtn = screen.getByRole('button', { name: /try demo \/ simulation mode/i });
      await user.click(simBtn);

      expect(mockConnectSimulated).toHaveBeenCalled();
    });

    it('displays troubleshooting guide when Web Bluetooth API is globally disabled', async () => {
      render(<EcoStepBleModal isOpen={true} onClose={vi.fn()} />);

      await waitFor(() => {
        capturedCallback({
          state: 'error',
          message: 'Web Bluetooth API globally disabled.',
          type: 'error',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/How to Enable Web Bluetooth in/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /copy url/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /proceed in demo mode now/i })).toBeInTheDocument();
      });
    });

    it('scans laptop Wi-Fi networks without depending on ESP32 and saves SSID only (never password)', async () => {
      const user = userEvent.setup();
      render(
        <BleProvider>
          <EcoStepBleModal isOpen={true} onClose={vi.fn()} />
        </BleProvider>,
      );

      expect(capturedCallback).toBeDefined();
      await waitFor(() => {
        capturedCallback({
          state: 'connected',
          message: 'Connected to EcoStep-Harvester!',
          type: 'success',
        });
      });

      // Laptop networks appear and ESP32 Wi-Fi scan is NOT called
      await waitFor(() => {
        expect(screen.getByText('Laptop-Campus-WiFi')).toBeInTheDocument();
        expect(screen.getByText('Laptop-Guest')).toBeInTheDocument();
      });
      expect(mockRequestWiFiScan).not.toHaveBeenCalled();

      // Click a scanned laptop network to populate SSID
      await user.click(screen.getByText('Laptop-Campus-WiFi'));
      const ssidInput = screen.getByLabelText(/wi-fi network name/i) as HTMLInputElement;
      const passInput = screen.getByLabelText(/wi-fi password/i);
      expect(ssidInput.value).toBe('Laptop-Campus-WiFi');

      mockSendCredentials.mockResolvedValue(undefined);
      await user.type(passInput, 'Secret123');

      const submitBtn = screen.getByRole('button', { name: /save & connect/i });
      await user.click(submitBtn);

      expect(mockSendCredentials).toHaveBeenCalledWith('Laptop-Campus-WiFi', 'Secret123');

      // Verify SSID is saved and password is NEVER stored in localStorage
      const savedSsids = JSON.parse(localStorage.getItem(SAVED_WIFI_SSIDS_STORAGE_KEY) || '[]');
      expect(savedSsids).toContain('Laptop-Campus-WiFi');
      expect(JSON.stringify(localStorage)).not.toContain('Secret123');

      // Verify BLE device metadata is saved
      const savedBle = JSON.parse(localStorage.getItem(SAVED_BLE_DEVICE_STORAGE_KEY) || 'null');
      expect(savedBle).toMatchObject({
        id: 'esp32-tile-01',
        name: 'EcoStep-Harvester',
        lastSsid: 'Laptop-Campus-WiFi',
      });
    });

    it('falls back to saved SSIDs when hosted browser cannot scan laptop Wi-Fi', async () => {
      localStorage.setItem(SAVED_WIFI_SSIDS_STORAGE_KEY, JSON.stringify(['Saved-Office-WiFi']));
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Not available on Vercel')));

      render(
        <BleProvider>
          <EcoStepBleModal isOpen={true} onClose={vi.fn()} />
        </BleProvider>,
      );

      await waitFor(() => {
        capturedCallback({
          state: 'connected',
          message: 'Connected to EcoStep-Harvester!',
          type: 'success',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Saved-Office-WiFi')).toBeInTheDocument();
      });
      expect(mockRequestWiFiScan).not.toHaveBeenCalled();
    });

    it('keeps BLE connection alive when modal unmounts and remounts under BleProvider', async () => {
      const { rerender } = render(
        <BleProvider>
          <EcoStepBleModal isOpen={true} onClose={vi.fn()} />
        </BleProvider>,
      );

      await waitFor(() => {
        capturedCallback({
          state: 'connected',
          message: 'Connected to EcoStep-Harvester!',
          type: 'success',
        });
      });

      // Simulate navigating away (modal unmounts completely while BleProvider stays mounted)
      rerender(
        <BleProvider>
          <div data-testid="other-page">Dashboard</div>
        </BleProvider>,
      );
      expect(mockDisconnect).not.toHaveBeenCalled();

      // Navigate back and reopen modal — still connected in Step 2 with already-connected alert
      rerender(
        <BleProvider>
          <EcoStepBleModal isOpen={true} onClose={vi.fn()} />
        </BleProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText(/ESP32 Is Already Connected/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/wi-fi network name/i)).toBeInTheDocument();
      });
    });

    it('displays Wi-Fi connected notification with IP address', async () => {
      render(
        <BleProvider>
          <EcoStepBleModal isOpen={true} onClose={vi.fn()} />
        </BleProvider>,
      );

      await waitFor(() => {
        capturedCallback({
          state: 'notification',
          payload: {
            event: 'wifi_status',
            status: 'CONNECTED',
            ssid: 'Lab-WiFi',
            ip: '192.168.1.150',
          },
        });
      });

      await waitFor(() => {
        const statusBox = document.getElementById('ble-status-box');
        expect(statusBox).toBeInTheDocument();
        expect(statusBox).toHaveTextContent(/Successfully connected to Wi-Fi/i);
        expect(statusBox).toHaveTextContent('192.168.1.150');
      });
    });

    it('warns the admin when reopening the modal while ESP32 is still connected and allows disconnect', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <BleProvider>
          <EcoStepBleModal isOpen={false} onClose={vi.fn()} />
        </BleProvider>,
      );

      await waitFor(() => {
        capturedCallback({
          state: 'connected',
          message: 'Connected to EcoStep-Harvester!',
          type: 'success',
        });
      });

      rerender(
        <BleProvider>
          <EcoStepBleModal isOpen={true} onClose={vi.fn()} />
        </BleProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText(/ESP32 Is Already Connected/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /keep current connection/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /disconnect & reconnect/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /disconnect & reconnect/i }));
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });
});

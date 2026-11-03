import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EcoStepBleModal } from './EcoStepBleModal';
import { EcoStepBleButton } from './EcoStepBleButton';

// Mock EcoStepBleClient
const mockConnect = vi.fn();
const mockConnectSimulated = vi.fn();
const mockDisconnect = vi.fn();
const mockSendCredentials = vi.fn();
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
      isConnected() {
        return false;
      }
      connect = mockConnect;
      connectSimulated = mockConnectSimulated;
      disconnect = mockDisconnect;
      sendWiFiCredentials = mockSendCredentials;
    },
  };
});

describe('EcoStep BLE Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedCallback = null;
  });

  describe('EcoStepBleButton', () => {
    it('renders the trigger button with default label and icon', () => {
      render(<EcoStepBleButton />);
      const btn = screen.getByRole('button', { name: /setup ecostep harvester wi-fi/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveTextContent('Setup Harvester Wi-Fi');
    });

    it('opens modal dialog when trigger button is clicked', async () => {
      const user = userEvent.setup();
      render(<EcoStepBleButton />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /setup ecostep harvester wi-fi/i });
      await user.click(btn);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('EcoStep Wi-Fi Provisioning')).toBeInTheDocument();
    });
  });

  describe('EcoStepBleModal', () => {
    it('renders modal in Step 1 with Pair button and Simulation button', () => {
      render(<EcoStepBleModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('EcoStep Wi-Fi Provisioning')).toBeInTheDocument();
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

    it('progresses to Step 2 when device connects and displays Wi-Fi form', async () => {
      const user = userEvent.setup();
      render(<EcoStepBleModal isOpen={true} onClose={vi.fn()} />);

      // Simulate connection callback
      expect(capturedCallback).toBeDefined();
      await waitFor(() => {
        capturedCallback({
          state: 'connected',
          message: 'Connected to EcoStep-Harvester!',
          type: 'success',
        });
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/wi-fi network name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/wi-fi password/i)).toBeInTheDocument();
      });

      // Submit credentials
      mockSendCredentials.mockResolvedValue(undefined);
      const ssidInput = screen.getByLabelText(/wi-fi network name/i);
      const passInput = screen.getByLabelText(/wi-fi password/i);

      await user.type(ssidInput, 'Lab-WiFi');
      await user.type(passInput, 'Secret123');

      const submitBtn = screen.getByRole('button', { name: /save & connect/i });
      await user.click(submitBtn);

      expect(mockSendCredentials).toHaveBeenCalledWith('Lab-WiFi', 'Secret123');
    });

    it('displays Wi-Fi connected notification with IP address', async () => {
      render(<EcoStepBleModal isOpen={true} onClose={vi.fn()} />);

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
  });
});

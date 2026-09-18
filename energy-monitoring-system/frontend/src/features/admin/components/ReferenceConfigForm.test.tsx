/**
 * ReferenceConfigForm Component Unit Tests
 * 
 * Task 5.5: Write component tests for diagnostic UI
 * 
 * Requirements:
 * - Test: validates weight, energy, and tolerance ranges
 * - Test: submits valid data successfully
 * - Test: displays current configuration
 * - Test: disables submit when validation fails
 * - Test: real-time validation feedback
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReferenceConfigForm } from './ReferenceConfigForm';
import type { ReferenceConfig } from '@/types/diagnostic.types';

// Mock hooks
const mockUseReferenceConfig = vi.fn();
const mockCreateMutateAsync = vi.fn();
const mockUseCreateReferenceConfig = vi.fn();

vi.mock('../hooks/useDiagnostics', () => ({
  useReferenceConfig: () => mockUseReferenceConfig(),
  useCreateReferenceConfig: () => mockUseCreateReferenceConfig(),
}));

// Mock Toast
const mockShowToast = vi.fn();
vi.mock('@/components/common/Toast', () => ({
  showToast: (message: string, type: string) => mockShowToast(message, type),
}));

// Helper to render with React Query
const renderReferenceConfigForm = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ReferenceConfigForm />
    </QueryClientProvider>
  );
};

describe('ReferenceConfigForm', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();

    // Default mock - no existing config
    mockUseReferenceConfig.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    // Default mock - create mutation
    mockCreateMutateAsync.mockResolvedValue({
      appliedWeightKg: 70,
      expectedEnergyWh: 2.5,
      tolerancePercent: 10,
      createdBy: 'admin@ecostep.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    mockUseCreateReferenceConfig.mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isLoading: false,
    });

    mockShowToast.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Subtask 5.5.6: Form rendering and structure', () => {
    it('should render form header and description', () => {
      renderReferenceConfigForm();

      expect(screen.getByText('Reference Configuration')).toBeInTheDocument();
      expect(
        screen.getByText(/Set baseline values for diagnostic tests/i)
      ).toBeInTheDocument();
    });

    it('should render all three input fields', () => {
      renderReferenceConfigForm();

      expect(screen.getByLabelText(/Applied Weight \(kg\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Expected Energy \(Wh\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tolerance \(%\)/i)).toBeInTheDocument();
    });

    it('should render save button', () => {
      renderReferenceConfigForm();

      expect(
        screen.getByRole('button', { name: /Save Configuration/i })
      ).toBeInTheDocument();
    });

    it('should show default placeholder values', () => {
      renderReferenceConfigForm();

      const weightInput = screen.getByLabelText(/Applied Weight/i) as HTMLInputElement;
      const energyInput = screen.getByLabelText(/Expected Energy/i) as HTMLInputElement;
      const toleranceInput = screen.getByLabelText(/Tolerance/i) as HTMLInputElement;

      expect(weightInput.placeholder).toBe('70');
      expect(energyInput.placeholder).toBe('2.5');
      expect(toleranceInput.placeholder).toBe('10');
    });

    it('should use EcoStep design system card styling', () => {
      renderReferenceConfigForm();

      const container = screen.getByText('Reference Configuration').closest('div');
      expect(container).toHaveClass('rounded-lg');
    });
  });

  describe('Subtask 5.5.7: Display current configuration', () => {
    it('should display existing configuration when available', () => {
      const existingConfig: ReferenceConfig = {
        appliedWeightKg: 75,
        expectedEnergyWh: 3.2,
        tolerancePercent: 12,
        createdBy: 'admin@ecostep.com',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
      };

      mockUseReferenceConfig.mockReturnValue({
        data: existingConfig,
        isLoading: false,
        error: null,
      });

      renderReferenceConfigForm();

      expect(screen.getByText('Current Configuration')).toBeInTheDocument();
      expect(screen.getByText('75 kg')).toBeInTheDocument();
      expect(screen.getByText('3.2 Wh')).toBeInTheDocument();
      expect(screen.getByText('±12%')).toBeInTheDocument();
    });

    it('should display who created the configuration', () => {
      const existingConfig: ReferenceConfig = {
        appliedWeightKg: 70,
        expectedEnergyWh: 2.5,
        tolerancePercent: 10,
        createdBy: 'admin@ecostep.com',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
      };

      mockUseReferenceConfig.mockReturnValue({
        data: existingConfig,
        isLoading: false,
        error: null,
      });

      renderReferenceConfigForm();

      expect(screen.getByText(/Last updated by admin@ecostep.com/i)).toBeInTheDocument();
    });

    it('should format update date correctly', () => {
      const existingConfig: ReferenceConfig = {
        appliedWeightKg: 70,
        expectedEnergyWh: 2.5,
        tolerancePercent: 10,
        createdBy: 'admin@ecostep.com',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
      };

      mockUseReferenceConfig.mockReturnValue({
        data: existingConfig,
        isLoading: false,
        error: null,
      });

      renderReferenceConfigForm();

      // Should display formatted date
      expect(screen.getByText(/Last updated by/i)).toBeInTheDocument();
    });

    it('should not display current config section when no config exists', () => {
      mockUseReferenceConfig.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      renderReferenceConfigForm();

      expect(screen.queryByText('Current Configuration')).not.toBeInTheDocument();
    });

    it('should change button text to "Update" when config exists', () => {
      const existingConfig: ReferenceConfig = {
        appliedWeightKg: 70,
        expectedEnergyWh: 2.5,
        tolerancePercent: 10,
        createdBy: 'admin@ecostep.com',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
      };

      mockUseReferenceConfig.mockReturnValue({
        data: existingConfig,
        isLoading: false,
        error: null,
      });

      renderReferenceConfigForm();

      expect(
        screen.getByRole('button', { name: /Update Configuration/i })
      ).toBeInTheDocument();
    });
  });

  describe('Subtask 5.5.8: Validation - Applied Weight', () => {
    it('should show error when weight is below minimum (0.1 kg)', async () => {
      renderReferenceConfigForm();

      const weightInput = screen.getByLabelText(/Applied Weight/i);
      await user.clear(weightInput);
      await user.type(weightInput, '0.05');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/Applied weight must be at least 0.1 kg/i)
        ).toBeInTheDocument();
      });
    });

    it('should show error when weight is above maximum (500 kg)', async () => {
      renderReferenceConfigForm();

      const weightInput = screen.getByLabelText(/Applied Weight/i);
      await user.clear(weightInput);
      await user.type(weightInput, '501');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/Applied weight must not exceed 500 kg/i)
        ).toBeInTheDocument();
      });
    });

    it('should accept valid weight values', async () => {
      renderReferenceConfigForm();

      const weightInput = screen.getByLabelText(/Applied Weight/i);
      await user.clear(weightInput);
      await user.type(weightInput, '70');

      await waitFor(() => {
        expect(
          screen.queryByText(/Applied weight must/i)
        ).not.toBeInTheDocument();
      });
    });

    it('should accept decimal weight values', async () => {
      renderReferenceConfigForm();

      const weightInput = screen.getByLabelText(/Applied Weight/i);
      await user.clear(weightInput);
      await user.type(weightInput, '70.5');

      await waitFor(() => {
        expect(
          screen.queryByText(/Applied weight must/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Subtask 5.5.9: Validation - Expected Energy', () => {
    it('should show error when energy is below minimum (0.001 Wh)', async () => {
      renderReferenceConfigForm();

      const energyInput = screen.getByLabelText(/Expected Energy/i);
      await user.clear(energyInput);
      await user.type(energyInput, '0.0005');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/Expected energy must be at least 0.001 Wh/i)
        ).toBeInTheDocument();
      });
    });

    it('should show error when energy is above maximum (100 Wh)', async () => {
      renderReferenceConfigForm();

      const energyInput = screen.getByLabelText(/Expected Energy/i);
      await user.clear(energyInput);
      await user.type(energyInput, '101');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/Expected energy must not exceed 100 Wh/i)
        ).toBeInTheDocument();
      });
    });

    it('should accept valid energy values', async () => {
      renderReferenceConfigForm();

      const energyInput = screen.getByLabelText(/Expected Energy/i);
      await user.clear(energyInput);
      await user.type(energyInput, '2.5');

      await waitFor(() => {
        expect(
          screen.queryByText(/Expected energy must/i)
        ).not.toBeInTheDocument();
      });
    });

    it('should accept energy with 3 decimal places', async () => {
      renderReferenceConfigForm();

      const energyInput = screen.getByLabelText(/Expected Energy/i);
      await user.clear(energyInput);
      await user.type(energyInput, '2.456');

      await waitFor(() => {
        expect(
          screen.queryByText(/Expected energy must/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Subtask 5.5.10: Validation - Tolerance', () => {
    it('should show error when tolerance is below 0%', async () => {
      renderReferenceConfigForm();

      const toleranceInput = screen.getByLabelText(/Tolerance/i);
      await user.clear(toleranceInput);
      await user.type(toleranceInput, '-1');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/Tolerance must be at least 0%/i)
        ).toBeInTheDocument();
      });
    });

    it('should show error when tolerance is above 50%', async () => {
      renderReferenceConfigForm();

      const toleranceInput = screen.getByLabelText(/Tolerance/i);
      await user.clear(toleranceInput);
      await user.type(toleranceInput, '51');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/Tolerance must not exceed 50%/i)
        ).toBeInTheDocument();
      });
    });

    it('should accept valid tolerance values', async () => {
      renderReferenceConfigForm();

      const toleranceInput = screen.getByLabelText(/Tolerance/i);
      await user.clear(toleranceInput);
      await user.type(toleranceInput, '10');

      await waitFor(() => {
        expect(
          screen.queryByText(/Tolerance must/i)
        ).not.toBeInTheDocument();
      });
    });

    it('should accept 0% tolerance', async () => {
      renderReferenceConfigForm();

      const toleranceInput = screen.getByLabelText(/Tolerance/i);
      await user.clear(toleranceInput);
      await user.type(toleranceInput, '0');

      await waitFor(() => {
        expect(
          screen.queryByText(/Tolerance must/i)
        ).not.toBeInTheDocument();
      });
    });

    it('should accept 50% tolerance (upper bound)', async () => {
      renderReferenceConfigForm();

      const toleranceInput = screen.getByLabelText(/Tolerance/i);
      await user.clear(toleranceInput);
      await user.type(toleranceInput, '50');

      await waitFor(() => {
        expect(
          screen.queryByText(/Tolerance must/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Subtask 5.5.11: Form submission', () => {
    it('should submit valid data successfully', async () => {
      renderReferenceConfigForm();

      const weightInput = screen.getByLabelText(/Applied Weight/i);
      const energyInput = screen.getByLabelText(/Expected Energy/i);
      const toleranceInput = screen.getByLabelText(/Tolerance/i);
      const submitButton = screen.getByRole('button', { name: /Save Configuration/i });

      await user.clear(weightInput);
      await user.type(weightInput, '70');
      await user.clear(energyInput);
      await user.type(energyInput, '2.5');
      await user.clear(toleranceInput);
      await user.type(toleranceInput, '10');

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalledWith({
          appliedWeightKg: 70,
          expectedEnergyWh: 2.5,
          tolerancePercent: 10,
        });
      });
    });

    it('should show success toast on successful submission', async () => {
      renderReferenceConfigForm();

      const weightInput = screen.getByLabelText(/Applied Weight/i);
      const energyInput = screen.getByLabelText(/Expected Energy/i);
      const toleranceInput = screen.getByLabelText(/Tolerance/i);
      const submitButton = screen.getByRole('button', { name: /Save Configuration/i });

      await user.clear(weightInput);
      await user.type(weightInput, '70');
      await user.clear(energyInput);
      await user.type(energyInput, '2.5');
      await user.clear(toleranceInput);
      await user.type(toleranceInput, '10');

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Reference configuration created successfully',
          'success'
        );
      });
    });

    it('should show different success message when updating existing config', async () => {
      const existingConfig: ReferenceConfig = {
        appliedWeightKg: 70,
        expectedEnergyWh: 2.5,
        tolerancePercent: 10,
        createdBy: 'admin@ecostep.com',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
      };

      mockUseReferenceConfig.mockReturnValue({
        data: existingConfig,
        isLoading: false,
        error: null,
      });

      renderReferenceConfigForm();

      const submitButton = screen.getByRole('button', { name: /Update Configuration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Reference configuration updated successfully',
          'success'
        );
      });
    });

    it('should show error toast on submission failure', async () => {
      mockCreateMutateAsync.mockRejectedValue(new Error('Network error'));

      renderReferenceConfigForm();

      const weightInput = screen.getByLabelText(/Applied Weight/i);
      const energyInput = screen.getByLabelText(/Expected Energy/i);
      const toleranceInput = screen.getByLabelText(/Tolerance/i);
      const submitButton = screen.getByRole('button', { name: /Save Configuration/i });

      await user.clear(weightInput);
      await user.type(weightInput, '70');
      await user.clear(energyInput);
      await user.type(energyInput, '2.5');
      await user.clear(toleranceInput);
      await user.type(toleranceInput, '10');

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Failed to save reference configuration',
          'error'
        );
      });
    });

    it('should disable submit button when form is invalid', async () => {
      renderReferenceConfigForm();

      const weightInput = screen.getByLabelText(/Applied Weight/i);
      const submitButton = screen.getByRole('button', { name: /Save Configuration/i });

      await user.clear(weightInput);
      await user.type(weightInput, '501'); // Invalid value

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should disable inputs during submission', async () => {
      mockCreateMutateAsync.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      mockUseCreateReferenceConfig.mockReturnValue({
        mutateAsync: mockCreateMutateAsync,
        isLoading: true,
      });

      renderReferenceConfigForm();

      const weightInput = screen.getByLabelText(/Applied Weight/i) as HTMLInputElement;
      const energyInput = screen.getByLabelText(/Expected Energy/i) as HTMLInputElement;
      const toleranceInput = screen.getByLabelText(/Tolerance/i) as HTMLInputElement;

      expect(weightInput.disabled).toBe(true);
      expect(energyInput.disabled).toBe(true);
      expect(toleranceInput.disabled).toBe(true);
    });

    it('should show loading state on submit button during submission', async () => {
      mockUseCreateReferenceConfig.mockReturnValue({
        mutateAsync: mockCreateMutateAsync,
        isLoading: true,
      });

      renderReferenceConfigForm();

      const submitButton = screen.getByRole('button', { name: /Save Configuration/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Subtask 5.5.12: Loading states', () => {
    it('should show loading skeleton when fetching config', () => {
      mockUseReferenceConfig.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      renderReferenceConfigForm();

      // Should show loading skeleton
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not show form when loading', () => {
      mockUseReferenceConfig.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      renderReferenceConfigForm();

      expect(screen.queryByLabelText(/Applied Weight/i)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input fields', async () => {
      renderReferenceConfigForm();

      const submitButton = screen.getByRole('button', { name: /Save Configuration/i });
      
      // Button should be disabled when fields are empty
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should handle non-numeric input gracefully', async () => {
      renderReferenceConfigForm();

      const weightInput = screen.getByLabelText(/Applied Weight/i);
      await user.clear(weightInput);
      await user.type(weightInput, 'abc');

      // Should not submit invalid data
      const submitButton = screen.getByRole('button', { name: /Save Configuration/i });
      expect(submitButton).toBeDisabled();
    });

    it('should handle very large numbers', async () => {
      renderReferenceConfigForm();

      const weightInput = screen.getByLabelText(/Applied Weight/i);
      await user.clear(weightInput);
      await user.type(weightInput, '99999');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/Applied weight must not exceed 500 kg/i)
        ).toBeInTheDocument();
      });
    });

    it('should handle very small numbers', async () => {
      renderReferenceConfigForm();

      const energyInput = screen.getByLabelText(/Expected Energy/i);
      await user.clear(energyInput);
      await user.type(energyInput, '0.00001');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/Expected energy must be at least 0.001 Wh/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      renderReferenceConfigForm();

      expect(screen.getByLabelText(/Applied Weight \(kg\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Expected Energy \(Wh\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tolerance \(%\)/i)).toBeInTheDocument();
    });

    it('should show error messages with proper ARIA attributes', async () => {
      renderReferenceConfigForm();

      const weightInput = screen.getByLabelText(/Applied Weight/i);
      await user.clear(weightInput);
      await user.type(weightInput, '501');
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(/Applied weight must not exceed 500 kg/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should have required attribute on all inputs', () => {
      renderReferenceConfigForm();

      const weightInput = screen.getByLabelText(/Applied Weight/i) as HTMLInputElement;
      const energyInput = screen.getByLabelText(/Expected Energy/i) as HTMLInputElement;
      const toleranceInput = screen.getByLabelText(/Tolerance/i) as HTMLInputElement;

      expect(weightInput.required).toBe(true);
      expect(energyInput.required).toBe(true);
      expect(toleranceInput.required).toBe(true);
    });
  });
});

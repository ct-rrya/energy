import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useReferenceConfig,
  useCreateReferenceConfig,
  useDiagnosticHistory,
  useRecordDiagnosticTest,
} from './useDiagnostics';
import { diagnosticsService } from '@/api/services';
import type { ReferenceConfig, DiagnosticTest } from '@/types/diagnostic.types';

// Mock the diagnostics service
vi.mock('@/api/services', () => ({
  diagnosticsService: {
    getReferenceConfig: vi.fn(),
    createOrUpdateReference: vi.fn(),
    getDiagnosticHistory: vi.fn(),
    recordDiagnosticTest: vi.fn(),
  },
}));

// Helper to create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDiagnostics hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useReferenceConfig', () => {
    it('should fetch reference config successfully', async () => {
      const mockConfig: ReferenceConfig = {
        appliedWeightKg: 50,
        expectedEnergyWh: 100,
        tolerancePercent: 10,
        createdBy: 'test-user',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      vi.mocked(diagnosticsService.getReferenceConfig).mockResolvedValue(mockConfig);

      const { result } = renderHook(() => useReferenceConfig(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockConfig);
      expect(diagnosticsService.getReferenceConfig).toHaveBeenCalledTimes(1);
    });

    it('should return null when no config exists', async () => {
      vi.mocked(diagnosticsService.getReferenceConfig).mockResolvedValue(null);

      const { result } = renderHook(() => useReferenceConfig(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to fetch config');
      vi.mocked(diagnosticsService.getReferenceConfig).mockRejectedValue(error);

      const { result } = renderHook(() => useReferenceConfig(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useCreateReferenceConfig', () => {
    it('should create reference config successfully', async () => {
      const requestData = {
        appliedWeightKg: 50,
        expectedEnergyWh: 100,
        tolerancePercent: 10,
      };

      const mockResponse: ReferenceConfig = {
        ...requestData,
        createdBy: 'test-user',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      vi.mocked(diagnosticsService.createOrUpdateReference).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateReferenceConfig(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(requestData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(diagnosticsService.createOrUpdateReference).toHaveBeenCalledWith(
        requestData,
        expect.any(Object)
      );
    });

    it('should handle mutation errors', async () => {
      const error = new Error('Failed to create config');
      vi.mocked(diagnosticsService.createOrUpdateReference).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateReferenceConfig(), {
        wrapper: createWrapper(),
      });

      const requestData = {
        appliedWeightKg: 50,
        expectedEnergyWh: 100,
        tolerancePercent: 10,
      };

      result.current.mutate(requestData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useDiagnosticHistory', () => {
    it('should fetch diagnostic history with pagination', async () => {
      const mockHistory = {
        tests: [
          {
            id: '1',
            testDate: '2024-01-01T00:00:00Z',
            performedBy: 'test-user',
            actualEnergy: 95,
            expectedEnergy: 100,
            difference: -5,
            performancePercentage: 95,
            result: 'Within Range' as const,
            referenceConfig: {
              appliedWeightKg: 50,
              expectedEnergyWh: 100,
              tolerancePercent: 10,
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      vi.mocked(diagnosticsService.getDiagnosticHistory).mockResolvedValue(mockHistory);

      const { result } = renderHook(() => useDiagnosticHistory(1, 20), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockHistory);
      expect(diagnosticsService.getDiagnosticHistory).toHaveBeenCalledWith(1, 20);
    });

    it('should use default pagination values', async () => {
      const mockHistory = {
        tests: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };

      vi.mocked(diagnosticsService.getDiagnosticHistory).mockResolvedValue(mockHistory);

      const { result } = renderHook(() => useDiagnosticHistory(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(diagnosticsService.getDiagnosticHistory).toHaveBeenCalledWith(1, 20);
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to fetch history');
      vi.mocked(diagnosticsService.getDiagnosticHistory).mockRejectedValue(error);

      const { result } = renderHook(() => useDiagnosticHistory(1, 20), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useRecordDiagnosticTest', () => {
    it('should record diagnostic test successfully', async () => {
      const requestData = {
        actualEnergy: 95,
        notes: 'Test note',
      };

      const mockResponse: DiagnosticTest = {
        id: '1',
        testDate: '2024-01-01T00:00:00Z',
        performedBy: 'test-user',
        actualEnergy: 95,
        expectedEnergy: 100,
        difference: -5,
        performancePercentage: 95,
        result: 'Within Range',
        referenceConfig: {
          appliedWeightKg: 50,
          expectedEnergyWh: 100,
          tolerancePercent: 10,
        },
        notes: 'Test note',
      };

      vi.mocked(diagnosticsService.recordDiagnosticTest).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRecordDiagnosticTest(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(requestData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(diagnosticsService.recordDiagnosticTest).toHaveBeenCalledWith(
        requestData,
        expect.any(Object)
      );
    });

    it('should handle mutation errors', async () => {
      const error = new Error('Failed to record test');
      vi.mocked(diagnosticsService.recordDiagnosticTest).mockRejectedValue(error);

      const { result } = renderHook(() => useRecordDiagnosticTest(), {
        wrapper: createWrapper(),
      });

      const requestData = {
        actualEnergy: 95,
      };

      result.current.mutate(requestData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });
});

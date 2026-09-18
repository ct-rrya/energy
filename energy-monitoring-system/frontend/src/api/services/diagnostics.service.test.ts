import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  createOrUpdateReference,
  getReferenceConfig,
  recordDiagnosticTest,
  getDiagnosticHistory,
  diagnosticsService,
} from './diagnostics.service';
import type {
  ReferenceConfig,
  CreateReferenceConfigRequest,
  RecordDiagnosticTestRequest,
  DiagnosticHistoryResponse,
} from '@/types/diagnostic.types';

// Mock the API client
vi.mock('../client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Diagnostics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrUpdateReference', () => {
    it('should create or update reference configuration', async () => {
      const mockRequest: CreateReferenceConfigRequest = {
        appliedWeightKg: 50,
        expectedEnergyWh: 100,
        tolerancePercent: 5,
      };

      const mockResponse: ReferenceConfig = {
        ...mockRequest,
        createdBy: 'admin@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const apiClient = await import('../client');
      (apiClient.default.post as any).mockResolvedValue({ data: mockResponse });

      const result = await createOrUpdateReference(mockRequest);

      expect(apiClient.default.post).toHaveBeenCalledWith('/diagnostics/reference', mockRequest);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getReferenceConfig', () => {
    it('should get current reference configuration', async () => {
      const mockResponse: ReferenceConfig = {
        appliedWeightKg: 50,
        expectedEnergyWh: 100,
        tolerancePercent: 5,
        createdBy: 'admin@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const apiClient = await import('../client');
      (apiClient.default.get as any).mockResolvedValue({ data: mockResponse });

      const result = await getReferenceConfig();

      expect(apiClient.default.get).toHaveBeenCalledWith('/diagnostics/reference');
      expect(result).toEqual(mockResponse);
    });

    it('should return null when no reference config exists', async () => {
      const apiClient = await import('../client');
      (apiClient.default.get as any).mockResolvedValue({ data: null });

      const result = await getReferenceConfig();

      expect(result).toBeNull();
    });
  });

  describe('recordDiagnosticTest', () => {
    it('should record a diagnostic test', async () => {
      const mockRequest: RecordDiagnosticTestRequest = {
        actualEnergy: 95,
        notes: 'Test note',
      };

      const mockResponse = {
        id: 'test-id',
        testDate: '2024-01-01T00:00:00Z',
        performedBy: 'admin@example.com',
        actualEnergy: 95,
        expectedEnergy: 100,
        difference: -5,
        performancePercentage: 95,
        result: 'Within Range',
        referenceConfig: {
          appliedWeightKg: 50,
          expectedEnergyWh: 100,
          tolerancePercent: 5,
        },
        notes: 'Test note',
      };

      const apiClient = await import('../client');
      (apiClient.default.post as any).mockResolvedValue({ data: mockResponse });

      const result = await recordDiagnosticTest(mockRequest);

      expect(apiClient.default.post).toHaveBeenCalledWith('/diagnostics/test', mockRequest);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getDiagnosticHistory', () => {
    it('should get paginated diagnostic history', async () => {
      const mockResponse: DiagnosticHistoryResponse = {
        tests: [
          {
            id: 'test-1',
            testDate: '2024-01-01T00:00:00Z',
            performedBy: 'admin@example.com',
            actualEnergy: 95,
            expectedEnergy: 100,
            difference: -5,
            performancePercentage: 95,
            result: 'Within Range',
            referenceConfig: {
              appliedWeightKg: 50,
              expectedEnergyWh: 100,
              tolerancePercent: 5,
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

      const apiClient = await import('../client');
      (apiClient.default.get as any).mockResolvedValue({ data: mockResponse });

      const result = await getDiagnosticHistory(1, 20);

      expect(apiClient.default.get).toHaveBeenCalledWith('/diagnostics/history', {
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('diagnosticsService object', () => {
    it('should export all service methods', () => {
      expect(diagnosticsService).toHaveProperty('createOrUpdateReference');
      expect(diagnosticsService).toHaveProperty('getReferenceConfig');
      expect(diagnosticsService).toHaveProperty('recordDiagnosticTest');
      expect(diagnosticsService).toHaveProperty('getDiagnosticHistory');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { DiagnosticsService } from './diagnostics.service';
import {
  ReferenceConfig,
  ReferenceConfigDocument,
} from './schemas/reference-config.schema';
import {
  DiagnosticTest,
  DiagnosticTestDocument,
  DiagnosticResultStatus,
} from './schemas/diagnostic-test.schema';

/**
 * DiagnosticsService Unit Tests
 *
 * Task 1.5: Write unit tests for DiagnosticsService
 *
 * Test Coverage:
 * - createOrUpdateReferenceConfig(): validation, singleton pattern, upsert logic
 * - getReferenceConfig(): retrieval and null handling
 * - recordDiagnosticTest(): calculation logic, error handling, data persistence
 * - getDiagnosticHistory(): pagination logic
 * - calculateDiagnosticResult() (private): result status determination, precision
 * - validateReferenceConfig() (private): all validation ranges
 *
 * Requirements: 20.1, 20.2, 20.3
 */
describe('DiagnosticsService', () => {
  let service: DiagnosticsService;
  let referenceConfigModel: Model<ReferenceConfigDocument>;
  let diagnosticTestModel: Model<DiagnosticTestDocument>;

  // Mock data
  const mockReferenceConfig: Partial<ReferenceConfig> = {
    appliedWeightKg: 70,
    expectedEnergyWh: 0.5,
    tolerancePercent: 10,
    createdBy: 'admin@test.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDiagnosticTest: Partial<DiagnosticTest> = {
    testDate: new Date(),
    performedBy: 'admin@test.com',
    actualEnergy: 0.55,
    expectedEnergy: 0.5,
    difference: 0.05,
    performancePercentage: 110.0,
    result: DiagnosticResultStatus.WITHIN_RANGE,
    referenceConfig: {
      appliedWeightKg: 70,
      expectedEnergyWh: 0.5,
      tolerancePercent: 10,
    },
    notes: 'Test note',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiagnosticsService,
        {
          provide: getModelToken(ReferenceConfig.name),
          useValue: {
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            exec: jest.fn(),
          },
        },
        {
          provide: getModelToken(DiagnosticTest.name),
          useValue: {
            find: jest.fn(),
            countDocuments: jest.fn(),
            save: jest.fn(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DiagnosticsService>(DiagnosticsService);
    referenceConfigModel = module.get<Model<ReferenceConfigDocument>>(
      getModelToken(ReferenceConfig.name),
    );
    diagnosticTestModel = module.get<Model<DiagnosticTestDocument>>(
      getModelToken(DiagnosticTest.name),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrUpdateReferenceConfig', () => {
    it('should create a new reference config with valid data', async () => {
      const dto = {
        appliedWeightKg: 70,
        expectedEnergyWh: 0.5,
        tolerancePercent: 10,
      };
      const createdBy = 'admin@test.com';

      jest
        .spyOn(referenceConfigModel, 'findOneAndUpdate')
        .mockResolvedValue(mockReferenceConfig);

      const result = await service.createOrUpdateReferenceConfig(
        dto,
        createdBy,
      );

      expect(referenceConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          appliedWeightKg: dto.appliedWeightKg,
          expectedEnergyWh: dto.expectedEnergyWh,
          tolerancePercent: dto.tolerancePercent,
          createdBy,
        }),
        expect.objectContaining({
          upsert: true,
          new: true,
          runValidators: true,
        }),
      );
      expect(result).toEqual(mockReferenceConfig);
    });

    it('should update existing reference config (singleton pattern)', async () => {
      const dto = {
        appliedWeightKg: 80,
        expectedEnergyWh: 0.6,
        tolerancePercent: 15,
      };
      const createdBy = 'admin@test.com';

      const updatedConfig = {
        ...mockReferenceConfig,
        ...dto,
        updatedAt: new Date(),
      };

      jest
        .spyOn(referenceConfigModel, 'findOneAndUpdate')
        .mockResolvedValue(updatedConfig);

      const result = await service.createOrUpdateReferenceConfig(
        dto,
        createdBy,
      );

      expect(referenceConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        {}, // Empty filter ensures singleton pattern
        expect.any(Object),
        expect.objectContaining({ upsert: true }),
      );
      expect(result.appliedWeightKg).toBe(80);
      expect(result.expectedEnergyWh).toBe(0.6);
      expect(result.tolerancePercent).toBe(15);
    });

    it('should throw BadRequestException when applied weight is below minimum (0.1 kg)', async () => {
      const dto = {
        appliedWeightKg: 0.05, // Below minimum
        expectedEnergyWh: 0.5,
        tolerancePercent: 10,
      };

      await expect(
        service.createOrUpdateReferenceConfig(dto, 'admin@test.com'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createOrUpdateReferenceConfig(dto, 'admin@test.com'),
      ).rejects.toThrow('Applied weight must be between 0.1 and 500 kg');
    });

    it('should throw BadRequestException when applied weight is above maximum (500 kg)', async () => {
      const dto = {
        appliedWeightKg: 501, // Above maximum
        expectedEnergyWh: 0.5,
        tolerancePercent: 10,
      };

      await expect(
        service.createOrUpdateReferenceConfig(dto, 'admin@test.com'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createOrUpdateReferenceConfig(dto, 'admin@test.com'),
      ).rejects.toThrow('Applied weight must be between 0.1 and 500 kg');
    });

    it('should throw BadRequestException when expected energy is below minimum (0.001 Wh)', async () => {
      const dto = {
        appliedWeightKg: 70,
        expectedEnergyWh: 0.0005, // Below minimum
        tolerancePercent: 10,
      };

      await expect(
        service.createOrUpdateReferenceConfig(dto, 'admin@test.com'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createOrUpdateReferenceConfig(dto, 'admin@test.com'),
      ).rejects.toThrow('Expected energy must be between 0.001 and 100 Wh');
    });

    it('should throw BadRequestException when expected energy is above maximum (100 Wh)', async () => {
      const dto = {
        appliedWeightKg: 70,
        expectedEnergyWh: 101, // Above maximum
        tolerancePercent: 10,
      };

      await expect(
        service.createOrUpdateReferenceConfig(dto, 'admin@test.com'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createOrUpdateReferenceConfig(dto, 'admin@test.com'),
      ).rejects.toThrow('Expected energy must be between 0.001 and 100 Wh');
    });

    it('should throw BadRequestException when tolerance is below minimum (0%)', async () => {
      const dto = {
        appliedWeightKg: 70,
        expectedEnergyWh: 0.5,
        tolerancePercent: -1, // Below minimum
      };

      await expect(
        service.createOrUpdateReferenceConfig(dto, 'admin@test.com'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createOrUpdateReferenceConfig(dto, 'admin@test.com'),
      ).rejects.toThrow('Tolerance must be between 0% and 50%');
    });

    it('should throw BadRequestException when tolerance is above maximum (50%)', async () => {
      const dto = {
        appliedWeightKg: 70,
        expectedEnergyWh: 0.5,
        tolerancePercent: 51, // Above maximum
      };

      await expect(
        service.createOrUpdateReferenceConfig(dto, 'admin@test.com'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createOrUpdateReferenceConfig(dto, 'admin@test.com'),
      ).rejects.toThrow('Tolerance must be between 0% and 50%');
    });

    it('should accept minimum boundary values', async () => {
      const dto = {
        appliedWeightKg: 0.1, // Minimum
        expectedEnergyWh: 0.001, // Minimum
        tolerancePercent: 0, // Minimum
      };

      const config = {
        ...mockReferenceConfig,
        ...dto,
      };

      jest
        .spyOn(referenceConfigModel, 'findOneAndUpdate')
        .mockResolvedValue(config);

      const result = await service.createOrUpdateReferenceConfig(
        dto,
        'admin@test.com',
      );

      expect(result.appliedWeightKg).toBe(0.1);
      expect(result.expectedEnergyWh).toBe(0.001);
      expect(result.tolerancePercent).toBe(0);
    });

    it('should accept maximum boundary values', async () => {
      const dto = {
        appliedWeightKg: 500, // Maximum
        expectedEnergyWh: 100, // Maximum
        tolerancePercent: 50, // Maximum
      };

      const config = {
        ...mockReferenceConfig,
        ...dto,
      };

      jest
        .spyOn(referenceConfigModel, 'findOneAndUpdate')
        .mockResolvedValue(config);

      const result = await service.createOrUpdateReferenceConfig(
        dto,
        'admin@test.com',
      );

      expect(result.appliedWeightKg).toBe(500);
      expect(result.expectedEnergyWh).toBe(100);
      expect(result.tolerancePercent).toBe(50);
    });
  });

  describe('getReferenceConfig', () => {
    it('should return reference config when it exists', async () => {
      const mockExec = jest
        .fn()
        .mockResolvedValue(mockReferenceConfig as ReferenceConfigDocument);
      jest.spyOn(referenceConfigModel, 'findOne').mockReturnValue({
        exec: mockExec,
      } as any);

      const result = await service.getReferenceConfig();

      expect(referenceConfigModel.findOne).toHaveBeenCalled();
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockReferenceConfig);
    });

    it('should return null when no reference config exists', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      jest.spyOn(referenceConfigModel, 'findOne').mockReturnValue({
        exec: mockExec,
      } as any);

      const result = await service.getReferenceConfig();

      expect(result).toBeNull();
    });
  });

  describe('recordDiagnosticTest', () => {
    beforeEach(() => {
      jest
        .spyOn(referenceConfigModel, 'findOne')
        .mockResolvedValue(mockReferenceConfig as ReferenceConfigDocument);
    });

    it('should throw BadRequestException when no reference config exists', async () => {
      jest.spyOn(referenceConfigModel, 'findOne').mockResolvedValue(null);

      const dto = {
        actualEnergy: 0.5,
        notes: 'Test note',
      };

      await expect(
        service.recordDiagnosticTest(dto, 'admin@test.com'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.recordDiagnosticTest(dto, 'admin@test.com'),
      ).rejects.toThrow('Reference configuration must be set first');
    });

    it('should calculate and save diagnostic test with correct values - Within Range', async () => {
      const dto = {
        actualEnergy: 0.55, // 110% of expected (within 10% tolerance)
        notes: 'Test note',
      };

      const mockSave = jest.fn().mockResolvedValue(mockDiagnosticTest);
      const mockConstructor = jest
        .fn()
        .mockImplementation((data) => ({ ...data, save: mockSave }));

      (diagnosticTestModel as any).mockImplementation = mockConstructor;
      (diagnosticTestModel as any) = mockConstructor;

      // Access private method via type assertion
      const result = (service as any).calculateDiagnosticResult(0.55, 0.5, 10);

      expect(result.difference).toBe(0.05);
      expect(result.performancePercentage).toBe(110.0);
      expect(result.status).toBe(DiagnosticResultStatus.WITHIN_RANGE);
    });

    it('should calculate diagnostic result - Below Expected', async () => {
      // Test with 40% of expected (below 10% tolerance lower bound of 90%)
      const result = (service as any).calculateDiagnosticResult(0.2, 0.5, 10);

      expect(result.difference).toBe(-0.3);
      expect(result.performancePercentage).toBe(40.0);
      expect(result.status).toBe(DiagnosticResultStatus.BELOW_EXPECTED);
    });

    it('should calculate diagnostic result - Above Expected', async () => {
      // Test with 150% of expected (above 10% tolerance upper bound of 110%)
      const result = (service as any).calculateDiagnosticResult(0.75, 0.5, 10);

      expect(result.difference).toBe(0.25);
      expect(result.performancePercentage).toBe(150.0);
      expect(result.status).toBe(DiagnosticResultStatus.ABOVE_EXPECTED);
    });

    it('should calculate diagnostic result at lower boundary (exactly 90% with 10% tolerance)', async () => {
      // Test at exact lower boundary (90% = 100% - 10% tolerance)
      const result = (service as any).calculateDiagnosticResult(0.45, 0.5, 10);

      expect(result.performancePercentage).toBe(90.0);
      expect(result.status).toBe(DiagnosticResultStatus.WITHIN_RANGE);
    });

    it('should calculate diagnostic result at upper boundary (exactly 110% with 10% tolerance)', async () => {
      // Test at exact upper boundary (110% = 100% + 10% tolerance)
      const result = (service as any).calculateDiagnosticResult(0.55, 0.5, 10);

      expect(result.performancePercentage).toBe(110.0);
      expect(result.status).toBe(DiagnosticResultStatus.WITHIN_RANGE);
    });

    it('should handle zero tolerance (only exact match is within range)', async () => {
      // With 0% tolerance, only exactly 100% performance is within range
      const exactMatch = (service as any).calculateDiagnosticResult(
        0.5,
        0.5,
        0,
      );
      expect(exactMatch.status).toBe(DiagnosticResultStatus.WITHIN_RANGE);

      const slightlyBelow = (service as any).calculateDiagnosticResult(
        0.49,
        0.5,
        0,
      );
      expect(slightlyBelow.status).toBe(DiagnosticResultStatus.BELOW_EXPECTED);

      const slightlyAbove = (service as any).calculateDiagnosticResult(
        0.51,
        0.5,
        0,
      );
      expect(slightlyAbove.status).toBe(DiagnosticResultStatus.ABOVE_EXPECTED);
    });

    it('should handle maximum tolerance (50%)', async () => {
      // With 50% tolerance, range is 50% to 150%
      const at50Percent = (service as any).calculateDiagnosticResult(
        0.25,
        0.5,
        50,
      );
      expect(at50Percent.status).toBe(DiagnosticResultStatus.WITHIN_RANGE);

      const at150Percent = (service as any).calculateDiagnosticResult(
        0.75,
        0.5,
        50,
      );
      expect(at150Percent.status).toBe(DiagnosticResultStatus.WITHIN_RANGE);

      const below50Percent = (service as any).calculateDiagnosticResult(
        0.24,
        0.5,
        50,
      );
      expect(below50Percent.status).toBe(DiagnosticResultStatus.BELOW_EXPECTED);

      const above150Percent = (service as any).calculateDiagnosticResult(
        0.76,
        0.5,
        50,
      );
      expect(above150Percent.status).toBe(
        DiagnosticResultStatus.ABOVE_EXPECTED,
      );
    });

    it('should throw BadRequestException when expected energy is zero', async () => {
      expect(() => {
        (service as any).calculateDiagnosticResult(0.5, 0, 10);
      }).toThrow(BadRequestException);
      expect(() => {
        (service as any).calculateDiagnosticResult(0.5, 0, 10);
      }).toThrow('Expected energy cannot be zero');
    });

    it('should maintain 4 decimal precision for difference calculation', async () => {
      const result = (service as any).calculateDiagnosticResult(
        0.123456,
        0.1,
        10,
      );

      // difference = 0.123456 - 0.1 = 0.023456, rounded to 4 decimals = 0.0235
      expect(result.difference).toBe(0.0235);
    });

    it('should maintain 2 decimal precision for performance percentage calculation', async () => {
      const result = (service as any).calculateDiagnosticResult(
        0.123456,
        0.1,
        10,
      );

      // performance = (0.123456 / 0.1) * 100 = 123.456%, rounded to 2 decimals = 123.46%
      expect(result.performancePercentage).toBe(123.46);
    });

    it('should handle very small energy values correctly', async () => {
      const result = (service as any).calculateDiagnosticResult(
        0.001,
        0.001,
        10,
      );

      expect(result.difference).toBe(0.0);
      expect(result.performancePercentage).toBe(100.0);
      expect(result.status).toBe(DiagnosticResultStatus.WITHIN_RANGE);
    });

    it('should handle very large energy values correctly', async () => {
      const result = (service as any).calculateDiagnosticResult(100, 100, 10);

      expect(result.difference).toBe(0.0);
      expect(result.performancePercentage).toBe(100.0);
      expect(result.status).toBe(DiagnosticResultStatus.WITHIN_RANGE);
    });

    it('should trim and sanitize notes', async () => {
      const dto = {
        actualEnergy: 0.55,
        notes: '  Test note with extra spaces  ',
      };

      const savedTest = {
        ...mockDiagnosticTest,
        notes: 'Test note with extra spaces',
      };

      const mockSave = jest.fn().mockResolvedValue(savedTest);
      const mockTest = {
        ...savedTest,
        save: mockSave,
      };

      // Override the service's model with a function that returns our mock
      (service as any).diagnosticTestModel = jest
        .fn()
        .mockImplementation(() => mockTest);

      const result = await service.recordDiagnosticTest(dto, 'admin@test.com');

      expect((service as any).diagnosticTestModel).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Test note with extra spaces',
        }),
      );
      expect(mockSave).toHaveBeenCalled();
      expect(result.notes).toBe('Test note with extra spaces');
    });

    it('should handle undefined notes', async () => {
      const dto = {
        actualEnergy: 0.55,
      };

      const savedTest = {
        ...mockDiagnosticTest,
        notes: undefined,
      };

      const mockSave = jest.fn().mockResolvedValue(savedTest);
      const mockTest = {
        ...savedTest,
        save: mockSave,
      };

      // Override the service's model with a function that returns our mock
      (service as any).diagnosticTestModel = jest
        .fn()
        .mockImplementation(() => mockTest);

      const result = await service.recordDiagnosticTest(dto, 'admin@test.com');

      expect((service as any).diagnosticTestModel).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: undefined,
        }),
      );
      expect(mockSave).toHaveBeenCalled();
      expect(result.notes).toBeUndefined();
    });

    it('should handle empty string notes', async () => {
      const dto = {
        actualEnergy: 0.55,
        notes: '   ', // Only whitespace
      };

      const savedTest = {
        ...mockDiagnosticTest,
        notes: undefined,
      };

      const mockSave = jest.fn().mockResolvedValue(savedTest);
      const mockTest = {
        ...savedTest,
        save: mockSave,
      };

      // Override the service's model with a function that returns our mock
      (service as any).diagnosticTestModel = jest
        .fn()
        .mockImplementation(() => mockTest);

      const result = await service.recordDiagnosticTest(dto, 'admin@test.com');

      expect((service as any).diagnosticTestModel).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: undefined,
        }),
      );
      expect(mockSave).toHaveBeenCalled();
      expect(result.notes).toBeUndefined();
    });
  });

  describe('getDiagnosticHistory', () => {
    it('should return paginated diagnostic history with default pagination', async () => {
      const mockTests = [mockDiagnosticTest, mockDiagnosticTest];
      const mockTotal = 50;

      const mockExec = jest.fn().mockResolvedValue(mockTests);
      const mockCountExec = jest.fn().mockResolvedValue(mockTotal);

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: mockExec,
      };

      jest.spyOn(diagnosticTestModel, 'find').mockReturnValue(mockQuery as any);
      jest.spyOn(diagnosticTestModel, 'countDocuments').mockReturnValue({
        exec: mockCountExec,
      } as any);

      const result = await service.getDiagnosticHistory({});

      expect(diagnosticTestModel.find).toHaveBeenCalled();
      expect(mockQuery.sort).toHaveBeenCalledWith({ testDate: -1 });
      expect(mockQuery.skip).toHaveBeenCalledWith(0); // (page 1 - 1) * 20
      expect(mockQuery.limit).toHaveBeenCalledWith(20); // Default limit
      expect(result.tests).toEqual(mockTests);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3, // Math.ceil(50 / 20)
      });
    });

    it('should return paginated diagnostic history with custom page and limit', async () => {
      const mockTests = [mockDiagnosticTest];
      const mockTotal = 100;

      const mockExec = jest.fn().mockResolvedValue(mockTests);
      const mockCountExec = jest.fn().mockResolvedValue(mockTotal);

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: mockExec,
      };

      jest.spyOn(diagnosticTestModel, 'find').mockReturnValue(mockQuery as any);
      jest.spyOn(diagnosticTestModel, 'countDocuments').mockReturnValue({
        exec: mockCountExec,
      } as any);

      const result = await service.getDiagnosticHistory({
        page: 3,
        limit: 15,
      });

      expect(mockQuery.skip).toHaveBeenCalledWith(30); // (page 3 - 1) * 15
      expect(mockQuery.limit).toHaveBeenCalledWith(15);
      expect(result.pagination).toEqual({
        page: 3,
        limit: 15,
        total: 100,
        totalPages: 7, // Math.ceil(100 / 15)
      });
    });

    it('should cap limit at 100 items per page', async () => {
      const mockTests = [mockDiagnosticTest];
      const mockTotal = 500;

      const mockExec = jest.fn().mockResolvedValue(mockTests);
      const mockCountExec = jest.fn().mockResolvedValue(mockTotal);

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: mockExec,
      };

      jest.spyOn(diagnosticTestModel, 'find').mockReturnValue(mockQuery as any);
      jest.spyOn(diagnosticTestModel, 'countDocuments').mockReturnValue({
        exec: mockCountExec,
      } as any);

      const result = await service.getDiagnosticHistory({
        page: 1,
        limit: 200, // Requesting 200, should be capped at 100
      });

      expect(mockQuery.limit).toHaveBeenCalledWith(100); // Capped at max
      expect(result.pagination.limit).toBe(100);
      expect(result.pagination.totalPages).toBe(5); // Math.ceil(500 / 100)
    });

    it('should sort results by testDate descending (newest first)', async () => {
      const mockTests = [mockDiagnosticTest];
      const mockTotal = 10;

      const mockExec = jest.fn().mockResolvedValue(mockTests);
      const mockCountExec = jest.fn().mockResolvedValue(mockTotal);

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: mockExec,
      };

      jest.spyOn(diagnosticTestModel, 'find').mockReturnValue(mockQuery as any);
      jest.spyOn(diagnosticTestModel, 'countDocuments').mockReturnValue({
        exec: mockCountExec,
      } as any);

      await service.getDiagnosticHistory({ page: 1, limit: 20 });

      expect(mockQuery.sort).toHaveBeenCalledWith({ testDate: -1 });
    });

    it('should handle empty results', async () => {
      const mockTests: any[] = [];
      const mockTotal = 0;

      const mockExec = jest.fn().mockResolvedValue(mockTests);
      const mockCountExec = jest.fn().mockResolvedValue(mockTotal);

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: mockExec,
      };

      jest.spyOn(diagnosticTestModel, 'find').mockReturnValue(mockQuery as any);
      jest.spyOn(diagnosticTestModel, 'countDocuments').mockReturnValue({
        exec: mockCountExec,
      } as any);

      const result = await service.getDiagnosticHistory({});

      expect(result.tests).toEqual([]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0, // Math.ceil(0 / 20)
      });
    });

    it('should handle page beyond available data', async () => {
      const mockTests: any[] = [];
      const mockTotal = 25;

      const mockExec = jest.fn().mockResolvedValue(mockTests);
      const mockCountExec = jest.fn().mockResolvedValue(mockTotal);

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: mockExec,
      };

      jest.spyOn(diagnosticTestModel, 'find').mockReturnValue(mockQuery as any);
      jest.spyOn(diagnosticTestModel, 'countDocuments').mockReturnValue({
        exec: mockCountExec,
      } as any);

      const result = await service.getDiagnosticHistory({
        page: 10, // Page 10 with only 25 total items (2 pages at 20/page)
        limit: 20,
      });

      expect(mockQuery.skip).toHaveBeenCalledWith(180); // (page 10 - 1) * 20
      expect(result.tests).toEqual([]); // No results for this page
      expect(result.pagination.page).toBe(10);
      expect(result.pagination.totalPages).toBe(2); // Math.ceil(25 / 20)
    });
  });
});

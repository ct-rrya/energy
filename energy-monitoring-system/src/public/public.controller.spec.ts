import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PublicController } from './public.controller';
import { EnergyService } from '../energy/energy.service';
import { TelemetryDto } from './dto/telemetry.dto';

describe('PublicController', () => {
  let controller: PublicController;
  let energyService: EnergyService;

  const mockEnergyService = {
    getTodayEnergyTotal: jest.fn(),
    getRecentReadings: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicController],
      providers: [
        {
          provide: EnergyService,
          useValue: mockEnergyService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    controller = module.get<PublicController>(PublicController);
    energyService = module.get<EnergyService>(EnergyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentTelemetry', () => {
    it('should return telemetry data when available', async () => {
      // Arrange
      const mockTodayData = {
        date: '2024-01-01',
        totalPower: 1000,
        count: 10,
        avgPower: 100,
        maxPower: 150,
        minPower: 50,
        estimatedEnergyKWh: 0.145,
      };

      const mockRecentReading = {
        voltage: 12.5,
        current: 2.3,
        power: 28.75,
        timestamp: new Date('2024-01-01T12:00:00.000Z'),
      };

      mockEnergyService.getTodayEnergyTotal.mockResolvedValue(mockTodayData);
      mockEnergyService.getRecentReadings.mockResolvedValue([
        mockRecentReading,
      ]);

      // Act
      const result: TelemetryDto = await controller.getCurrentTelemetry();

      // Assert
      expect(result).toEqual({
        voltage: 12.5,
        current: 2.3,
        power: 28.75,
        energyToday: 0.145,
        timestamp: '2024-01-01T12:00:00.000Z',
        status: 'online',
      });
      expect(energyService.getTodayEnergyTotal).toHaveBeenCalledTimes(1);
      expect(energyService.getRecentReadings).toHaveBeenCalledWith(1);
    });

    it('should throw ServiceUnavailableException when no recent readings', async () => {
      // Arrange
      const mockTodayData = {
        date: '2024-01-01',
        totalPower: 0,
        count: 0,
        avgPower: 0,
        maxPower: 0,
        minPower: 0,
        estimatedEnergyKWh: 0,
      };

      mockEnergyService.getTodayEnergyTotal.mockResolvedValue(mockTodayData);
      mockEnergyService.getRecentReadings.mockResolvedValue([]);

      // Act & Assert
      await expect(controller.getCurrentTelemetry()).rejects.toThrow(
        ServiceUnavailableException,
      );
      await expect(controller.getCurrentTelemetry()).rejects.toThrow(
        'No recent sensor data available',
      );
    });

    it('should throw ServiceUnavailableException when getRecentReadings returns null', async () => {
      // Arrange
      const mockTodayData = {
        date: '2024-01-01',
        totalPower: 0,
        count: 0,
        avgPower: 0,
        maxPower: 0,
        minPower: 0,
        estimatedEnergyKWh: 0,
      };

      mockEnergyService.getTodayEnergyTotal.mockResolvedValue(mockTodayData);
      mockEnergyService.getRecentReadings.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.getCurrentTelemetry()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw ServiceUnavailableException when service fails', async () => {
      // Arrange
      mockEnergyService.getTodayEnergyTotal.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(controller.getCurrentTelemetry()).rejects.toThrow(
        ServiceUnavailableException,
      );
      await expect(controller.getCurrentTelemetry()).rejects.toThrow(
        'Telemetry data temporarily unavailable. Please try again later.',
      );
    });

    it('should round voltage, current, and power to 2 decimal places', async () => {
      // Arrange
      const mockTodayData = {
        date: '2024-01-01',
        totalPower: 1000,
        count: 10,
        avgPower: 100,
        maxPower: 150,
        minPower: 50,
        estimatedEnergyKWh: 0.145678,
      };

      const mockRecentReading = {
        voltage: 12.5678,
        current: 2.3456,
        power: 28.7891,
        timestamp: new Date('2024-01-01T12:00:00.000Z'),
      };

      mockEnergyService.getTodayEnergyTotal.mockResolvedValue(mockTodayData);
      mockEnergyService.getRecentReadings.mockResolvedValue([
        mockRecentReading,
      ]);

      // Act
      const result: TelemetryDto = await controller.getCurrentTelemetry();

      // Assert
      expect(result.voltage).toBe(12.57);
      expect(result.current).toBe(2.35);
      expect(result.power).toBe(28.79);
    });
  });

  describe('healthCheck', () => {
    it('should return status ok', () => {
      // Act
      const result = controller.healthCheck();

      // Assert
      expect(result).toEqual({ status: 'ok' });
    });
  });
});

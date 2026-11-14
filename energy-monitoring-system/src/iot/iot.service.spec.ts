import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import { IotService } from './iot.service';
import { EnergyReading } from './schemas/energy-reading.schema';
import { SensorsService } from '../sensors/sensors.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { FirebaseService } from '../firebase/firebase.service';

describe('IotService', () => {
  let service: IotService;
  let readingModel: any;

  const validSensorId = new Types.ObjectId().toString();

  beforeEach(async () => {
    const saveMock = jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve({
        _id: new Types.ObjectId(),
        ...this.payload,
        timestamp: this.payload.timestamp,
      });
    });

    readingModel = jest.fn().mockImplementation((payload: any) => ({
      payload,
      save: saveMock,
    }));

    readingModel.findOne = jest.fn();
    readingModel.find = jest.fn();
    readingModel.countDocuments = jest.fn();
    readingModel.aggregate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IotService,
        {
          provide: getModelToken(EnergyReading.name),
          useValue: readingModel,
        },
        {
          provide: SensorsService,
          useValue: {
            findByApiKey: jest.fn(),
            updateLastSeen: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: DashboardService,
          useValue: {
            broadcastNewReading: jest.fn(),
            broadcastAlert: jest.fn(),
            broadcastEnergyMilestone: jest.fn(),
            getGateway: jest.fn().mockReturnValue({
              server: { to: jest.fn().mockReturnValue({ emit: jest.fn() }) },
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: FirebaseService,
          useValue: {
            isEnabled: jest.fn().mockReturnValue(false),
          },
        },
      ],
    }).compile();

    service = module.get<IotService>(IotService);
  });

  it('stores sensorId as Types.ObjectId when receiving a reading', async () => {
    const sensorsService = (service as any).sensorsService;
    sensorsService.findByApiKey.mockResolvedValue({
      _id: new Types.ObjectId(validSensorId),
      name: 'Test Sensor',
      location: 'Lab',
      status: 'active',
    });

    await service.receiveReading('test-api-key', {
      voltage: 5.0,
      current: 0.1,
      power: 0.5,
      energy: 0.001,
      timestamp: new Date().toISOString(),
    });

    expect(readingModel).toHaveBeenCalledTimes(1);
    const savedPayload = readingModel.mock.calls[0][0];
    expect(savedPayload.sensorId).toBeInstanceOf(Types.ObjectId);
    expect(savedPayload.sensorId.toString()).toBe(validSensorId);
  });

  it('matches both ObjectId and string sensorId in getLatestReading', async () => {
    const fakeReading = { _id: new Types.ObjectId(), sensorId: validSensorId, voltage: 5 };
    const execMock = jest.fn().mockResolvedValue(fakeReading);
    const sortMock = jest.fn().mockReturnValue({ exec: execMock });
    readingModel.findOne.mockReturnValue({ sort: sortMock });

    const result = await service.getLatestReading(validSensorId);

    expect(result).toBe(fakeReading);
    const queryArg = readingModel.findOne.mock.calls[0][0];
    expect(queryArg.sensorId.$in).toHaveLength(2);
    expect(queryArg.sensorId.$in[0]).toBeInstanceOf(Types.ObjectId);
    expect(queryArg.sensorId.$in[0].toString()).toBe(validSensorId);
    expect(queryArg.sensorId.$in[1]).toBe(validSensorId);
  });

  it('throws NotFoundException when getLatestReading finds no reading', async () => {
    const execMock = jest.fn().mockResolvedValue(null);
    const sortMock = jest.fn().mockReturnValue({ exec: execMock });
    readingModel.findOne.mockReturnValue({ sort: sortMock });

    await expect(service.getLatestReading(validSensorId)).rejects.toThrow(NotFoundException);
  });

  it('matches both ObjectId and string sensorId in getReadingHistory', async () => {
    const execMock = jest.fn().mockResolvedValue([]);
    const limitMock = jest.fn().mockReturnValue({ exec: execMock });
    const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
    const sortMock = jest.fn().mockReturnValue({ skip: skipMock });
    readingModel.find.mockReturnValue({ sort: sortMock });
    readingModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });

    await service.getReadingHistory(validSensorId, { page: 1, limit: 10 });

    const findFilter = readingModel.find.mock.calls[0][0];
    expect(findFilter.sensorId.$in[0]).toBeInstanceOf(Types.ObjectId);
    expect(findFilter.sensorId.$in[1]).toBe(validSensorId);
    expect(readingModel.countDocuments).toHaveBeenCalledWith(findFilter);
  });

  it('matches both ObjectId and string sensorId in getReadingStatistics', async () => {
    readingModel.aggregate.mockResolvedValue([
      {
        totalReadings: 2,
        minTimestamp: new Date(),
        maxTimestamp: new Date(),
        minVoltage: 4,
        maxVoltage: 5,
        avgVoltage: 4.5,
        minCurrent: 0.1,
        maxCurrent: 0.2,
        avgCurrent: 0.15,
        minPower: 0.4,
        maxPower: 1.0,
        avgPower: 0.7,
        totalEnergy: 0.002,
        minBattery: 90,
        maxBattery: 100,
        avgBattery: 95,
        totalSteps: 3,
      },
    ]);

    const result = await service.getReadingStatistics(validSensorId, {});

    expect(result.totalReadings).toBe(2);
    const pipeline = readingModel.aggregate.mock.calls[0][0];
    const matchStage = pipeline[0].$match;
    expect(matchStage.sensorId.$in[0]).toBeInstanceOf(Types.ObjectId);
    expect(matchStage.sensorId.$in[1]).toBe(validSensorId);
  });

  it('rejects invalid sensorId in query methods', async () => {
    await expect(service.getLatestReading('not-an-objectid')).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.getReadingHistory('not-an-objectid', {})).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.getReadingStatistics('not-an-objectid', {})).rejects.toThrow(
      BadRequestException,
    );
  });
});

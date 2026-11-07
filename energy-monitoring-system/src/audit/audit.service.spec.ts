import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { AuditLog } from './schemas/audit-log.schema';
import { User } from '../users/schemas/user.schema';

describe('AuditService', () => {
  let service: AuditService;
  let mockAuditModel: any;
  let mockUserModel: any;

  beforeEach(async () => {
    mockAuditModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: 'mock-audit-id-123',
        ...dto,
        timestamp: new Date(),
      }),
    }));

    const mockQueryChain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        {
          _id: 'mock-1',
          administratorId: '507f1f77bcf86cd799439011',
          administratorName: 'Super Admin',
          administratorRole: 'SUPER_ADMIN',
          action: 'LOGIN',
          module: 'AUTH',
          result: 'SUCCESS',
          timestamp: new Date('2026-11-07T12:00:00Z'),
        },
      ]),
    };

    mockAuditModel.find = jest.fn().mockReturnValue(mockQueryChain);

    mockAuditModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    });

    mockAuditModel.distinct = jest.fn().mockImplementation((field) => ({
      exec: jest.fn().mockResolvedValue(field === 'module' ? ['AUTH', 'DIAGNOSTICS'] : []),
    }));

    mockAuditModel.aggregate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
        },
      ]),
    });

    mockUserModel = {
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              _id: '507f1f77bcf86cd799439011',
              name: 'Super Admin',
              role: 'SUPER_ADMIN',
              email: 'super@ecostep.com',
            },
          ]),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getModelToken(AuditLog.name),
          useValue: mockAuditModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log audit event via logAudit reading admin from req.user', async () => {
    const mockReq = {
      user: {
        _id: '507f1f77bcf86cd799439011',
        name: 'Jun Dela Cruz',
        role: 'ADMIN',
      },
      headers: { 'user-agent': 'JestTestRunner' },
    };

    const log = await service.logAudit(mockReq, {
      category: 'Milestones',
      event: 'Set milestone goal',
      result: 'SUCCESS',
      details: {
        month: '2026-11',
        oldValue: '100 mWh',
        newValue: '150 mWh',
      },
    });

    expect(log).toBeDefined();
    expect(log.administratorName).toBe('Jun Dela Cruz');
    expect(log.administratorRole).toBe('ADMIN');
    expect(log.category).toBe('Milestones');
    expect(log.action).toBe('Set milestone goal');
    expect(log.result).toBe('SUCCESS');
    expect(log.details.newValue).toBe('150 mWh');
  });

  it('should log diagnostic run via logAudit with tiles checked and result', async () => {
    const mockReq = {
      user: {
        _id: '507f1f77bcf86cd799439012',
        name: 'Maria Santos',
        role: 'ADMIN',
      },
    };

    const log = await service.logAudit(mockReq, {
      category: 'Diagnostics',
      event: 'Ran daily tile diagnostics',
      result: 'SUCCESS',
      details: {
        tilesChecked: 1,
        flaggedTiles: 0,
        result: 'PASSED',
      },
    });

    expect(log).toBeDefined();
    expect(log.administratorName).toBe('Maria Santos');
    expect(log.category).toBe('Diagnostics');
    expect(log.action).toBe('Ran daily tile diagnostics');
    expect(log.details.tilesChecked).toBe(1);
    expect(log.details.flaggedTiles).toBe(0);
  });

  it('should record success audit log and sanitize sensitive credentials', async () => {
    const validAdminId = '507f1f77bcf86cd799439011';
    const log = await service.logSuccess({
      administratorId: validAdminId,
      administratorName: 'Apple Admin',
      administratorRole: 'SUPER_ADMIN',
      module: 'AUTH',
      action: 'LOGIN',
      target: 'System',
      details: {
        password: 'my-super-secret-password',
        accessCode: '999999',
        token: 'jwt.token.here',
        safeMetadata: 'valid-info',
      },
    });

    expect(log).toBeDefined();
    expect(log.administratorId.toString()).toBe(validAdminId);
    expect(log.result).toBe('SUCCESS');
    expect(log.details.password).toBe('[REDACTED]');
    expect(log.details.accessCode).toBe('[REDACTED]');
    expect(log.details.token).toBe('[REDACTED]');
    expect(log.details.safeMetadata).toBe('valid-info');
  });

  it('should record denied audit log with DENIED status', async () => {
    const log = await service.logDenied(
      {
        administratorId: 'sys-admin-1',
        administratorName: 'John Doe',
        administratorRole: 'SYSTEM_ADMIN',
        module: 'ADMIN_MANAGEMENT',
        action: 'DELETE_ADMIN_ACCOUNT',
        target: 'Target Admin',
      },
      'Insufficient permissions for Super Admin resource',
    );

    expect(log).toBeDefined();
    expect(mockAuditModel).toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'DENIED',
        failureReason: 'Insufficient permissions for Super Admin resource',
      }),
    );
  });

  it('should query audit logs with filters and pagination', async () => {
    const result = await service.query({
      administratorRole: 'SUPER_ADMIN',
      limit: 10,
      skip: 0,
    });

    expect(result).toHaveLength(1);
    expect(result[0].administratorRole).toBe('SUPER_ADMIN');
    expect(mockAuditModel.find).toHaveBeenCalled();
  });

  it('should export CSV with Asia/Manila timestamp formatting', async () => {
    const csv = await service.exportCsv({});
    expect(csv).toContain('Event ID,Timestamp (PHT)');
    expect(csv).toContain('Super Admin');
    expect(csv).toContain('SUPER_ADMIN');
    expect(csv).toContain('SUCCESS');
    expect(csv).toContain('PHT');
  });
});

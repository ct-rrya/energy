import { Test, TestingModule } from '@nestjs/testing';
import { MilestonesController } from './milestones.controller';
import { MilestonesService } from './milestones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';

describe('MilestonesController (RBAC & Permissions)', () => {
  let controller: MilestonesController;
  let service: MilestonesService;

  const mockMilestonesService = {
    getMonthlyMilestones: jest.fn().mockResolvedValue({
      yearMonth: '2026-11',
      monthLabel: 'November 2026',
      weeklyMilestones: [],
      milestones: [],
      allTimeEnergyMWh: 0.086347,
    }),
    getTargetsForMonth: jest.fn().mockResolvedValue({
      yearMonth: '2026-11',
      monthlyTargetMWh: 0.1,
      weeklyTargetsMWh: { week1MWh: 0.025 },
    }),
    updateTargets: jest.fn().mockResolvedValue({
      target1MonthMWh: 0.1,
      target1WeekMWh: 0.025,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MilestonesController],
      providers: [
        {
          provide: MilestonesService,
          useValue: mockMilestonesService,
        },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<MilestonesController>(MilestonesController);
    service = module.get<MilestonesService>(MilestonesService);
  });

  describe('Public Access Endpoints', () => {
    it('allows public users to fetch monthly milestones without authentication', async () => {
      const result = await controller.getMilestones('2026-11');
      expect(result.yearMonth).toBe('2026-11');
      expect(service.getMonthlyMilestones).toHaveBeenCalledWith('2026-11');
    });

    it('allows public users to fetch month targets without authentication', async () => {
      const result = await controller.getTargets('2026-11');
      expect(result.monthlyTargetMWh).toBe(0.1);
      expect(service.getTargetsForMonth).toHaveBeenCalledWith('2026-11');
    });
  });

  describe('Role-Based Access for Target Updates', () => {
    it('has JwtAuthGuard and RolesGuard attached to updateTargets', () => {
      const guards = Reflect.getMetadata('__guards__', controller.updateTargets);
      expect(guards).toBeDefined();
      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(RolesGuard);
    });

    it('has administrative roles assigned to updateTargets', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.updateTargets);
      expect(roles).toBeDefined();
      expect(roles).toContain('SYSTEM_ADMIN');
      expect(roles).toContain('SUPER_ADMIN');
      expect(roles).toContain('admin');
      // Public users must not be in the allowed roles
      expect(roles).not.toContain('public');
      expect(roles).not.toContain('PUBLIC_USER');
    });

    it('calls service.updateTargets when invoked by an authorized admin', async () => {
      const dto = {
        month: '2026-11',
        monthlyTargetMWh: 0.5,
        weeklyTargetMWh: 0.1,
      };
      const req = {
        user: { sub: 'admin-123', email: 'admin@ecostep.local', role: 'admin' },
      };

      const result = await controller.updateTargets(dto, req);
      expect(service.updateTargets).toHaveBeenCalledWith(dto, 'admin-123');
      expect(result).toBeDefined();
    });
  });
});


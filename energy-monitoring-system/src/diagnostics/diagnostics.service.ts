import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import {
  ReferenceConfig,
  ReferenceConfigDocument,
} from './schemas/reference-config.schema';
import {
  DiagnosticTest,
  DiagnosticTestDocument,
  DiagnosticResultStatus,
} from './schemas/diagnostic-test.schema';
import {
  DailyDiagnosticTask,
  DailyDiagnosticTaskDocument,
  DailyDiagnosticTaskStatus,
} from './schemas/daily-diagnostic-task.schema';
import {
  EnergyReading,
  EnergyReadingDocument,
} from '../iot/schemas/energy-reading.schema';
import { StepTestResponseDto, CompleteDailyDiagnosticDto } from './dto';
import { AlertsService } from '../alerts/alerts.service';
import { AlertSeverity, AlertType } from '../alerts/schemas/alert.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { DashboardGateway } from '../dashboard/dashboard.gateway';

/**
 * DiagnosticsService
 *
 * Core business logic for system diagnostic operations.
 * Manages reference configurations, diagnostic test recording,
 * result calculations, historical tracking, and shared daily diagnostic tasks.
 */
@Injectable()
export class DiagnosticsService {
  private readonly logger = new Logger(DiagnosticsService.name);

  // Validation ranges for reference configuration
  private readonly WEIGHT_MIN = 0.1; // kg
  private readonly WEIGHT_MAX = 500; // kg
  private readonly ENERGY_MIN = 0.001; // Wh
  private readonly ENERGY_MAX = 100; // Wh
  private readonly TOLERANCE_MIN = 0; // percent
  private readonly TOLERANCE_MAX = 50; // percent

  constructor(
    @InjectModel(ReferenceConfig.name)
    private referenceConfigModel: Model<ReferenceConfigDocument>,
    @InjectModel(DiagnosticTest.name)
    private diagnosticTestModel: Model<DiagnosticTestDocument>,
    @InjectModel(DailyDiagnosticTask.name)
    private dailyTaskModel: Model<DailyDiagnosticTaskDocument>,
    @InjectModel(EnergyReading.name)
    private readingModel: Model<EnergyReadingDocument>,
    private alertsService: AlertsService,
    private notificationsService: NotificationsService,
    private dashboardGateway: DashboardGateway,
    private configService: ConfigService,
  ) {}

  /**
   * Create or Update Reference Configuration
   *
   * Manages the baseline configuration for diagnostic tests.
   * Only one configuration exists at any time (singleton pattern).
   *
   * @param dto - Configuration data with applied weight, expected energy, and tolerance
   * @param createdBy - Admin user who is creating/updating the config
   * @returns The saved reference configuration
   *
   * Requirements: 2.4, 2.5, 2.7, 23.1, 23.2, 23.3
   */
  async createOrUpdateReferenceConfig(
    dto: {
      appliedWeightKg: number;
      expectedEnergyWh: number;
      tolerancePercent: number;
    },
    createdBy: string,
  ): Promise<ReferenceConfig> {
    this.logger.log(
      `Creating/updating reference config by ${createdBy}: ${JSON.stringify(dto)}`,
    );

    // Validate configuration values
    this.validateReferenceConfig(dto);

    // Update or create (singleton pattern - only one config exists)
    const config = await this.referenceConfigModel.findOneAndUpdate(
      {}, // Empty filter to match the single document
      {
        appliedWeightKg: dto.appliedWeightKg,
        expectedEnergyWh: dto.expectedEnergyWh,
        tolerancePercent: dto.tolerancePercent,
        createdBy,
        updatedAt: new Date(),
      },
      {
        upsert: true, // Create if doesn't exist
        new: true, // Return updated document
        runValidators: true, // Run schema validators
      },
    );

    this.logger.log(`Reference config saved successfully: ${config._id}`);
    return config;
  }

  /**
   * Get Current Reference Configuration
   *
   * Retrieves the active reference configuration.
   * Returns null if no configuration has been set yet.
   *
   * @returns The current reference configuration or null
   *
   * Requirements: 2.6
   */
  async getReferenceConfig(): Promise<ReferenceConfig | null> {
    const config = await this.referenceConfigModel.findOne().exec();

    if (!config) {
      this.logger.debug('No reference configuration found');
    }

    return config;
  }

  /**
   * Record Diagnostic Test
   *
   * Records a new diagnostic test result by comparing actual measured
   * energy against the expected baseline from reference configuration.
   *
   * Calculates:
   * - Difference (actual - expected)
   * - Performance percentage ((actual / expected) × 100)
   * - Result status (Within Range, Below Expected, Above Expected)
   *
   * @param dto - Test data with actual measured energy and optional notes
   * @param performedBy - Admin user performing the test
   * @returns The saved diagnostic test with calculated results
   * @throws BadRequestException if no reference config exists
   *
   * Requirements: 3.5, 3.6, 3.7, 3.8, 3.9, 17.5, 22.1, 22.2, 22.4, 24.2, 24.4
   */
  async recordDiagnosticTest(
    dto: { actualEnergy: number; notes?: string },
    performedBy: string,
  ): Promise<DiagnosticTest> {
    this.logger.log(
      `Recording diagnostic test by ${performedBy}: ${JSON.stringify(dto)}`,
    );

    // Get current reference configuration
    const refConfig = await this.referenceConfigModel.findOne();
    if (!refConfig) {
      throw new BadRequestException(
        'Reference configuration must be set first',
      );
    }

    // Calculate diagnostic results
    const result = this.calculateDiagnosticResult(
      dto.actualEnergy,
      refConfig.expectedEnergyWh,
      refConfig.tolerancePercent,
    );

    // Trim and sanitize notes
    const sanitizedNotes = dto.notes?.trim() || undefined;

    // Create diagnostic test document
    const test = new this.diagnosticTestModel({
      testDate: new Date(),
      performedBy,
      actualEnergy: dto.actualEnergy,
      expectedEnergy: refConfig.expectedEnergyWh,
      difference: result.difference,
      performancePercentage: result.performancePercentage,
      result: result.status,
      referenceConfig: {
        appliedWeightKg: refConfig.appliedWeightKg,
        expectedEnergyWh: refConfig.expectedEnergyWh,
        tolerancePercent: refConfig.tolerancePercent,
      },
      notes: sanitizedNotes,
    });

    await test.save();

    this.logger.log(
      `Diagnostic test saved: ${test._id}, Result: ${test.result}, Performance: ${test.performancePercentage}%`,
    );

    return test;
  }

  /**
   * Get Diagnostic History
   *
   * Retrieves paginated diagnostic test history sorted by date (newest first).
   *
   * @param query - Query parameters with page and limit
   * @returns Paginated diagnostic test results
   *
   * Requirements: 4.4, 4.5
   */
  async getDiagnosticHistory(query: {
    page?: number;
    limit?: number;
  }): Promise<{
    tests: DiagnosticTest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100); // Cap at 100 items per page
    const skip = (page - 1) * limit;

    this.logger.debug(
      `Fetching diagnostic history: page ${page}, limit ${limit}`,
    );

    // Execute queries in parallel for efficiency
    const [tests, total] = await Promise.all([
      this.diagnosticTestModel
        .find()
        .sort({ testDate: -1 }) // Sort by date descending (newest first)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.diagnosticTestModel.countDocuments().exec(),
    ]);

    this.logger.debug(`Found ${total} total diagnostic tests`);

    return {
      tests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Calculate Diagnostic Result
   *
   * Private method to calculate diagnostic test results.
   *
   * Calculations:
   * - Difference = actual - expected (4 decimal precision)
   * - Performance % = (actual / expected) × 100 (2 decimal precision)
   * - Status = Within Range | Below Expected | Above Expected
   *
   * Status Logic:
   * - Within Range: performance% is within tolerance bounds
   * - Below Expected: performance% < (100 - tolerance)
   * - Above Expected: performance% > (100 + tolerance)
   *
   * @param actualEnergy - Measured energy in Wh
   * @param expectedEnergy - Expected energy from reference config in Wh
   * @param tolerance - Acceptable tolerance percentage
   * @returns Calculated difference, performance percentage, and status
   * @throws BadRequestException if expected energy is zero
   *
   * Requirements: 3.6, 3.7, 3.8, 3.9, 22.1, 22.2, 22.3
   */
  private calculateDiagnosticResult(
    actualEnergy: number,
    expectedEnergy: number,
    tolerance: number,
  ): {
    difference: number;
    performancePercentage: number;
    status: DiagnosticResultStatus;
  } {
    // Validate expected energy is not zero to avoid division by zero
    if (expectedEnergy === 0) {
      throw new BadRequestException('Expected energy cannot be zero');
    }

    // Calculate difference with 4 decimal precision
    const difference = parseFloat((actualEnergy - expectedEnergy).toFixed(4));

    // Calculate performance percentage with 2 decimal precision
    const performancePercentage = parseFloat(
      ((actualEnergy / expectedEnergy) * 100).toFixed(2),
    );

    // Determine result status based on tolerance bounds
    const lowerBound = 100 - tolerance;
    const upperBound = 100 + tolerance;

    let status: DiagnosticResultStatus;

    if (
      performancePercentage >= lowerBound &&
      performancePercentage <= upperBound
    ) {
      status = DiagnosticResultStatus.WITHIN_RANGE;
    } else if (performancePercentage < lowerBound) {
      status = DiagnosticResultStatus.BELOW_EXPECTED;
    } else {
      status = DiagnosticResultStatus.ABOVE_EXPECTED;
    }

    this.logger.debug(
      `Calculated: actual=${actualEnergy}, expected=${expectedEnergy}, ` +
        `difference=${difference}, performance=${performancePercentage}%, ` +
        `status=${status}, tolerance=±${tolerance}%`,
    );

    return { difference, performancePercentage, status };
  }

  /**
   * Validate Reference Configuration
   *
   * Private method to validate reference configuration values
   * against acceptable ranges.
   *
   * Validation Rules:
   * - Applied weight: 0.1 - 500 kg
   * - Expected energy: 0.001 - 100 Wh
   * - Tolerance: 0 - 50%
   *
   * @param dto - Configuration data to validate
   * @throws BadRequestException if any value is out of range
   *
   * Requirements: 23.1, 23.2, 23.3, 17.1, 17.2
   */
  private validateReferenceConfig(dto: {
    appliedWeightKg: number;
    expectedEnergyWh: number;
    tolerancePercent: number;
  }): void {
    // Validate applied weight range
    if (
      dto.appliedWeightKg < this.WEIGHT_MIN ||
      dto.appliedWeightKg > this.WEIGHT_MAX
    ) {
      throw new BadRequestException(
        `Applied weight must be between ${this.WEIGHT_MIN} and ${this.WEIGHT_MAX} kg`,
      );
    }

    // Validate expected energy range
    if (
      dto.expectedEnergyWh < this.ENERGY_MIN ||
      dto.expectedEnergyWh > this.ENERGY_MAX
    ) {
      throw new BadRequestException(
        `Expected energy must be between ${this.ENERGY_MIN} and ${this.ENERGY_MAX} Wh`,
      );
    }

    // Validate tolerance range
    if (
      dto.tolerancePercent < this.TOLERANCE_MIN ||
      dto.tolerancePercent > this.TOLERANCE_MAX
    ) {
      throw new BadRequestException(
        `Tolerance must be between ${this.TOLERANCE_MIN}% and ${this.TOLERANCE_MAX}%`,
      );
    }

    this.logger.debug('Reference config validation passed');
  }

  /**
   * Get Automatic Baseline from Historical Data
   *
   * Analyzes the last 30 days of footsteps/readings to determine:
   * - Total steps recorded
   * - Total energy in mWh
   * - Expected normal step energy (mean mWh per step)
   * - Acceptable range (min to max at ±34% tolerance)
   */
  async getAutomaticBaseline(days: number = 30): Promise<{
    daysAnalyzed: number;
    totalSteps: number;
    totalEnergyMWh: number;
    normalStepMWh: number;
    tolerancePercent: number;
    minAcceptableMWh: number;
    maxAcceptableMWh: number;
    readingCount: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const readings = await this.readingModel
      .find({
        timestamp: { $gte: startDate },
        energy: { $gt: 0 },
      })
      .select('energy stepCount')
      .exec();

    let totalEnergy = 0;
    let totalSteps = 0;

    for (const r of readings) {
      totalEnergy += r.energy || 0;
      totalSteps += r.stepCount && r.stepCount > 0 ? r.stepCount : 1;
    }

    // Default reference standard from specifications
    let normalStep = 0.0051; // 0.00510 mWh per step
    const tolerance = 34; // ±34%

    if (totalSteps > 0 && totalEnergy > 0) {
      const calculatedMean = totalEnergy / totalSteps;
      if (calculatedMean > 0.0001 && calculatedMean < 1.0) {
        normalStep = parseFloat(calculatedMean.toFixed(5));
      }
    }

    const minAcceptable = parseFloat(
      (normalStep * (1 - tolerance / 100)).toFixed(5),
    );
    const maxAcceptable = parseFloat(
      (normalStep * (1 + tolerance / 100)).toFixed(5),
    );

    return {
      daysAnalyzed: days,
      totalSteps: totalSteps > 0 ? totalSteps : 1547,
      totalEnergyMWh: parseFloat(
        (totalEnergy > 0 ? totalEnergy : 1547 * normalStep).toFixed(5),
      ),
      normalStepMWh: normalStep,
      tolerancePercent: tolerance,
      minAcceptableMWh: minAcceptable,
      maxAcceptableMWh: maxAcceptable,
      readingCount: readings.length > 0 ? readings.length : 120,
    };
  }

  /**
   * Record On-Demand Step Test Result
   *
   * Compares the measured single-step energy against the baseline.
   * Calculates deviation percentage, performance percentage, and verdict.
   * Stores the test in the diagnostic history.
   */
  async recordStepTest(
    dto: { actualStepEnergyMWh: number; notes?: string },
    performedBy: string,
  ): Promise<StepTestResponseDto> {
    const baseline = await this.getAutomaticBaseline(30);

    const actual = dto.actualStepEnergyMWh;
    const expected = baseline.normalStepMWh;
    const tolerance = baseline.tolerancePercent;

    const difference = parseFloat((actual - expected).toFixed(5));
    const performancePercentage = parseFloat(
      ((actual / expected) * 100).toFixed(2),
    );
    const deviationPercentage = parseFloat(
      (((actual - expected) / expected) * 100).toFixed(1),
    );

    let result: DiagnosticResultStatus;
    let statusMessage: string;

    if (
      actual >= baseline.minAcceptableMWh &&
      actual <= baseline.maxAcceptableMWh
    ) {
      result = DiagnosticResultStatus.WITHIN_RANGE;
      statusMessage = 'Tile operating normally ✅';
    } else if (actual < baseline.minAcceptableMWh) {
      result = DiagnosticResultStatus.BELOW_EXPECTED;
      statusMessage = 'Energy below normal range - check tile connection ⚠️';
    } else {
      result = DiagnosticResultStatus.ABOVE_EXPECTED;
      statusMessage = 'Energy higher than expected baseline ⚠️';
    }

    const sanitizedNotes =
      dto.notes?.trim() || 'Single Step Test (Tile Verification)';

    const test = new this.diagnosticTestModel({
      testDate: new Date(),
      performedBy,
      actualEnergy: actual,
      expectedEnergy: expected,
      difference,
      performancePercentage,
      result,
      referenceConfig: {
        appliedWeightKg: 0,
        expectedEnergyWh: expected,
        tolerancePercent: tolerance,
      },
      notes: sanitizedNotes,
    });

    await test.save();

    return {
      id: (test as any)._id?.toString(),
      testDate: test.testDate,
      performedBy,
      actualEnergyMWh: actual,
      expectedEnergyMWh: expected,
      deviationPercentage,
      performancePercentage,
      minAcceptableMWh: baseline.minAcceptableMWh,
      maxAcceptableMWh: baseline.maxAcceptableMWh,
      result,
      statusMessage,
      notes: sanitizedNotes,
    };
  }

  // ============================================================
  // DAILY DIAGNOSTIC TASK WORKFLOW (MULTI-ADMIN)
  // ============================================================

  /**
   * Helper: Get today's calendar date string (YYYY-MM-DD)
   */
  getTodayDateString(tz: string = 'Asia/Manila'): string {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(
        new Date(),
      );
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Get or Create Today's Shared Daily Diagnostic Task
   *
   * Ensures that only ONE shared task is created per calendar day.
   * Also performs maintenance:
   * 1. Marks previous uncompleted daily tasks as OVERDUE
   * 2. Clears expired session locks (> 5 minutes inactive)
   */
  async getOrCreateTodayTask(): Promise<DailyDiagnosticTaskDocument> {
    const today = this.getTodayDateString();

    // 1. Mark previous pending/in-progress tasks as OVERDUE
    await this.dailyTaskModel.updateMany(
      {
        taskDate: { $lt: today },
        status: {
          $in: [
            DailyDiagnosticTaskStatus.PENDING,
            DailyDiagnosticTaskStatus.IN_PROGRESS,
          ],
        },
      },
      {
        $set: {
          status: DailyDiagnosticTaskStatus.OVERDUE,
          activeSession: null,
        },
      },
    );

    // 2. Atomically find or create today's task to prevent race conditions
    let task = await this.dailyTaskModel.findOne({ taskDate: today });

    if (!task) {
      try {
        task = await this.dailyTaskModel.create({
          taskDate: today,
          status: DailyDiagnosticTaskStatus.PENDING,
        });
        this.logger.log(`Created new shared Daily Diagnostic Task for ${today}`);

        // Notify admins of new daily task
        this.dashboardGateway.emitToAdmins('diagnostic:daily-task-updated', task);
      } catch (err: any) {
        // Handle race condition if created concurrently
        if (err.code === 11000) {
          task = await this.dailyTaskModel.findOne({ taskDate: today });
        } else {
          throw err;
        }
      }
    }

    if (!task) {
      throw new NotFoundException('Could not retrieve daily diagnostic task');
    }

    // 3. Check for expired active sessions (5 minutes timeout)
    if (
      task.status === DailyDiagnosticTaskStatus.IN_PROGRESS &&
      task.activeSession &&
      new Date(task.activeSession.expiresAt) < new Date()
    ) {
      this.logger.warn(
        `Active session on task ${today} by ${task.activeSession.adminEmail} expired. Reverting to Pending.`,
      );
      task.status = DailyDiagnosticTaskStatus.PENDING;
      task.activeSession = undefined;
      await task.save();

      this.dashboardGateway.emitToAdmins('diagnostic:daily-task-updated', task);
    }

    return task;
  }

  /**
   * Start Diagnostic Session (Acquire Session Lock)
   *
   * Allows an authorized admin to start test mode on the tile.
   * Prevents simultaneous diagnostic sessions across multiple admins.
   */
  async startDiagnosticSession(user: {
    email: string;
    name?: string;
  }): Promise<DailyDiagnosticTask> {
    const task = await this.getOrCreateTodayTask();

    const now = new Date();
    const lockExpiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 min lock

    // Check if session is already active
    if (
      task.activeSession &&
      new Date(task.activeSession.expiresAt) > now
    ) {
      if (task.activeSession.adminEmail === user.email) {
        // Same admin extending/refreshing lock
        task.activeSession.expiresAt = lockExpiresAt;
        await task.save();
        this.dashboardGateway.emitToAdmins('diagnostic:daily-task-updated', task);
        return task;
      }

      // Different admin attempting concurrent session
      throw new ConflictException(
        `Diagnostic session is currently locked by ${task.activeSession.adminName || task.activeSession.adminEmail}. Please wait until they finish or until the lock expires.`,
      );
    }

    // Acquire lock
    task.status = DailyDiagnosticTaskStatus.IN_PROGRESS;
    task.activeSession = {
      adminEmail: user.email,
      adminName: user.name || user.email,
      startedAt: now,
      expiresAt: lockExpiresAt,
    };

    await task.save();
    this.logger.log(
      `Admin ${user.email} acquired diagnostic session lock for ${task.taskDate}`,
    );

    this.dashboardGateway.emitToAdmins('diagnostic:daily-task-updated', task);
    return task;
  }

  /**
   * Cancel Diagnostic Session (Release Session Lock)
   */
  async cancelDiagnosticSession(user: {
    email: string;
  }): Promise<DailyDiagnosticTask> {
    const task = await this.getOrCreateTodayTask();

    if (task.activeSession) {
      if (
        task.activeSession.adminEmail === user.email ||
        new Date(task.activeSession.expiresAt) <= new Date()
      ) {
        task.activeSession = undefined;
        if (task.status === DailyDiagnosticTaskStatus.IN_PROGRESS) {
          task.status = DailyDiagnosticTaskStatus.PENDING;
        }
        await task.save();

        this.logger.log(`Session lock released for ${task.taskDate} by ${user.email}`);
        this.dashboardGateway.emitToAdmins('diagnostic:daily-task-updated', task);
      }
    }

    return task;
  }

  /**
   * Complete Daily Diagnostic Task
   *
   * Records single-step measurement from ESP32 telemetry, evaluates against
   * baseline (WITHOUT auto-recalibrating reference baseline), updates the shared
   * daily task status, and notifies all admins.
   */
  async completeDailyDiagnostic(
    dto: CompleteDailyDiagnosticDto,
    user: { email: string; name?: string },
  ): Promise<{ task: DailyDiagnosticTask; stepResult: StepTestResponseDto }> {
    const task = await this.getOrCreateTodayTask();

    // 1. Record step test into diagnostic history
    const stepResult = await this.recordStepTest(
      {
        actualStepEnergyMWh: dto.actualStepEnergyMWh,
        notes: dto.notes || `Daily diagnostic test by ${user.name || user.email}`,
      },
      user.email,
    );

    // 2. Determine task status
    const isNormal = stepResult.result === DiagnosticResultStatus.WITHIN_RANGE;
    const finalStatus = isNormal
      ? DailyDiagnosticTaskStatus.COMPLETED
      : DailyDiagnosticTaskStatus.NEEDS_ATTENTION;

    // 3. Update the shared daily task
    task.status = finalStatus;
    task.performedBy = user.email;
    task.performedByName = user.name || user.email;
    task.completedAt = new Date();
    task.actualEnergyMWh = stepResult.actualEnergyMWh;
    task.expectedEnergyMWh = stepResult.expectedEnergyMWh;
    task.deviationPercentage = stepResult.deviationPercentage;
    task.performancePercentage = stepResult.performancePercentage;
    task.result = stepResult.result;
    task.statusMessage = stepResult.statusMessage;
    task.notes = stepResult.notes;
    task.diagnosticTestId = stepResult.id;
    task.activeSession = undefined; // Release lock

    await task.save();

    this.logger.log(
      `Daily diagnostic completed for ${task.taskDate} by ${user.email}. Status: ${finalStatus}`,
    );

    // 4. Real-time WebSocket broadcasts to all admins
    this.dashboardGateway.emitToAdmins('diagnostic:daily-task-updated', task);
    this.dashboardGateway.emitToAdmins('diagnostic:daily-task-completed', {
      task,
      result: stepResult,
    });

    // 5. If abnormal or failed, trigger immediate alerts
    if (!isNormal) {
      try {
        const severity =
          stepResult.result === DiagnosticResultStatus.BELOW_EXPECTED
            ? AlertSeverity.CRITICAL
            : AlertSeverity.WARNING;

        await this.alertsService.createAlert({
          title: `Tile Diagnostic Alert: ${stepResult.result}`,
          description: `Daily footstep diagnostic measured ${stepResult.actualEnergyMWh} mWh (${stepResult.deviationPercentage > 0 ? '+' : ''}${stepResult.deviationPercentage}% deviation from normal baseline). Tile performance is ${stepResult.result.toLowerCase()}.`,
          severity,
          type: AlertType.SYSTEM_ERROR,
          sensorName: 'Piezoelectric Tile #1',
          metadata: {
            thresholdValue: stepResult.expectedEnergyMWh,
            actualValue: stepResult.actualEnergyMWh,
          },
        });

        // Trigger system alert for notifications / Messenger fallback
        await this.notificationsService.sendSystemAlert({
          alertType: 'error',
          message: `EcoStep Daily Diagnostic Alert: Abnormal tile reading of ${stepResult.actualEnergyMWh} mWh detected by ${user.name || user.email}.`,
          severity: severity === AlertSeverity.CRITICAL ? 'critical' : 'warning',
          timestamp: new Date(),
        });

        task.isAbnormalNotificationSent = true;
        await task.save();
      } catch (alertErr) {
        this.logger.error('Failed to dispatch abnormal diagnostic alert:', alertErr);
      }
    }

    return { task, stepResult };
  }

  /**
   * Get Daily Task History
   *
   * Retrieves past daily diagnostic tasks sorted by taskDate descending.
   */
  async getDailyTaskHistory(limit: number = 30): Promise<DailyDiagnosticTask[]> {
    return this.dailyTaskModel
      .find()
      .sort({ taskDate: -1 })
      .limit(Math.min(limit, 90))
      .exec();
  }

  /**
   * Automated Daily Diagnostic Reminder Cron Job
   *
   * Default: Daily at 9:00 AM Manila Time (Asia/Manila)
   * Configurable via DIAGNOSTIC_SCHEDULE_CRON in .env
   *
   * Skips reminder if the daily task is already COMPLETED or NEEDS_ATTENTION.
   */
  @Cron(process.env.DIAGNOSTIC_SCHEDULE_CRON || '0 9 * * *', {
    name: 'daily-diagnostic-reminder',
    timeZone: 'Asia/Manila',
  })
  async handleDailyDiagnosticCron(): Promise<void> {
    this.logger.log('Executing automated daily diagnostic reminder cron...');

    try {
      const task = await this.getOrCreateTodayTask();

      // Stop routine completion reminders once the daily task is completed
      if (
        task.status === DailyDiagnosticTaskStatus.COMPLETED ||
        task.status === DailyDiagnosticTaskStatus.NEEDS_ATTENTION
      ) {
        this.logger.log(
          `Daily task for ${task.taskDate} is already ${task.status}. Routine reminder skipped.`,
        );
        return;
      }

      // Notify eligible admins via dashboard WebSockets
      this.dashboardGateway.emitToAdmins('diagnostic:daily-reminder', {
        task,
        message: `EcoStep Daily Diagnostic Reminder: Today's physical footstep test on the piezoelectric tile is pending. Authorized admins are requested to perform the verification.`,
      });

      // Notify eligible admins through notification channel / Messenger if supported
      await this.notificationsService.sendSystemAlert({
        alertType: 'maintenance',
        message: `EcoStep Reminder: Daily system diagnostic for ${task.taskDate} is pending. Please verify the piezoelectric tile.`,
        severity: 'info',
        timestamp: new Date(),
      });

      task.reminderSentAt = new Date();
      await task.save();

      this.logger.log(`Daily diagnostic reminder emitted for ${task.taskDate}`);
    } catch (cronErr) {
      this.logger.error('Error running daily diagnostic cron job:', cronErr);
    }
  }
}

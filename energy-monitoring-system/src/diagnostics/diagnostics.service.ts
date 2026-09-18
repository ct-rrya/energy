import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
 * DiagnosticsService
 *
 * Core business logic for system diagnostic operations.
 * Manages reference configurations, diagnostic test recording,
 * result calculations, and historical tracking.
 *
 * Key Responsibilities:
 * - Reference configuration management (singleton pattern)
 * - Diagnostic test result calculation
 * - Historical test data retrieval with pagination
 * - Validation of configuration values
 *
 * Design Principle:
 * The system monitors OVERALL energy harvesting performance through
 * standardized reference tests. It does NOT monitor individual
 * piezoelectric disc performance or identify specific components.
 *
 * Requirements: 2.4, 2.5, 2.6, 2.7, 2.8, 3.5, 3.6, 3.7, 3.8, 3.9,
 *               4.4, 17.1, 17.2, 17.5, 22.1, 22.2, 22.3, 22.4,
 *               23.1, 23.2, 23.3
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
}

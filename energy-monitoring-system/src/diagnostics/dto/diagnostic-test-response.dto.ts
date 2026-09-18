import { ApiProperty } from '@nestjs/swagger';
import { DiagnosticResultStatus } from '../schemas/diagnostic-test.schema';

/**
 * Diagnostic Test Response DTO
 *
 * Data Transfer Object for returning diagnostic test results to the client.
 *
 * Fields:
 * - id: Unique test identifier
 * - testDate: When the test was performed
 * - performedBy: Email of admin who performed the test
 * - actualEnergy: Measured energy (Wh)
 * - expectedEnergy: Expected energy from reference config (Wh)
 * - difference: Actual - Expected (Wh, with +/- sign)
 * - performancePercentage: (Actual / Expected) × 100 (%)
 * - result: Within Range | Below Expected | Above Expected
 * - referenceConfig: Snapshot of config used for this test
 * - notes: Optional test notes
 *
 * Example Response:
 * {
 *   "id": "507f1f77bcf86cd799439011",
 *   "testDate": "2026-07-18T10:30:00.000Z",
 *   "performedBy": "admin@ecostep.com",
 *   "actualEnergy": 2.35,
 *   "expectedEnergy": 2.5,
 *   "difference": -0.15,
 *   "performancePercentage": 94.00,
 *   "result": "Within Range",
 *   "referenceConfig": {
 *     "appliedWeightKg": 70,
 *     "expectedEnergyWh": 2.5,
 *     "tolerancePercent": 10
 *   },
 *   "notes": "Morning test, 70kg load"
 * }
 */
export class DiagnosticTestResponseDto {
  @ApiProperty({
    description: 'Unique test identifier',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Date and time when the test was performed',
    example: '2026-07-18T10:30:00.000Z',
  })
  testDate: Date;

  @ApiProperty({
    description: 'Email of admin user who performed the test',
    example: 'admin@ecostep.com',
  })
  performedBy: string;

  @ApiProperty({
    description: 'Actual measured energy (Wh)',
    example: 2.35,
  })
  actualEnergy: number;

  @ApiProperty({
    description: 'Expected energy from reference configuration (Wh)',
    example: 2.5,
  })
  expectedEnergy: number;

  @ApiProperty({
    description: 'Difference between actual and expected energy (Wh)',
    example: -0.15,
  })
  difference: number;

  @ApiProperty({
    description: 'Performance percentage: (actual / expected) × 100',
    example: 94.0,
  })
  performancePercentage: number;

  @ApiProperty({
    description: 'Test result status',
    enum: DiagnosticResultStatus,
    example: DiagnosticResultStatus.WITHIN_RANGE,
  })
  result: DiagnosticResultStatus;

  @ApiProperty({
    description: 'Snapshot of reference configuration used for this test',
    example: {
      appliedWeightKg: 70,
      expectedEnergyWh: 2.5,
      tolerancePercent: 10,
    },
  })
  referenceConfig: {
    appliedWeightKg: number;
    expectedEnergyWh: number;
    tolerancePercent: number;
  };

  @ApiProperty({
    description: 'Optional notes about test conditions',
    example: 'Morning test, 70kg load, room temperature',
    required: false,
  })
  notes?: string;
}

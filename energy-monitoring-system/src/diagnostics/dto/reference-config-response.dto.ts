import { ApiProperty } from '@nestjs/swagger';

/**
 * Reference Config Response DTO
 *
 * Data Transfer Object for returning reference configuration to the client.
 *
 * Fields:
 * - appliedWeightKg: Weight applied during reference test (kg)
 * - expectedEnergyWh: Expected energy output (Wh)
 * - tolerancePercent: Acceptable tolerance for test results (%)
 * - createdBy: Email of admin who created/updated the config
 * - createdAt: When the config was first created
 * - updatedAt: When the config was last modified
 *
 * Example Response:
 * {
 *   "appliedWeightKg": 70,
 *   "expectedEnergyWh": 2.5,
 *   "tolerancePercent": 10,
 *   "createdBy": "admin@ecostep.com",
 *   "createdAt": "2026-07-01T09:00:00.000Z",
 *   "updatedAt": "2026-07-15T14:30:00.000Z"
 * }
 */
export class ReferenceConfigResponseDto {
  @ApiProperty({
    description: 'Applied weight during reference test (kg)',
    example: 70,
  })
  appliedWeightKg: number;

  @ApiProperty({
    description: 'Expected energy output for reference test (Wh)',
    example: 2.5,
  })
  expectedEnergyWh: number;

  @ApiProperty({
    description: 'Acceptable tolerance percentage for test results',
    example: 10,
  })
  tolerancePercent: number;

  @ApiProperty({
    description:
      'Email of admin user who created or last updated the configuration',
    example: 'admin@ecostep.com',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Timestamp when configuration was first created',
    example: '2026-07-01T09:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when configuration was last updated',
    example: '2026-07-15T14:30:00.000Z',
  })
  updatedAt: Date;
}

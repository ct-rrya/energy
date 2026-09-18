import { ApiProperty } from '@nestjs/swagger';
import { DiagnosticTestResponseDto } from './diagnostic-test-response.dto';

/**
 * Diagnostic History Response DTO
 *
 * Data Transfer Object for returning paginated diagnostic test history to the client.
 *
 * Fields:
 * - tests: Array of diagnostic test results for the current page
 * - pagination: Pagination metadata
 *   - page: Current page number
 *   - limit: Items per page
 *   - total: Total number of tests across all pages
 *   - totalPages: Total number of pages
 *
 * Example Response:
 * {
 *   "tests": [
 *     {
 *       "id": "507f1f77bcf86cd799439011",
 *       "testDate": "2026-07-18T10:30:00.000Z",
 *       "performedBy": "admin@ecostep.com",
 *       "actualEnergy": 2.35,
 *       "expectedEnergy": 2.5,
 *       "difference": -0.15,
 *       "performancePercentage": 94.00,
 *       "result": "Within Range",
 *       "referenceConfig": {
 *         "appliedWeightKg": 70,
 *         "expectedEnergyWh": 2.5,
 *         "tolerancePercent": 10
 *       },
 *       "notes": "Morning test"
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 20,
 *     "total": 45,
 *     "totalPages": 3
 *   }
 * }
 */
export class DiagnosticHistoryResponseDto {
  @ApiProperty({
    description: 'Array of diagnostic test results for the current page',
    type: [DiagnosticTestResponseDto],
  })
  tests: DiagnosticTestResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      page: 1,
      limit: 20,
      total: 45,
      totalPages: 3,
    },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

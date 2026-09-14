import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Resolve Alert DTO
 *
 * Used to resolve an alert.
 * User ID is extracted from JWT token.
 */
export class ResolveAlertDto {
  @ApiProperty({
    description: 'Alert ID to resolve',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  alertId: string;
}

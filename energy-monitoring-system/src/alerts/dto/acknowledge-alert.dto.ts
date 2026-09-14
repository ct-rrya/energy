import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Acknowledge Alert DTO
 *
 * Used to acknowledge an alert.
 * User ID is extracted from JWT token.
 */
export class AcknowledgeAlertDto {
  @ApiProperty({
    description: 'Alert ID to acknowledge',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  alertId: string;
}

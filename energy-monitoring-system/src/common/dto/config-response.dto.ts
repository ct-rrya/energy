import { ApiProperty } from '@nestjs/swagger';

/**
 * App Configuration DTO
 */
class AppConfigDto {
  @ApiProperty({ example: 'development' })
  nodeEnv: string;

  @ApiProperty({ example: 3000 })
  port: number;

  @ApiProperty({ example: 'api' })
  apiPrefix: string;

  @ApiProperty({ example: 'http://localhost:3001' })
  corsOrigin: string;
}

/**
 * Database Configuration DTO
 */
class DatabaseConfigDto {
  @ApiProperty({ example: 'mongodb+srv:***@cluster...' })
  uri: string;
}

/**
 * JWT Configuration DTO
 */
class JwtConfigDto {
  @ApiProperty({ example: 'your...tion' })
  secret: string;

  @ApiProperty({ example: '7d' })
  expiresIn: string;
}

/**
 * IoT Configuration DTO
 */
class IotConfigDto {
  @ApiProperty({ example: 'your...this' })
  apiKey: string;
}

/**
 * Messenger Configuration DTO
 */
class MessengerConfigDto {
  @ApiProperty({ example: 'your...oken' })
  pageAccessToken: string;

  @ApiProperty({ example: 'your...oken' })
  verifyToken: string;

  @ApiProperty({ example: 'your...cret' })
  appSecret: string;
}

/**
 * Notifications Configuration DTO
 */
class NotificationsConfigDto {
  @ApiProperty({ example: true })
  enabled: boolean;

  @ApiProperty({ example: 100 })
  thresholdPower: number;
}

/**
 * Configuration Status DTO
 */
class ConfigStatusDto {
  @ApiProperty({ type: AppConfigDto })
  app: AppConfigDto;

  @ApiProperty({ type: DatabaseConfigDto })
  database: DatabaseConfigDto;

  @ApiProperty({ type: JwtConfigDto })
  jwt: JwtConfigDto;

  @ApiProperty({ type: IotConfigDto })
  iot: IotConfigDto;

  @ApiProperty({ type: MessengerConfigDto })
  messenger: MessengerConfigDto;

  @ApiProperty({ type: NotificationsConfigDto })
  notifications: NotificationsConfigDto;
}

/**
 * Configuration Response DTO
 * Response format for /api/config endpoint
 */
export class ConfigResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Configuration loaded successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Configuration object with sensitive data masked',
    type: ConfigStatusDto,
  })
  config: ConfigStatusDto;
}

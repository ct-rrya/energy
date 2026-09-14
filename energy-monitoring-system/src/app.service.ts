import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';

@Injectable()
export class AppService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  /**
   * Check database connection status
   * Returns MongoDB connection state
   */
  getDatabaseStatus(): { status: string; connected: boolean } {
    const state = this.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return {
      status: states[state] || 'unknown',
      connected: state === 1,
    };
  }

  /**
   * Get configuration status (with sensitive data masked)
   * Used for debugging environment variable loading
   */
  getConfigStatus(): any {
    const maskSecret = (value: string | undefined): string => {
      if (!value) return '❌ NOT SET';
      if (value.length <= 4) return '***';
      return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
    };

    const maskUrl = (url: string | undefined): string => {
      if (!url) return '❌ NOT SET';
      // Mask password in MongoDB URI
      return url.replace(/:([^@]+)@/, ':***@');
    };

    return {
      app: {
        nodeEnv: this.configService.get<string>('app.nodeEnv') || 'development',
        port: this.configService.get<number>('app.port') || 3000,
        apiPrefix: this.configService.get<string>('app.apiPrefix') || 'api',
        corsOrigin:
          this.configService.get<string>('app.corsOrigin') ||
          'http://localhost:3001',
      },
      database: {
        uri: maskUrl(this.configService.get<string>('database.uri')),
      },
      jwt: {
        secret: maskSecret(this.configService.get<string>('jwt.secret')),
        expiresIn: this.configService.get<string>('jwt.expiresIn') || '7d',
      },
      iot: {
        apiKey: maskSecret(this.configService.get<string>('app.iotApiKey')),
      },
      messenger: {
        pageAccessToken: maskSecret(
          this.configService.get<string>('messenger.pageAccessToken'),
        ),
        verifyToken: maskSecret(
          this.configService.get<string>('messenger.verifyToken'),
        ),
        appSecret: maskSecret(
          this.configService.get<string>('messenger.appSecret'),
        ),
      },
      notifications: {
        enabled:
          this.configService.get<boolean>('app.enableNotifications') || false,
        thresholdPower:
          this.configService.get<number>('app.notificationThresholdPower') ||
          100,
      },
    };
  }
}

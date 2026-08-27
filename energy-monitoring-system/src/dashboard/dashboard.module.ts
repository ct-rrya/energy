import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DashboardGateway } from './dashboard.gateway';
import { DashboardService } from './dashboard.service';
import { EnergyModule } from '../energy/energy.module';
import { Sensor, SensorSchema } from '../sensors/schemas/sensor.schema';

/**
 * Dashboard Module
 * 
 * Provides real-time WebSocket updates for admin dashboard.
 * 
 * Features:
 * - Socket.IO WebSocket gateway
 * - Real-time energy reading broadcasts
 * - Sensor status updates
 * - Periodic statistics updates
 * - Power threshold alerts
 * 
 * Dependencies:
 * - EnergyModule (for statistics)
 * - JwtModule (for authentication)
 * - Sensors schema (for sensor counts)
 * 
 * Exports:
 * - DashboardService (for IoT module integration)
 * - DashboardGateway (for direct access if needed)
 * 
 * WebSocket Endpoint:
 * - ws://localhost:3000/dashboard
 * 
 * Authentication:
 * - JWT token required in handshake
 * - Token passed via auth.token or Authorization header
 * 
 * Events:
 * - reading:new - New energy reading
 * - sensor:update - Sensor status update
 * - statistics:update - System statistics (every 10s)
 * - alert:power - Power threshold alert
 * - sensor:online - Sensor came online
 * - sensor:offline - Sensor went offline
 */
@Module({
  imports: [
    // Import EnergyModule to access EnergyService
    EnergyModule,

    // Import Sensor schema for sensor queries
    MongooseModule.forFeature([
      {
        name: Sensor.name,
        schema: SensorSchema,
      },
    ]),

    // Import JwtModule for token verification
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret',
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || '7d',
        } as any,
      }),
    }),
  ],
  providers: [DashboardGateway, DashboardService],
  exports: [DashboardService, DashboardGateway], // Export for IoT module
})
export class DashboardModule {}

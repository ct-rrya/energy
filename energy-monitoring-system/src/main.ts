import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Bootstrap function
 * 
 * Initializes and configures the NestJS application with:
 * - Global validation pipe for DTO validation
 * - CORS for frontend communication
 * - Swagger API documentation
 * - Global API prefix
 * - API versioning (for future use)
 */
async function bootstrap() {
  // Create NestJS application
  const app = await NestFactory.create(AppModule);

  // Get configuration service
  const configService = app.get(ConfigService);

  // Enable CORS for frontend communication
  app.enableCors({
    origin: configService.get<string>('app.corsOrigin'),
    credentials: true,
  });

  // Set global API prefix (e.g., /api/...)
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  app.setGlobalPrefix(apiPrefix);

  // API versioning disabled for now (can enable later if needed)
  // app.enableVersioning({
  //   type: VersioningType.URI,
  //   defaultVersion: '1',
  // });

  // Global validation pipe
  // Automatically validates all incoming requests against DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert primitive types automatically
      },
    }),
  );

  // Configure Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Energy Monitoring System API')
    .setDescription(
      'REST API for Smart Footstep Energy Harvesting Monitoring System using Piezoelectric Sensors',
    )
    .setVersion('1.0')
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management')
    .addTag('Sensors', 'Sensor registration and management')
    .addTag('IoT', 'IoT data ingestion from ESP32 devices')
    .addTag('Energy', 'Energy monitoring and storage')
    .addTag('Analytics', 'Data analytics and reports')
    .addTag('Dashboard', 'Real-time dashboard updates')
    .addTag('Messenger', 'Facebook Messenger bot integration')
    .addTag('Subscribers', 'Messenger subscriber management')
    .addBearerAuth() // Add JWT authentication to Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  // Start server
  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/${apiPrefix}/docs`);
  console.log(`❤️  Health check: http://localhost:${port}/${apiPrefix}/health`);
  console.log(`🔍 Liveness: http://localhost:${port}/${apiPrefix}/health/live`);
  console.log(`✅ Readiness: http://localhost:${port}/${apiPrefix}/health/ready`);
  console.log(`🌍 Environment: ${configService.get<string>('app.nodeEnv')}`);
}

bootstrap();

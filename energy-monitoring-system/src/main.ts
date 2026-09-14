import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Bootstrap function
 *
 * Initializes and configures the NestJS application with:
 * - Security headers via Helmet.js
 * - CORS for frontend communication
 * - Global validation pipe for DTO validation
 * - Swagger API documentation
 * - Global API prefix
 *
 * Requirements: 5.11, 8.1, 8.10, 8.11, 11.10, 15.1, 16.1, 16.2, 16.3
 */
async function bootstrap() {
  // Create NestJS application
  const app = await NestFactory.create(AppModule);

  // Get configuration service
  const configService = app.get(ConfigService);

  // ============================================================================
  // TASK 8.2: Add Helmet.js security headers
  // Requirements: 8.11
  // ============================================================================
  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for API docs
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      // Disable in development for better DX with Swagger
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // ============================================================================
  // TASK 8.1: Configure CORS for public chat and telemetry API
  // Requirements: 5.11, 8.10, 11.10, 15.1
  // ============================================================================
  const frontendUrl =
    configService.get<string>('app.frontendUrl') ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173';
  const productionUrl =
    configService.get<string>('app.productionUrl') ||
    process.env.PRODUCTION_URL ||
    'https://ecostep.example.com';

  // Build allowed origins array from FRONTEND_URL and PRODUCTION_URL env vars
  const allowedOrigins = [frontendUrl];
  if (
    productionUrl &&
    productionUrl.trim() !== '' &&
    productionUrl !== 'https://ecostep.example.com'
  ) {
    allowedOrigins.push(productionUrl);
  }

  app.enableCors({
    origin: allowedOrigins.filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // ✅ All HTTP methods
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'], // ✅ Include Authorization
    credentials: true, // ✅ Enable credentials
    maxAge: 3600,
  });

  // Set global API prefix (e.g., /api/...)
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  app.setGlobalPrefix(apiPrefix);

  // ============================================================================
  // TASK 8.3: Configure global validation pipe
  // Requirements: 8.1
  // ============================================================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: false, // Explicit type conversion only for security
      },
    }),
  );

  // ============================================================================
  // TASK 8.4: Add Swagger API documentation
  // Requirements: 16.1, 16.2, 16.3
  // ============================================================================
  const config = new DocumentBuilder()
    .setTitle('EcoStep Energy Monitoring System API')
    .setDescription(
      'REST API for Smart Footstep Energy Harvesting Monitoring System using Piezoelectric Sensors.\n\n' +
        'This API provides:\n' +
        '- Authentication and user management\n' +
        '- IoT data ingestion from ESP32 sensors\n' +
        '- Real-time energy monitoring and analytics\n' +
        '- Public chat interface for system queries\n' +
        '- Public telemetry data for landing page\n' +
        '- Facebook Messenger bot integration\n' +
        '- Real-time dashboard updates via WebSocket',
    )
    .setVersion('1.0')
    .setContact(
      'EcoStep Team',
      'https://github.com/ecostep',
      'support@ecostep.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')

    // API Tags with descriptions
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management and profile operations')
    .addTag('Sensors', 'Sensor registration and management')
    .addTag('IoT', 'IoT data ingestion from ESP32 devices')
    .addTag('Energy', 'Energy monitoring and storage')
    .addTag('Analytics', 'Data analytics and reports')
    .addTag('Dashboard', 'Real-time dashboard updates via WebSocket')
    .addTag('Messenger', 'Facebook Messenger bot integration')
    .addTag('Subscribers', 'Messenger subscriber management')
    .addTag('Public Chat', 'Public chat interface for web users')
    .addTag('Public API', 'Public endpoints for telemetry and system status')
    .addTag('Reports', 'Report generation (PDF and Excel)')
    .addTag('Notifications', 'System notifications and alerts')

    // Authentication schemes
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token (obtained from /auth/login)',
      },
      'JWT',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API key for IoT devices (ESP32 sensors)',
      },
      'IoT-API-Key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    customSiteTitle: 'EcoStep API Documentation',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0 }
      .swagger-ui .info .title { color: #1A312C }
    `,
    swaggerOptions: {
      persistAuthorization: true, // Persist auth across page refreshes
      docExpansion: 'none', // Collapse all operations by default
      filter: true, // Enable filtering
      tagsSorter: 'alpha', // Sort tags alphabetically
      operationsSorter: 'alpha', // Sort operations alphabetically
    },
  });

  // Start server
  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📚 Swagger documentation: http://localhost:${port}/${apiPrefix}/docs`,
  );
  console.log(`💬 Public Chat API: http://localhost:${port}/${apiPrefix}/chat`);
  console.log(
    `📊 Public Telemetry: http://localhost:${port}/${apiPrefix}/public/telemetry`,
  );
  console.log(`❤️  Health check: http://localhost:${port}/${apiPrefix}/health`);
  console.log(`🔍 Liveness: http://localhost:${port}/${apiPrefix}/health/live`);
  console.log(
    `✅ Readiness: http://localhost:${port}/${apiPrefix}/health/ready`,
  );
  console.log(`🌍 Environment: ${configService.get<string>('app.nodeEnv')}`);
  console.log(`🔒 CORS Origins: ${allowedOrigins.join(', ')}`);
}

bootstrap();

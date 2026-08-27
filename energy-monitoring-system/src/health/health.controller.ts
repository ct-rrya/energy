import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthCheckResponseDto } from './dto';

/**
 * Health Controller
 * 
 * Provides health check endpoints for monitoring and diagnostics.
 * These endpoints are typically used by:
 * - Load balancers (AWS ELB, Nginx)
 * - Container orchestration (Kubernetes, Docker Swarm)
 * - Monitoring tools (Prometheus, Datadog, New Relic)
 * - DevOps dashboards
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Comprehensive health check
   * 
   * Returns detailed health status including:
   * - Database connectivity
   * - Memory usage
   * - System information
   * - Overall health status
   * 
   * @returns {HealthCheckResponseDto} Detailed health status
   */
  @Get()
  @ApiOperation({
    summary: 'Comprehensive health check',
    description:
      'Returns detailed health status of all system components including database, memory, and system info',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed successfully',
    type: HealthCheckResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable - one or more critical components are unhealthy',
  })
  async check(): Promise<HealthCheckResponseDto> {
    return this.healthService.check();
  }

  /**
   * Quick liveness check
   * 
   * Fast endpoint to verify the service is alive.
   * Used by Kubernetes liveness probes.
   * 
   * @returns Simple OK response
   */
  @Get('live')
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Fast check to verify the service process is alive',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is alive',
  })
  getLiveness(): { status: string } {
    return { status: 'ok' };
  }

  /**
   * Readiness check
   * 
   * Verifies the service is ready to accept traffic.
   * Checks critical dependencies like database.
   * Used by Kubernetes readiness probes.
   * 
   * @returns Readiness status
   */
  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Checks if service is ready to accept traffic (dependencies are healthy)',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is ready',
  })
  @ApiResponse({
    status: 503,
    description: 'Service is not ready',
  })
  async getReadiness(): Promise<{ status: string; ready: boolean }> {
    const health = await this.healthService.check();
    const ready = health.status === 'healthy';

    return {
      status: ready ? 'ready' : 'not ready',
      ready,
    };
  }
}

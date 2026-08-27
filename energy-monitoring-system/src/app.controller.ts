import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import {
  ConfigResponseDto,
  TestValidationDto,
  TestValidationResponseDto,
} from './common/dto';

@ApiTags('System')
@Controller() // Root controller - not under /api prefix
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Welcome message' })
  @ApiResponse({ status: 200, description: 'Returns welcome message' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('config')
  @ApiOperation({ summary: 'Configuration status (for debugging)' })
  @ApiResponse({
    status: 200,
    description: 'Returns loaded configuration with sensitive data masked',
    type: ConfigResponseDto,
  })
  getConfig(): ConfigResponseDto {
    return {
      success: true,
      message: 'Configuration loaded successfully',
      config: this.appService.getConfigStatus(),
    };
  }

  @Post('test-validation')
  @ApiOperation({
    summary: 'Test validation endpoint (development only)',
    description:
      'Tests that the global ValidationPipe is working correctly. Remove before production.',
  })
  @ApiResponse({
    status: 201,
    description: 'Validation passed - all fields are valid',
    type: TestValidationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed - one or more fields are invalid',
  })
  testValidation(@Body() dto: TestValidationDto): TestValidationResponseDto {
    return {
      success: true,
      message: 'Validation passed! All fields are valid.',
      data: dto,
    };
  }
}

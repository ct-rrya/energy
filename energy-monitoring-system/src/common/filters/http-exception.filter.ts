import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * HTTP Exception Filter
 *
 * Catches all HTTP exceptions and formats them consistently:
 * {
 *   success: false,
 *   statusCode: 400,
 *   message: "Error message",
 *   errors: [...],
 *   timestamp: "2026-07-17T..."
 * }
 *
 * This provides a consistent error response structure throughout the API
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract error message and validation errors if present
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'An error occurred';

    const errors =
      typeof exceptionResponse === 'object' && (exceptionResponse as any).errors
        ? (exceptionResponse as any).errors
        : undefined;

    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message,
      errors: Array.isArray(message) ? message : errors,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * All Exceptions Filter
 *
 * Catches any unhandled errors (500 Internal Server Error)
 * This is a safety net for unexpected errors
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

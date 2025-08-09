import { ExceptionFilter, Catch, ArgumentsHost, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { Logger } from '@nestjs/common';

@Catch(UnauthorizedException)
export class AuthExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AuthExceptionFilter.name);

  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    this.logger.error(
      `Authentication failed for ${request.method} ${request.url}`,
      exception.stack,
    );

    response.status(status).json({
      statusCode: status,
      message: errorResponse['message'] || 'Authentication failed',
      error: errorResponse['error'] || 'Unauthorized',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
} 
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    async catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error';

        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: typeof message === 'string' ? message : (message as any).message || message,
        };

        if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `${request.method} ${request.url}`,
                exception instanceof Error ? exception.stack : String(exception),
            );
            Sentry.captureException(exception, {
                tags: {
                    source: 'backend-http-filter',
                    method: request.method,
                    path: request.url,
                    statusCode: String(status),
                },
            });
            await Sentry.flush(2000);
        } else {
            this.logger.warn(
                `${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`,
            );
        }

        response.status(status).json(errorResponse);
    }
}

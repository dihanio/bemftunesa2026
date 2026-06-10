import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal Server Error';
    let error = 'Internal Server Error';
    let details: string[] | undefined;

    if (exception instanceof HttpException) {
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
        error = HttpStatus[status] || 'Error';
      } else if (typeof exResponse === 'object') {
        const obj = exResponse as any;
        message = obj.message || exception.message;
        error = obj.error || HttpStatus[status] || 'Error';
        details = Array.isArray(obj.details)
          ? obj.details
          : Array.isArray(obj.errors)
            ? obj.errors.map((e: any) => e.message || JSON.stringify(e))
            : undefined;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

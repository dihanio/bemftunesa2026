import { Injectable, LoggerService, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLogger implements LoggerService {
  private contextName = 'App';

  setContext(context: string) {
    this.contextName = context;
  }

  private formatMessage(level: string, message: unknown, context?: string, ...optionalParams: unknown[]) {
    const activeContext = context || this.contextName;
    const isProd = process.env.NODE_ENV === 'production';
    const timestamp = new Date().toISOString();

    let meta: Record<string, unknown> = {};
    if (optionalParams && optionalParams.length > 0) {
      if (typeof optionalParams[optionalParams.length - 1] === 'object') {
        meta = optionalParams[optionalParams.length - 1] as Record<string, unknown>;
      }
    }

    if (isProd) {
      // JSON structured logging
      return JSON.stringify({
        timestamp,
        level,
        context: activeContext,
        message: typeof message === 'object' ? JSON.stringify(message) : message,
        ...meta,
      });
    } else {
      // Readable logging for local development
      const color = this.getColor(level);
      const reset = '\x1b[0m';
      const metaStr = Object.keys(meta).length ? ` | meta: ${JSON.stringify(meta)}` : '';
      return `${color}[${level.toUpperCase()}]${reset} [${timestamp}] [${activeContext}] ${message}${metaStr}`;
    }
  }

  private getColor(level: string): string {
    switch (level) {
      case 'error': return '\x1b[31m'; // Red
      case 'warn': return '\x1b[33m';  // Yellow
      case 'debug': return '\x1b[34m'; // Blue
      case 'verbose': return '\x1b[35m'; // Magenta
      default: return '\x1b[32m';      // Green
    }
  }

  log(message: unknown, context?: string, ...optionalParams: unknown[]) {
    console.log(this.formatMessage('info', message, context, ...optionalParams));
  }

  error(message: unknown, trace?: string, context?: string, ...optionalParams: unknown[]) {
    console.error(this.formatMessage('error', message, context, { trace, ...optionalParams }));
  }

  warn(message: unknown, context?: string, ...optionalParams: unknown[]) {
    console.warn(this.formatMessage('warn', message, context, ...optionalParams));
  }

  debug(message: unknown, context?: string, ...optionalParams: unknown[]) {
    console.log(this.formatMessage('debug', message, context, ...optionalParams));
  }

  verbose(message: unknown, context?: string, ...optionalParams: unknown[]) {
    console.log(this.formatMessage('verbose', message, context, ...optionalParams));
  }
}

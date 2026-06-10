import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class CleanLogger extends ConsoleLogger {
  private readonly suppressedContexts = [
    'RouterExplorer',
    'RoutesResolver',
    'InstanceLoader',
    'NestFactory',
    'NestApplication',
  ];

  log(message: any, context?: string) {
    if (this.suppressedContexts.includes(context ?? '')) {
      return;
    }
    super.log(message, context);
  }

  debug(message: any, context?: string) {
    if (this.suppressedContexts.includes(context ?? '')) {
      return;
    }
    super.debug(message, context);
  }

  verbose(message: any, context?: string) {
    if (this.suppressedContexts.includes(context ?? '')) {
      return;
    }
    super.verbose(message, context);
  }
}

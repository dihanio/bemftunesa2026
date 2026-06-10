export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: unknown;
}

class ApiLogger {
  private enabled =
    typeof process !== "undefined"
      ? process.env.NODE_ENV !== "production"
      : true;

  debug(message: string, context?: LogContext) {
    this.write("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.write("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.write("warn", message, context);
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.write("error", message, { ...context, error: error?.message });
  }

  private write(level: LogLevel, message: string, context?: LogContext) {
    if (!this.enabled && level !== "error") {
      return;
    }

    const payload = context ? [message, context] : [message];
    console[level === "debug" ? "debug" : level]("[BEMFT API]", ...payload);
  }
}

export const logger = new ApiLogger();

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.isDevelopment && level === 'debug') {
      return; // Don't log debug in production
    }

    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context
    };

    if (this.isDevelopment) {
      // Pretty print in development
      const emoji = {
        debug: '🐛',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌'
      }[level];

      console.log(`${emoji} [${level.toUpperCase()}]`, message, context || '');
    } else {
      // Structured logging in production
      console.log(JSON.stringify(logData));

      // TODO: Send to monitoring service (Sentry, LogRocket, etc.)
      // if (level === 'error') {
      //   sendToMonitoring(logData);
      // }
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: unknown, context?: LogContext) {
    const errorInfo = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error ? {
      message: String(error)
    } : undefined;

    this.log('error', message, {
      ...context,
      error: errorInfo
    });
  }
}

export const logger = new Logger();

import { BetterStackClient } from './betterstack-client';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
  requestId?: string;
  route?: string;
  userId?: string;
  operation?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private betterstack: BetterStackClient | null = null;
  private dailyLogCount = 0;
  private estimatedBytes = 0;
  private lastResetDate = new Date().toDateString();

  constructor() {
    // Initialize BetterStack only in production with valid token
    if (!this.isDevelopment && process.env.BETTERSTACK_SOURCE_TOKEN) {
      try {
        this.betterstack = new BetterStackClient(
          process.env.BETTERSTACK_SOURCE_TOKEN
        );
        console.log('✅ BetterStack HTTP client initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize BetterStack:', error);
      }
    }
  }

  /**
   * Determines if a log should be sent to BetterStack based on smart sampling
   * to stay within the 3 GB/month free tier limit (~2.5 GB target for safety buffer)
   */
  private shouldLogToBetterStack(level: LogLevel, context?: LogContext): boolean {
    // Never in development
    if (this.isDevelopment) return false;

    // Skip if BetterStack not configured
    if (!this.betterstack) return false;

    // Always log errors
    if (level === 'error') return true;

    const route = context?.route || '';
    const operation = context?.operation || '';

    // Skip health checks and analytics entirely
    if (
      route.includes('/health') ||
      route.includes('/api/analytics') ||
      route.includes('/monitoring') ||
      operation.includes('analytics')
    ) {
      return false;
    }

    // Critical routes: 100% sampling
    if (
      route.includes('/payment') ||
      route.includes('/create-claim') ||
      route.includes('/webhook') ||
      operation.includes('payment') ||
      operation.includes('claim') ||
      operation.includes('webhook')
    ) {
      return true;
    }

    // Important routes: 50% sampling
    if (route.includes('/api/') && level === 'warn') {
      return Math.random() < 0.5;
    }

    // Database operations (slow ones): 100%, fast ones: 50%
    if (operation.includes('database')) {
      const duration = context?.duration || 0;
      return duration > 2000 ? true : Math.random() < 0.5;
    }

    // External API calls: 50%
    if (
      operation.includes('stripe') ||
      operation.includes('airtable') ||
      operation.includes('email')
    ) {
      return Math.random() < 0.5;
    }

    // Other API routes info logs: 10% sampling
    if (route.includes('/api/') && level === 'info') {
      return Math.random() < 0.1;
    }

    // Default: 10% sampling for everything else
    return Math.random() < 0.1;
  }

  /**
   * Track log volume to monitor BetterStack free tier usage
   */
  private trackLogVolume(logData: any) {
    // Reset daily counters if it's a new day
    const currentDate = new Date().toDateString();
    if (currentDate !== this.lastResetDate) {
      this.dailyLogCount = 0;
      this.estimatedBytes = 0;
      this.lastResetDate = currentDate;
    }

    // Estimate log size (rough approximation)
    const estimatedSize = JSON.stringify(logData).length;
    this.dailyLogCount++;
    this.estimatedBytes += estimatedSize;

    // Log usage stats every 10,000 logs
    if (this.dailyLogCount % 10000 === 0) {
      const mbUsed = (this.estimatedBytes / 1024 / 1024).toFixed(2);
      console.info(
        `BetterStack usage today: ${this.dailyLogCount} logs, ~${mbUsed} MB`
      );
    }

    // Warn if approaching daily limit (3 GB / 30 days ≈ 100 MB/day)
    const dailyTargetMB = 85; // 2.5 GB / 30 days for safety buffer
    const currentMB = this.estimatedBytes / 1024 / 1024;
    if (currentMB > dailyTargetMB && this.dailyLogCount % 1000 === 0) {
      console.warn(
        `BetterStack usage warning: ${currentMB.toFixed(2)} MB used today (target: ${dailyTargetMB} MB)`
      );
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.isDevelopment && level === 'debug') {
      return; // Don't log debug in production
    }

    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      environment: process.env.NODE_ENV,
      ...context,
    };

    if (this.isDevelopment) {
      // Pretty print in development
      const emoji = {
        debug: '🐛',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];

      console.log(`${emoji} [${level.toUpperCase()}]`, message, context || '');
    } else {
      // Structured logging to console in production
      console.log(JSON.stringify(logData));

      // Send to BetterStack with smart sampling
      if (this.shouldLogToBetterStack(level, context)) {
        this.trackLogVolume(logData);

        // Send to BetterStack asynchronously (don't block)
        try {
          this.betterstack?.log(message, level, logData);
        } catch (error: unknown) {
          // Don't let logging failures break the app
          console.error('Failed to send log to BetterStack:', error);
        }
      }
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
    const errorInfo =
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : error
          ? {
              message: String(error),
            }
          : undefined;

    this.log('error', message, {
      ...context,
      error: errorInfo,
    });
  }

  /**
   * Manually flush logs to BetterStack (useful for serverless functions)
   */
  async flush() {
    if (this.betterstack) {
      await this.betterstack.flush();
    }
  }
}

export const logger = new Logger();

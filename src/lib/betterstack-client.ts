/**
 * BetterStack HTTP Client
 * Direct HTTP ingestion for BetterStack Logs
 */

interface LogEntry {
  dt: string; // datetime in UTC
  message: string;
  level?: string;
  [key: string]: any;
}

export class BetterStackClient {
  private sourceToken: string;
  private endpoint: string;
  private queue: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 1000; // Flush every 1 second
  private readonly MAX_BATCH_SIZE = 50; // Max logs per batch

  constructor(sourceToken: string) {
    this.sourceToken = sourceToken;
    this.endpoint = 'https://in.logs.betterstack.com';
  }

  /**
   * Log a message at any level
   */
  log(message: string, level: string = 'info', context?: Record<string, any>) {
    const entry: LogEntry = {
      dt: new Date().toISOString(),
      message,
      level,
      ...context,
    };

    this.queue.push(entry);

    // Schedule flush if not already scheduled
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.FLUSH_INTERVAL);
    }

    // Flush immediately if queue is full
    if (this.queue.length >= this.MAX_BATCH_SIZE) {
      this.flush();
    }
  }

  /**
   * Log info level
   */
  info(message: string, context?: Record<string, any>) {
    this.log(message, 'info', context);
  }

  /**
   * Log warning level
   */
  warn(message: string, context?: Record<string, any>) {
    this.log(message, 'warn', context);
  }

  /**
   * Log error level
   */
  error(message: string, context?: Record<string, any>) {
    this.log(message, 'error', context);
  }

  /**
   * Flush all queued logs to BetterStack
   */
  async flush(): Promise<void> {
    // Clear timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Nothing to flush
    if (this.queue.length === 0) {
      return;
    }

    // Get logs to send
    const logsToSend = this.queue.splice(0, this.MAX_BATCH_SIZE);

    try {
      // Send each log individually (BetterStack HTTP API doesn't support batching)
      const promises = logsToSend.map((log) =>
        fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.sourceToken}`,
          },
          body: JSON.stringify(log),
        })
      );

      await Promise.all(promises);

      // If there are more logs, schedule another flush
      if (this.queue.length > 0) {
        this.flushTimer = setTimeout(() => this.flush(), this.FLUSH_INTERVAL);
      }
    } catch (error) {
      // Log error but don't throw (don't break app if logging fails)
      console.error('Failed to send logs to BetterStack:', error);

      // Put logs back in queue to retry later
      this.queue.unshift(...logsToSend);
    }
  }

  /**
   * Flush and cleanup on shutdown
   */
  async close(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }
}

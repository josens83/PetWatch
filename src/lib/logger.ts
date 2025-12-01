/**
 * Structured Logging System
 * Production-grade logging with multiple transports
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableRemote: boolean
  remoteEndpoint?: string
  serviceName: string
  environment: string
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
}

class Logger {
  private config: LoggerConfig
  private buffer: LogEntry[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private readonly BUFFER_SIZE = 100
  private readonly FLUSH_INTERVAL = 5000

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: (process.env.LOG_LEVEL as LogLevel) || 'info',
      enableConsole: process.env.NODE_ENV !== 'production',
      enableRemote: process.env.NODE_ENV === 'production',
      serviceName: 'petwatch',
      environment: process.env.NODE_ENV || 'development',
      ...config,
    }

    if (this.config.enableRemote) {
      this.startFlushTimer()
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level]
  }

  private formatEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry
    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
      fatal: '\x1b[35m', // magenta
    }
    const reset = '\x1b[0m'
    const color = levelColors[level]

    let output = `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`

    if (context && Object.keys(context).length > 0) {
      output += ` ${JSON.stringify(context)}`
    }

    if (error) {
      output += `\n  Error: ${error.name}: ${error.message}`
      if (error.stack) {
        output += `\n  Stack: ${error.stack}`
      }
    }

    return output
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        service: this.config.serviceName,
        environment: this.config.environment,
      },
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    if (!this.shouldLog(level)) return

    const entry = this.createEntry(level, message, context, error)

    // Console output
    if (this.config.enableConsole) {
      const formatted = this.formatEntry(entry)
      switch (level) {
        case 'debug':
          console.debug(formatted)
          break
        case 'info':
          console.info(formatted)
          break
        case 'warn':
          console.warn(formatted)
          break
        case 'error':
        case 'fatal':
          console.error(formatted)
          break
      }
    }

    // Buffer for remote logging
    if (this.config.enableRemote) {
      this.buffer.push(entry)
      if (this.buffer.length >= this.BUFFER_SIZE) {
        this.flush()
      }
    }

    // Immediate flush for fatal errors
    if (level === 'fatal' && this.config.enableRemote) {
      this.flush()
    }
  }

  private startFlushTimer() {
    if (this.flushTimer) return

    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.FLUSH_INTERVAL)
  }

  private async flush() {
    if (this.buffer.length === 0) return
    if (!this.config.remoteEndpoint) return

    const entries = [...this.buffer]
    this.buffer = []

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: entries }),
      })
    } catch {
      // Re-add entries to buffer on failure (with limit)
      this.buffer = [...entries.slice(-50), ...this.buffer].slice(-this.BUFFER_SIZE)
    }
  }

  // Public methods
  debug(message: string, context?: LogContext) {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const err = error instanceof Error ? error : undefined
    const ctx = error instanceof Error ? context : (error as LogContext) || context
    this.log('error', message, ctx, err)
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext) {
    const err = error instanceof Error ? error : undefined
    const ctx = error instanceof Error ? context : (error as LogContext) || context
    this.log('fatal', message, ctx, err)
  }

  // Create child logger with additional context
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context)
  }

  // Force flush (for graceful shutdown)
  async shutdown() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    await this.flush()
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private context: LogContext
  ) {}

  debug(message: string, context?: LogContext) {
    this.parent.debug(message, { ...this.context, ...context })
  }

  info(message: string, context?: LogContext) {
    this.parent.info(message, { ...this.context, ...context })
  }

  warn(message: string, context?: LogContext) {
    this.parent.warn(message, { ...this.context, ...context })
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    this.parent.error(message, error, { ...this.context, ...context })
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext) {
    this.parent.fatal(message, error, { ...this.context, ...context })
  }

  child(context: LogContext): ChildLogger {
    return new ChildLogger(this.parent, { ...this.context, ...context })
  }
}

// Singleton logger instance
export const logger = new Logger()

// Create request-scoped logger
export function createRequestLogger(requestId: string, userId?: string): ChildLogger {
  return logger.child({
    requestId,
    userId,
  })
}

// Performance logging helper
export function logPerformance(name: string, fn: () => void): void
export function logPerformance<T>(name: string, fn: () => Promise<T>): Promise<T>
export function logPerformance<T>(name: string, fn: () => T | Promise<T>): T | Promise<T> {
  const start = performance.now()

  const logDuration = () => {
    const duration = performance.now() - start
    logger.info(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms` })
  }

  try {
    const result = fn()

    if (result instanceof Promise) {
      return result.finally(logDuration)
    }

    logDuration()
    return result
  } catch (error) {
    logDuration()
    throw error
  }
}

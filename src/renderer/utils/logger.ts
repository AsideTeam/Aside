import { LogLevel, shouldLog, type ILogger, type LogMeta } from '@shared/logger'

/**
 * Renderer Logger
 * - shared/logger의 LogLevel/ILogger를 그대로 사용해 Main/Renderer 로그 체계를 통일
 */

class RendererLogger implements ILogger {
  private readonly context: string
  private minLevel: LogLevel
  private readonly isDev: boolean

  constructor(context: string, minLevel: LogLevel = LogLevel.INFO) {
    this.context = context
    this.minLevel = minLevel
    this.isDev = import.meta.env.DEV
  }

  private write(level: LogLevel, message: string, meta?: LogMeta): void {
    if (!this.isDev) return
    if (!shouldLog(level, this.minLevel)) return

    const prefix = `[${this.context}] ${message}`
    const color = this.getColor(level)

    if (meta) {
      console.log(`%c${prefix}`, `color: ${color}; font-weight: 600;`, meta)
    } else {
      console.log(`%c${prefix}`, `color: ${color}; font-weight: 600;`)
    }
  }

  private getColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '#9ca3af'
      case LogLevel.INFO:
        return '#60a5fa'
      case LogLevel.WARN:
        return '#fbbf24'
      case LogLevel.ERROR:
        return '#f87171'
      default:
        return '#ffffff'
    }
  }

  debug(message: string, meta?: LogMeta): void {
    this.write(LogLevel.DEBUG, message, meta)
  }

  info(message: string, meta?: LogMeta): void {
    this.write(LogLevel.INFO, message, meta)
  }

  warn(message: string, meta?: LogMeta): void {
    this.write(LogLevel.WARN, message, meta)
  }

  error(message: string, error?: unknown, meta?: LogMeta): void {
    const errMeta: LogMeta = meta ? { ...meta } : {}
    if (error) errMeta.error = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error
    this.write(LogLevel.ERROR, message, errMeta)
  }

  getContext(): string {
    return this.context
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level
  }
}

export const logger: ILogger = new RendererLogger('renderer', LogLevel.DEBUG)

export function logIpcCall(method: string, meta?: LogMeta): void {
  logger.info(`[IPC→] ${method}`, meta)
}

export function logIpcResponse(method: string, meta?: LogMeta): void {
  logger.debug(`[IPC←] ${method}`, meta)
}

export function logIpcError(method: string, error: Error, meta?: LogMeta): void {
  logger.error(`[IPC×] ${method}`, error, meta)
}

export function logStateSync(changes: Record<string, unknown>): void {
  logger.debug('[STORE] sync', { keys: Object.keys(changes) })
}

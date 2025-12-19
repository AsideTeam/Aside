/**
 * Logger Interface & Levels (Shared between Main & Renderer)
 *
 * Main Process: electron-log + file output
 * Renderer Process: console.log + DevTools
 *
 * This is the "contract" - implementation details go in each process.
 */

/**
 * Log Level Enum (양쪽 프로세스 통일)
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Logger Interface (Main/Renderer에서 구현)
 */
export interface ILogger {
  debug(message: string, ...args: any[]): void
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, error?: Error | unknown): void
}

/**
 * Logger Factory Type (각 프로세스에서 구현)
 */
export type LoggerFactory = (context: string) => ILogger

/**
 * Renderer Process Logger Implementation
 *
 * 브라우저 환경에서 동작하는 Logger 구현체
 * - 출력: 브라우저 DevTools 콘솔
 * - 색상: 로그 레벨별 색상 구분
 *
 * Usage:
 *   import { logger } from '@renderer/lib/logger'
 *   logger.info('Component mounted', { componentName: 'App' })
 */

import type { ILogger, LogMeta } from '@shared/logger'
import { LogLevel } from '@shared/logger'

class RendererLogger implements ILogger {
  private isDev: boolean

  constructor() {
    // Electron 개발 모드 확인
    this.isDev = process.env.NODE_ENV === 'development'
  }

  /**
   * Transport: 실제 로그를 브라우저 콘솔에 출력
   */
  private write(level: LogLevel, message: string, meta?: unknown): void {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${this.getLevelString(level)}]`

    // 브라우저 콘솔에 출력 (색상 포함)
    const style = this.getConsoleStyle(level)
    const metaStr = meta ? JSON.stringify(meta, null, 2) : ''

    if (metaStr) {
      console.log(`%c${prefix} ${message}`, style)
      console.log(meta)
    } else {
      console.log(`%c${prefix} ${message}`, style)
    }
  }

  private getLevelString(level: LogLevel): string {
    const levelMap: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.INFO]: 'INFO ',
      [LogLevel.WARN]: 'WARN ',
      [LogLevel.ERROR]: 'ERROR',
    }
    return levelMap[level]
  }

  private getConsoleStyle(level: LogLevel): string {
    const styleMap: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: 'color: #888; font-weight: bold;', // gray
      [LogLevel.INFO]: 'color: #00bcd4; font-weight: bold;', // cyan
      [LogLevel.WARN]: 'color: #ff9800; font-weight: bold;', // orange
      [LogLevel.ERROR]: 'color: #f44336; font-weight: bold;', // red
    }
    return styleMap[level]
  }

  debug(message: string, meta?: LogMeta): void {
    if (this.isDev) {
      this.write(LogLevel.DEBUG, message, meta)
    }
  }

  info(message: string, meta?: LogMeta): void {
    this.write(LogLevel.INFO, message, meta)
  }

  warn(message: string, meta?: LogMeta): void {
    this.write(LogLevel.WARN, message, meta)
  }

  error(message: string, error?: unknown, meta?: LogMeta): void {
    const errorObj =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error
    this.write(LogLevel.ERROR, message, { ...meta, error: errorObj })
  }

  getContext(): string {
    return 'renderer'
  }
}

// 싱글톤 인스턴스
export const logger = new RendererLogger()

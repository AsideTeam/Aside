/* eslint-disable no-console */
/**
 * Main Process Logger Implementation
 *
 * Node.js 환경에서 동작하는 Logger 구현체
 * - 파일 저장: userData/logs/app.log
 * - 콘솔 출력: 개발 모드에서만
 *
 * Usage:
 *   import { logger } from '@main/utils/logger'
 *   logger.info('App started', { version: '1.0' })
 */

import { appendFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import type { ILogger, LogMeta } from '@shared/logger'
import { LogLevel } from '@shared/logger'

class MainLogger implements ILogger {
  private logFilePath: string
  private isDev: boolean

  constructor() {
    this.isDev = !app.isPackaged

    // userData/logs/app.log
    const logDir = join(app.getPath('userData'), 'logs')
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true })
    }
    this.logFilePath = join(logDir, 'app.log')
  }

  /**
   * Transport: 실제 로그를 파일과 콘솔에 출력
   */
  private write(level: LogLevel, message: string, meta?: unknown): void {
    const timestamp = new Date().toISOString()
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
    const logLine = `[${timestamp}] [${this.getLevelString(level)}] ${message}${metaStr}`

    // 1. 개발 모드: 터미널 출력 (색상 추가)
    if (this.isDev) {
      const color = this.getColor(level)
      console.log(`${color}${logLine}\x1b[0m`)
    }

    // 2. 프로덕션: 파일 저장
    try {
      appendFileSync(this.logFilePath, logLine + '\n', 'utf-8')
    } catch (e) {
      // 파일 쓰기 실패 시 최후의 수단으로만 콘솔 에러
      console.error('Log file write failed:', e)
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

  private getColor(level: LogLevel): string {
    const colorMap: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '\x1b[90m', // gray
      [LogLevel.INFO]: '\x1b[36m', // cyan
      [LogLevel.WARN]: '\x1b[33m', // yellow
      [LogLevel.ERROR]: '\x1b[31m', // red
    }
    return colorMap[level]
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
    const errorObj =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error
    this.write(LogLevel.ERROR, message, { ...meta, error: errorObj })
  }

  getContext(): string {
    return 'main'
  }

  setLevel?(level: LogLevel): void {
    // Main에서는 레벨 변경 미지원 (필요시 구현)
    void level // unused
  }
}

/**
 * Main Process Logger 싱글톤 인스턴스
 */
export const logger = new MainLogger()

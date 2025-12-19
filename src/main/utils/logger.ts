import fs from 'fs'
import path from 'path'
import { Config } from './env'

/**
 * Logger 유틸리티
 * 
 * 파일 + 콘솔에 로그 저장
 */

interface LogEntry {
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  context: string
  message: string
  details?: unknown
}

class Logger {
  private context: string
  private logsDir: string

  constructor(context: string) {
    this.context = context
    this.logsDir = Config.getInstance().logsDir
  }

  private format(level: string, message: string): string {
    const now = new Date().toISOString()
    return `[${now}] [${level}] [${this.context}] ${message}`
  }

  private write(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, details?: unknown): void {
    const formatted = this.format(level, message)

    // 콘솔
    const consoleMethod = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log
    consoleMethod(formatted)
    if (details) {
      consoleMethod(details)
    }

    // 파일 (에러만)
    if (level === 'ERROR') {
      const logFile = path.join(this.logsDir, 'error.log')
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        context: this.context,
        message,
        details,
      }
      try {
        const line = JSON.stringify(entry) + '\n'
        fs.appendFileSync(logFile, line, 'utf-8')
      } catch (err) {
        console.error('Failed to write log file:', err)
      }
    }
  }

  info(message: string, details?: unknown): void {
    this.write('INFO', message, details)
  }

  warn(message: string, details?: unknown): void {
    this.write('WARN', message, details)
  }

  error(message: string, details?: unknown): void {
    this.write('ERROR', message, details)
  }

  debug(message: string, details?: unknown): void {
    if (Config.getInstance().isDev) {
      this.write('DEBUG', message, details)
    }
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context)
}

/**
 * Renderer 프로세스 Logger
 * 
 * 역할:
 * - 모든 IPC 호출 로깅
 * - 에러 추적
 * - 성능 메트릭
 * - 개발 중 디버깅
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  message: string
  data?: any
}

class RendererLogger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private isDev = process.env.NODE_ENV === 'development'

  log(level: LogLevel, component: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
    }

    // 메모리에 저장
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // 콘솔에 출력 (개발 중)
    if (this.isDev) {
      const color = this.getColor(level)
      const prefix = `[${component}] ${message}`

      if (data) {
        console.log(`%c${prefix}`, `color: ${color}; font-weight: bold;`, data)
      } else {
        console.log(`%c${prefix}`, `color: ${color}; font-weight: bold;`)
      }
    }
  }

  private getColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '#888888'
      case LogLevel.INFO:
        return '#0066cc'
      case LogLevel.WARN:
        return '#ff9900'
      case LogLevel.ERROR:
        return '#cc0000'
      default:
        return '#000000'
    }
  }

  debug(component: string, message: string, data?: any) {
    this.log(LogLevel.DEBUG, component, message, data)
  }

  info(component: string, message: string, data?: any) {
    this.log(LogLevel.INFO, component, message, data)
  }

  warn(component: string, message: string, data?: any) {
    this.log(LogLevel.WARN, component, message, data)
  }

  error(component: string, message: string, data?: any) {
    this.log(LogLevel.ERROR, component, message, data)
  }

  /**
   * IPC 호출 추적
   */
  ipcCall(method: string, args?: any) {
    this.info('[IPC-OUT]', `${method}`, args)
  }

  /**
   * IPC 응답 추적
   */
  ipcResponse(method: string, result: any) {
    this.debug('[IPC-IN]', `${method} → OK`, result)
  }

  /**
   * IPC 에러 추적
   */
  ipcError(method: string, error: Error) {
    this.error('[IPC-ERR]', `${method} failed`, error.message)
  }

  /**
   * 상태 동기화 추적
   */
  stateSync(changes: Record<string, any>) {
    this.debug('[STORE]', 'State updated', Object.keys(changes))
  }

  /**
   * 모든 로그 반환
   */
  getAllLogs(): LogEntry[] {
    return [...this.logs]
  }

  /**
   * 로그 검색
   */
  search(query: string): LogEntry[] {
    return this.logs.filter(
      (entry) =>
        entry.component.includes(query) ||
        entry.message.includes(query) ||
        JSON.stringify(entry.data).includes(query)
    )
  }

  /**
   * 로그 내보내기 (파일)
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * 로그 초기화
   */
  clear() {
    this.logs = []
  }
}

/**
 * 싱글톤 인스턴스
 */
export const rendererLogger = new RendererLogger()

/**
 * 편의 함수들
 */
export function logDebug(component: string, message: string, data?: any) {
  rendererLogger.debug(component, message, data)
}

export function logInfo(component: string, message: string, data?: any) {
  rendererLogger.info(component, message, data)
}

export function logWarn(component: string, message: string, data?: any) {
  rendererLogger.warn(component, message, data)
}

export function logError(component: string, message: string, data?: any) {
  rendererLogger.error(component, message, data)
}

export function logIpcCall(method: string, args?: any) {
  rendererLogger.ipcCall(method, args)
}

export function logIpcResponse(method: string, result: any) {
  rendererLogger.ipcResponse(method, result)
}

export function logIpcError(method: string, error: Error) {
  rendererLogger.ipcError(method, error)
}

export function logStateSync(changes: Record<string, any>) {
  rendererLogger.stateSync(changes)
}

/**
 * Logger Levels - 로그 심각도 정의
 *
 * 책임: 로그 레벨 Enum 정의 (양쪽 프로세스 통일)
 * - Main Process에서도, Renderer Process에서도 같은 레벨을 사용
 * - 각 레벨이 타입 안전성을 보장
 *
 * 사용 예:
 *   import { LogLevel } from '@shared/logger';
 *   const level: LogLevel = LogLevel.INFO;
 */

/**
 * 로그 레벨 Enum
 *
 * DEBUG: 개발 중 디버깅 정보 (프로덕션에서는 무시됨)
 * INFO:  일반 정보 메시지 (정상 작동)
 * WARN:  경고 메시지 (비정상이지만 계속 진행)
 * ERROR: 오류 메시지 (심각한 문제)
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * 로그 레벨 배열 (순서 중요: 심각도 기준)
 */
export const LOG_LEVELS = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR] as const

/**
 * 로그 레벨 우선순위 (숫자가 높을수록 심각도 높음)
 */
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
}

/**
 * 로그 레벨이 주어진 최소 레벨보다 높은지 확인
 *
 * 예: shouldLog(LogLevel.INFO, LogLevel.WARN) → false (INFO < WARN)
 * 예: shouldLog(LogLevel.ERROR, LogLevel.WARN) → true (ERROR > WARN)
 */
export const shouldLog = (logLevel: LogLevel, minLevel: LogLevel): boolean => {
  return LOG_LEVEL_PRIORITY[logLevel] >= LOG_LEVEL_PRIORITY[minLevel]
}

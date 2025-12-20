/**
 * Logger Types - 로거 인터페이스 정의
 *
 * 책임: ILogger 인터페이스 정의 (구현체는 Main/Renderer에서 함)
 * - Main Process: 파일 + 콘솔 출력
 * - Renderer Process: 브라우저 DevTools 콘솔
 *
 * 사용 예:
 *   import { ILogger } from '@shared/logger';
 *   const logger: ILogger = createLogger('MyModule');
 */

import type { LogLevel } from './levels'

/**
 * 로깅 메타데이터 (선택적)
 *
 * 로그와 함께 추가 정보를 전달할 때 사용
 * 동적 메타데이터를 허용하기 위해 any 사용
 */
export interface LogMeta extends Record<string, unknown> {}

/**
 * 로그 엔트리 (파일/DB에 저장될 형식)
 *
 * 구조화된 로그를 저장하고 나중에 검색할 수 있도록 설계
 */
export interface LogEntry {
  timestamp: Date
  level: LogLevel
  context: string // 로거를 생성한 모듈명 (예: 'main', 'ipc-handlers')
  message: string
  meta?: LogMeta
  error?: unknown
}

/**
 * Logger Interface - 모든 로거 구현이 따라야 할 계약
 *
 * Main/Renderer 모두 이 인터페이스를 구현해야 함
 *
 * 메서드 설명:
 * - debug: 개발용 디버깅 정보 (프로덕션에서는 무시될 수 있음)
 * - info:  일반 정보 메시지 (앱이 정상 작동 중임을 알림)
 * - warn:  경고 메시지 (비정상이지만 앱은 계속 실행)
 * - error: 오류 메시지 (심각한 문제, 앱이 중단될 수도 있음)
 *
 * 모든 메서드는 동기 실행 (차단하지 않음)
 */
export interface ILogger {
  debug(message: string, meta?: LogMeta): void
  info(message: string, meta?: LogMeta): void
  warn(message: string, meta?: LogMeta): void
  error(message: string, error?: Error | unknown, meta?: LogMeta): void

  /**
   * 현재 로거 컨텍스트 반환
   * @returns 이 로거를 생성할 때 지정한 context 문자열
   */
  getContext(): string

  /**
   * 로거 설정 변경 (선택적)
   * 예: 개발 중에만 DEBUG 레벨 활성화
   */
  setLevel?(level: LogLevel): void
}

/**
 * Logger Factory Type
 *
 * Main/Renderer에서 로거 인스턴스를 만들 때 사용하는 팩토리 함수
 *
 * 사용 예:
 *   import type { LoggerFactory } from '@shared/logger';
 *   const createLogger: LoggerFactory = (context) => new Logger(context);
 */
export type LoggerFactory = (context: string) => ILogger

/**
 * Logger Configuration (선택적 - 나중에 필요하면 추가)
 *
 * 로거의 동작을 제어하는 설정 객체
 */
export interface LoggerConfig {
  minLevel?: LogLevel // 이 레벨 이상만 기록
  enableConsole?: boolean // 콘솔 출력 활성화
  enableFile?: boolean // 파일 출력 활성화 (Main만)
  enableRemote?: boolean // 원격 로그 서버로 전송 (나중에 추가 가능)
}

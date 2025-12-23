/**
 * Path Configuration
 *
 * 책임: 애플리케이션의 모든 파일 경로 중앙 관리
 * - DB 파일 위치
 * - 로그 파일 위치
 * - 리소스 디렉토리
 * - 설정 파일 위치
 *
 * 사용 예:
 *   import { Paths } from '@main/config/paths'
 *   const dbPath = Paths.database()
 *   const logPath = Paths.logs()
 *
 * 이점:
 * - 하드코딩 방지
 * - 테스트 시 경로 쉽게 변경 가능 (Mock)
 * - 크로스 플랫폼 호환성 (경로 구분자 자동 처리)
 */

import { join } from 'node:path'
import { Env } from './Env'
import { logger } from '@main/utils/Logger'

/**
 * 경로 설정 싱글톤
 *
 * Env.dataDir을 기반으로 모든 경로 계산
 * 폴더 생성은 안 함 (각 모듈이 필요할 때 생성)
 */
export class Paths {
  /**
   * 데이터 루트 디렉토리
   * @returns ~/.local/share/Aside (Linux), ~/Library/Application Support/Aside (macOS), AppData/Local/Aside (Windows)
   */
  static root(): string {
    return Env.dataDir
  }

  /**
   * SQLite 데이터베이스 파일 경로
   * @returns {dataDir}/database/app.db
   */
  static database(): string {
    return join(this.root(), 'database', 'app.db')
  }

  /**
   * 로그 파일 디렉토리
   * @returns {dataDir}/logs
   */
  static logsDir(): string {
    return join(this.root(), 'logs')
  }

  /**
   * 메인 로그 파일 경로
   * @returns {dataDir}/logs/main.log
   */
  static mainLog(): string {
    return join(this.logsDir(), 'main.log')
  }

  /**
   * 에러 로그 파일 경로 (심각한 에러만)
   * @returns {dataDir}/logs/error.log
   */
  static errorLog(): string {
    return join(this.logsDir(), 'error.log')
  }

  /**
   * 캐시 디렉토리
   * @returns {dataDir}/cache
   */
  static cacheDir(): string {
    return join(this.root(), 'cache')
  }

  /**
   * 세션 데이터 디렉토리 (탭 세션, 히스토리 등 복구용)
   * @returns {dataDir}/session
   */
  static sessionDir(): string {
    return join(this.root(), 'session')
  }

  /**
   * 모든 경로를 로그 (디버깅용)
   */
  static printAll(): void {
    logger.info('Directory structure', {
      root: this.root(),
      database: this.database(),
      logsDir: this.logsDir(),
      mainLog: this.mainLog(),
      errorLog: this.errorLog(),
      cache: this.cacheDir(),
      session: this.sessionDir(),
    })
  }

  /**
   * 싱글톤 검증 (인스턴스화 방지)
   */
  private constructor() {
    throw new Error('Paths is a singleton. Do not instantiate.')
  }
}

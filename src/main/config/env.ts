/**
 * Environment Configuration
 *
 * 책임: 애플리케이션 환경변수 중앙 관리
 * - 개발/배포 모드 판단
 * - 환경별 상수 제공
 * - 외부 의존성 없이 싱글톤으로 제공
 *
 * 사용 예:
 *   import { Env } from '@main/config/env'
 *   import { logger } from '@main/utils/logger'
 *   if (Env.isDev) logger.info('Development mode')
 */

import { app } from 'electron'
import { logger } from '@main/utils/Logger'

/**
 * 환경 설정 싱글톤
 *
 * 특징:
 * - Electron app.isPackaged를 기반으로 판단
 * - 프로덕션에서는 console.log 차단 (보안)
 * - 런타임에 변경 불가 (readonly)
 */
export class Env {
  /** 개발 모드 여부 */
  static readonly isDev = !app.isPackaged

  /** 프로덕션 모드 여부 */
  static readonly isProd = app.isPackaged

  /** 로그 레벨: dev='debug', prod='error' */
  static readonly logLevel = this.isDev ? ('debug' as const) : ('error' as const)

  /** 로그 파일 출력 활성화 (항상 활성화) */
  static readonly enableLogFile = true

  /** 콘솔 출력 활성화: dev=true, prod=false */
  static readonly enableConsole = this.isDev

  /** 데이터 디렉토리 (사용자 데이터 저장 위치) */
  static readonly dataDir = app.getPath('userData')

  /** 앱 이름 (window 제목, 메뉴 등에서 사용) */
  static readonly appName = app.name

  /** 앱 버전 (package.json의 version) */
  static readonly appVersion = app.getVersion()

  /**
   * 싱글톤 검증 (인스턴스화 방지)
   */
  private constructor() {
    throw new Error('Env is a singleton. Do not instantiate.')
  }
}

/**
 * 환경 검증 (앱 시작 시 한 번만 호출)
 *
 * 예상치 못한 Electron 버전이나 설정 문제를 조기에 감지
 */
export function validateEnv(): void {
  if (!app.isReady()) {
    throw new Error('[Env] app must be ready before validation')
  }

  if (!Env.dataDir) {
    throw new Error('[Env] userData path is empty')
  }

  logger.info('[Env] Environment initialized', {
    mode: Env.isDev ? 'DEVELOPMENT' : 'PRODUCTION',
    app: `${Env.appName} v${Env.appVersion}`,
    dataDir: Env.dataDir,
    logLevel: Env.logLevel,
  })
}

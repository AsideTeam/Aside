/**
 * Session Management
 *
 * 책임: Electron Session 및 보안 설정 관리
 * - CSP (Content Security Policy)
 * - 권한(Permission) 관리
 * - 쿠키/캐시 정책
 * - 프로토콜 핸들러
 *
 * 사용 예:
 *   import { SessionManager } from '@main/core/Session'
 *   SessionManager.setup()
 */

import { session } from 'electron'
import { logger } from '@main/utils/Logger'

/**
 * Session 싱글톤 관리
 */
export class SessionManager {
  /**
   * Session 초기 설정
   *
   * 프로세스:
   * 1. CSP 정책 설정
   * 2. 권한 핸들러 등록
   * 3. 특정 프로토콜 차단
   */
  static setup(): void {
    logger.info('[SessionManager] Setting up session...')

    try {
      // Step 1: 기본 Session 객체
      const defaultSession = session.defaultSession

      if (!defaultSession) {
        throw new Error('[SessionManager] Default session not available')
      }

      // Step 2: CSP 정책 설정 (STRICT)
      // 원칙: 최소 권한, 명시적 화이트리스트
      defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
              "default-src 'none'; " +
                "script-src 'self'; " +  // ✅ 인라인 스크립트 금지, eval 금지
                "style-src 'self' https://fonts.googleapis.com; " +
                "font-src 'self' https://fonts.gstatic.com; " +
                "img-src 'self' https: data:; " +
                "connect-src 'self'; " +  // ✅ 모든 외부 API 요청 차단 (필요시 추가)
                "frame-ancestors 'none'; " +
                "base-uri 'self'; " +
                "form-action 'self'",
            ],
          },
        })
      })

      // Step 3: 권한 핸들러 (카메라, 마이크 등)
      defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
        logger.info('[SessionManager] Permission request', { permission })

        // 기본적으로 거부
        const allowedPermissions: string[] = [
          // 'camera',
          // 'microphone',
        ]

        if (allowedPermissions.includes(permission)) {
          callback(true)
        } else {
          callback(false)
        }
      })

      logger.info('[SessionManager] Session setup completed')
    } catch (error) {
      logger.error('[SessionManager] Setup failed:', error)
      throw error
    }
  }
}

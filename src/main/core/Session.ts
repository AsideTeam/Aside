/**
 * Session Management
 *
 * 책임: Electron Session 및 보안 설정 관리
 * - User-Agent 설정 (Chrome 호환)
 * - 권한(Permission) 관리
 *
 * 사용 예:
 *   import { SessionManager } from '@main/core/Session'
 *   SessionManager.setup()
 */

import { session } from 'electron'
import { logger } from '@main/utils/logger'
import { Env } from '@main/config'

// Chrome User-Agent (Google 차단 방지)
const CHROME_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/**
 * Session 싱글톤 관리
 */
export class SessionManager {
  /**
   * Session 초기 설정
   */
  static setup(): void {
    logger.info('[SessionManager] Setting up session...')

    try {
      const defaultSession = session.defaultSession

      if (!defaultSession) {
        throw new Error('[SessionManager] Default session not available')
      }

      // Step 1: User-Agent 설정 (Chrome처럼 보이게)
      defaultSession.setUserAgent(CHROME_USER_AGENT)
      logger.info('[SessionManager] User-Agent set to Chrome')

      // Step 1.5: Dev에서 Vite 리소스 캐시 방지 (CSS/JS stale 방지)
      if (Env.isDev) {
        defaultSession.webRequest.onHeadersReceived((details, callback) => {
          const isViteDev = details.url.startsWith('http://localhost:5173/')

          if (!isViteDev) {
            callback({})
            return
          }

          const responseHeaders = details.responseHeaders ?? {}

          // 304/ETag 캐시로 인해 스타일 변경이 반영 안 되는 착시를 막기 위해
          // dev 서버 리소스에 한해 캐시를 끈다.
          responseHeaders['Cache-Control'] = ['no-store']
          delete responseHeaders['ETag']
          delete responseHeaders['etag']

          callback({ responseHeaders })
        })

        logger.info('[SessionManager] Dev cache disabled for Vite (localhost:5173)')
      }

      // Step 2: 권한 핸들러 (카메라, 마이크 등)
      defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
        logger.info('[SessionManager] Permission request', { permission })

        // 허용할 권한 목록
        const allowedPermissions: string[] = [
          'clipboard-read',
          'clipboard-sanitized-write',
          'geolocation',
          'notifications',
        ]

        callback(allowedPermissions.includes(permission))
      })

      logger.info('[SessionManager] Session setup completed')
    } catch (error) {
      logger.error('[SessionManager] Setup failed:', error)
      throw error
    }
  }
}

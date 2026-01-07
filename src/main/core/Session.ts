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

import { session, webContents } from 'electron'
import { logger } from '@main/utils/logger'
import { Env } from '@main/config'
import { SettingsStore } from '@main/services/SettingsStore'
import { AdBlockService } from '@main/services/AdBlock'

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

      // Step 1.2: Runtime network behaviors based on persisted settings
      const settingsStore = SettingsStore.getInstance()
      AdBlockService.initialize()

      let doNotTrack = settingsStore.get('doNotTrack')
      let blockAds = settingsStore.get('blockAds')
      let blockThirdPartyCookies = settingsStore.get('blockThirdPartyCookies')
      let language = settingsStore.get('language')

      const languageHeader = () => {
        switch (language) {
          case 'ko':
            return 'ko-KR,ko;q=0.9,en;q=0.8'
          case 'ja':
            return 'ja-JP,ja;q=0.9,en;q=0.8'
          case 'en':
          default:
            return 'en-US,en;q=0.9'
        }
      }

      const spellCheckerLanguages = (): string[] => {
        switch (language) {
          case 'ko':
            return ['ko-KR', 'en-US']
          case 'ja':
            return ['ja-JP', 'en-US']
          case 'en':
          default:
            return ['en-US']
        }
      }

      const getTopLevelHost = (webContentsId: number | undefined): string | null => {
        if (typeof webContentsId !== 'number') return null
        try {
          const wc = webContents.fromId(webContentsId)
          if (!wc) return null
          const url = wc.getURL()
          if (!url) return null
          return new URL(url).hostname
        } catch {
          return null
        }
      }

      const isThirdParty = (requestUrl: string, topLevelHost: string | null): boolean => {
        if (!topLevelHost) return false
        try {
          const host = new URL(requestUrl).hostname
          return host !== topLevelHost
        } catch {
          return false
        }
      }

      // Cancel known ad URLs when enabled
      defaultSession.webRequest.onBeforeRequest((details, callback) => {
        if (blockAds && AdBlockService.isAdURL(details.url)) {
          callback({ cancel: true })
          return
        }
        callback({})
      })

      // Apply headers like DNT / Accept-Language and optionally strip cookies
      defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        const requestHeaders = { ...(details.requestHeaders ?? {}) }

        if (doNotTrack) {
          requestHeaders['DNT'] = '1'
        } else {
          delete requestHeaders['DNT']
        }

        requestHeaders['Accept-Language'] = languageHeader()

        if (blockThirdPartyCookies) {
          const topHost = getTopLevelHost(details.webContentsId)
          if (isThirdParty(details.url, topHost)) {
            delete requestHeaders['Cookie']
            delete requestHeaders['cookie']
          }
        }

        callback({ requestHeaders })
      })

      // Apply spellchecker languages based on persisted settings
      try {
        defaultSession.setSpellCheckerLanguages(spellCheckerLanguages())
        logger.info('[SessionManager] Spellchecker languages set', { languages: spellCheckerLanguages() })
      } catch (error) {
        logger.warn('[SessionManager] Failed to set spellchecker languages', { error: String(error) })
      }

      // Keep cached values in sync with persisted settings
      settingsStore.onChange('doNotTrack', (v) => {
        doNotTrack = typeof v === 'boolean' ? v : settingsStore.get('doNotTrack')
        logger.info('[SessionManager] doNotTrack changed', { doNotTrack })
      })
      settingsStore.onChange('blockAds', (v) => {
        blockAds = typeof v === 'boolean' ? v : settingsStore.get('blockAds')
        logger.info('[SessionManager] blockAds changed', { blockAds })
      })
      settingsStore.onChange('blockThirdPartyCookies', (v) => {
        blockThirdPartyCookies = typeof v === 'boolean' ? v : settingsStore.get('blockThirdPartyCookies')
        logger.info('[SessionManager] blockThirdPartyCookies changed', { blockThirdPartyCookies })
      })
      settingsStore.onChange('language', (v) => {
        language = (typeof v === 'string' ? v : settingsStore.get('language'))
        logger.info('[SessionManager] language changed', { language })

        try {
          defaultSession.setSpellCheckerLanguages(spellCheckerLanguages())
          logger.info('[SessionManager] Spellchecker languages updated', { languages: spellCheckerLanguages() })
        } catch (error) {
          logger.warn('[SessionManager] Failed to update spellchecker languages', { error: String(error) })
        }
      })

      // Step 1.5: Headers received handling (cookie stripping + dev cache control)
      defaultSession.webRequest.onHeadersReceived((details, callback) => {
        const responseHeaders = { ...(details.responseHeaders ?? {}) }

        if (blockThirdPartyCookies) {
          const topHost = getTopLevelHost(details.webContentsId)
          if (isThirdParty(details.url, topHost)) {
            delete responseHeaders['Set-Cookie']
            delete responseHeaders['set-cookie']
          }
        }

        if (Env.isDev && details.url.startsWith('http://localhost:5173/')) {
          // 304/ETag 캐시로 인해 스타일 변경이 반영 안 되는 착시를 막기 위해
          // dev 서버 리소스에 한해 캐시를 끈다.
          responseHeaders['Cache-Control'] = ['no-store']
          delete responseHeaders['ETag']
          delete responseHeaders['etag']
        }

        callback({ responseHeaders })
      })

      if (Env.isDev) {
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

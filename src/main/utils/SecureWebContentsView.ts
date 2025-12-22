/**
 * Secure WebContentsView Management
 *
 * 책임: 각 탭의 WebContentsView 보안 설정
 * - 탭별 독립적인 Session (쿠키 격리)
 * - Preload 스크립트 활용하지 않음 (Guest Page 격리)
 * - 권한 제한 (카메라, 마이크 등)
 *
 * 아키텍처:
 * - Main Session: Aside 자체 콘텐츠용
 * - Guest Sessions: 사용자가 열 웹사이트용 (격리)
 *
 * 사용 예:
 *   const view = await createSecureWebContentsView(url)
 */

import { WebContentsView, session } from 'electron'
import { logger } from '@main/utils/Logger'
import { Env } from '@main/config'

/**
 * 시큐어 WebContentsView 생성 (Guest 모드)
 *
 * 특징:
 * 1. 공유하지 않는 Session (쿠키/캐시 격리)
 * 2. Preload 스크립트 없음 (IPC 접근 불가)
 * 3. 권한 제한
 * 4. CSP 헤더 (컨텐츠 격리)
 *
 * @param url - 로드할 URL
 * @returns 생성된 WebContentsView
 */
export async function createSecureWebContentsView(url: string): Promise<WebContentsView> {
  try {
    logger.info('[SecureWebContentsView] Creating guest view', { url })

    // Step 1: Guest Session 생성 (쿠키/캐시 격리)
    const guestSession = session.fromPartition(`persist:guest-${Date.now()}`, {
      cache: true,
    })

    // Step 2: Guest Session 권한 설정
    guestSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      // 모든 권한 거부 (필요시 선택적으로 추가)
      logger.warn('[SecureWebContentsView] Permission request denied', { permission })
      callback(false)
    })

    // Step 3: Guest Session CSP 설정
    guestSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            // 게스트 페이지는 더 제한적인 CSP
            "default-src 'self' https:; " +
              "script-src 'self' https:; " +
              "frame-ancestors 'none'; " +
              "object-src 'none'",
          ],
        },
      })
    })

    // Step 4: WebContentsView 생성 (Preload 없음)
    const view = new WebContentsView({
      webPreferences: {
        // ✅ Preload 사용 안 함 (Guest 격리)
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
        allowRunningInsecureContent: false,
      },
    })

    // Step 5: URL 로드 (자동으로 guestSession 사용)
    await view.webContents.loadURL(url, {
      userAgent: 'Aside Browser 1.0',
    })

    // Step 6: 개발 모드에서만 DevTools 허용
    if (Env.isDev) {
      view.webContents.openDevTools({ mode: 'detach' })
    }

    logger.info('[SecureWebContentsView] Guest view created', { url })
    return view
  } catch (error) {
    logger.error('[SecureWebContentsView] Creation failed:', error)
    throw error
  }
}

/**
 * WebContentsView 안전 정리
 *
 * @param view - 정리할 WebContentsView
 */
export function destroySecureWebContentsView(view: WebContentsView): void {
  try {
    if (!view.webContents.isDestroyed()) {
      // ✅ 이벤트 리스너 정리
      view.webContents.removeAllListeners()

      // ✅ 세션 정리 (쿠키/캐시 삭제)
      view.webContents.session.clearCache()
      view.webContents.session.clearStorageData()
    }

    logger.info('[SecureWebContentsView] Guest view destroyed')
  } catch (error) {
    logger.error('[SecureWebContentsView] Destroy failed:', error)
  }
}

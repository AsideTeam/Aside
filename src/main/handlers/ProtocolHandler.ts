/**
 * Protocol Handler
 *
 * 책임: about:// 페이지 차단 및 커스텀 프로토콜 라우팅
 * - about:settings → React Settings 페이지로 리다이렉트
 * - chrome:// 차단
 * - 커스텀 프로토콜 등록 (app://, aside://)
 *
 * 사용 예:
 *   import { setupProtocolHandlers } from '@main/handlers/ProtocolHandler'
 *   setupProtocolHandlers()
 */

import { app, protocol } from 'electron'
import { logger } from '@main/utils/logger'
import { MainWindow } from '@main/core/window'

/**
 * 프로토콜 핸들러 설정
 */
export function setupProtocolHandlers(): void {
  logger.info('[ProtocolHandler] Setting up protocol handlers...')

  // app:// 프로토콜을 권한 스킴으로 등록
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'app',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
      },
    },
  ])

  logger.info('[ProtocolHandler] Protocol handlers setup completed')
}

/**
 * WebContents의 will-navigate 이벤트 핸들러
 *
 * about://settings, chrome:// 등을 차단하고 커스텀 페이지로 리다이렉트
 */
export function setupNavigationInterceptors(): void {
  logger.info('[ProtocolHandler] Setting up navigation interceptors...')

  app.on('web-contents-created', (_event, contents) => {
    // will-navigate: 페이지 네비게이션 전 차단
    contents.on('will-navigate', (event, url) => {
      logger.debug('[ProtocolHandler] will-navigate:', { url })

      // about:settings → app:settings 리다이렉트
      if (url.startsWith('about:settings') || url.startsWith('chrome://settings')) {
        event.preventDefault()
        logger.info('[ProtocolHandler] Blocked about:settings, redirecting to app:settings')

        // UI renderer에게 이벤트 보내기 (탭 webContents는 preload가 없어 수신 불가)
        const ui = MainWindow.getWebContents()
        if (ui) {
          ui.send('navigate-to-settings')
        } else {
          logger.warn('[ProtocolHandler] UI webContents not available for settings navigation')
        }
        return
      }

      // 다른 chrome:// 페이지 차단
      if (url.startsWith('chrome://') || url.startsWith('about:')) {
        // about:blank는 허용
        if (url === 'about:blank') {
          return
        }

        event.preventDefault()
        logger.warn('[ProtocolHandler] Blocked Chrome internal page:', { url })
        return
      }
    })

    // new-window: 새 창 열기 차단 (target="_blank" 등)
    contents.setWindowOpenHandler((details) => {
      const { url } = details

      // about://, chrome:// 차단
      if (url.startsWith('about:') || url.startsWith('chrome://')) {
        if (url !== 'about:blank') {
          logger.warn('[ProtocolHandler] Blocked window.open to:', { url })
          return { action: 'deny' }
        }
      }

      // 기본적으로 허용
      return { action: 'allow' }
    })
  })

  logger.info('[ProtocolHandler] Navigation interceptors setup completed')
}

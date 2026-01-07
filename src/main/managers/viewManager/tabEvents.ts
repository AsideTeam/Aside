import type { WebContents, WebContentsView } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc/channels'
import { OverlayContentPointerEventSchema } from '@shared/validation/schemas'

import type { LoggerLike, TabData } from './types'

export function attachTabEvents({
  tabId,
  view,
  getTabData,
  getUiWebContents,
  syncToRenderer,
  createTab,
  logger,
}: {
  tabId: string
  view: WebContentsView
  getTabData: (tabId: string) => TabData | undefined
  getUiWebContents: () => WebContents | null
  syncToRenderer: () => void
  createTab: (url: string) => Promise<string>
  logger: LoggerLike
}): void {
  view.webContents.on('before-input-event', (_event, input) => {
    try {
      const uiWebContents = getUiWebContents()
      if (!uiWebContents) return
      if (input.type !== 'mouseDown' && input.type !== 'mouseUp') return

      const payload = OverlayContentPointerEventSchema.parse({
        kind: input.type,
        timestamp: Date.now(),
      })

      uiWebContents.send(IPC_CHANNELS.OVERLAY.CONTENT_POINTER, payload)
    } catch {
      // ignore
    }
  })

  view.webContents.on('page-title-updated', (_event, title) => {
    const tabData = getTabData(tabId)
    if (tabData) {
      tabData.title = title
      logger.info('[ViewManager] Tab title updated', { tabId, title })
      syncToRenderer()
    }
  })

  view.webContents.on('did-navigate', (_event, url) => {
    const tabData = getTabData(tabId)
    if (tabData) {
      tabData.url = url
      logger.info('[ViewManager] Tab URL changed', { tabId, url })
      syncToRenderer()

      const uiWebContents = getUiWebContents()
      if (uiWebContents && tabData.isActive) {
        uiWebContents.send('view:navigated', {
          url,
          canGoBack: view.webContents.navigationHistory.canGoBack(),
          canGoForward: view.webContents.navigationHistory.canGoForward(),
          timestamp: Date.now(),
        })
      }
    }
  })

  view.webContents.on('did-navigate-in-page', (_event, url) => {
    const tabData = getTabData(tabId)
    if (tabData) {
      tabData.url = url
      syncToRenderer()

      const uiWebContents = getUiWebContents()
      if (uiWebContents && tabData.isActive) {
        uiWebContents.send('view:navigated', {
          url,
          canGoBack: view.webContents.navigationHistory.canGoBack(),
          canGoForward: view.webContents.navigationHistory.canGoForward(),
          timestamp: Date.now(),
        })
      }
    }
  })

  view.webContents.setWindowOpenHandler(({ url }) => {
    logger.info('[ViewManager] Intercepted window.open', { url })
    void createTab(url)
    return { action: 'deny' }
  })

  view.webContents.on('page-favicon-updated', (_event, favicons) => {
    const tabData = getTabData(tabId)
    if (tabData && favicons.length > 0) {
      tabData.favicon = favicons[0]
      logger.debug('[ViewManager] Tab favicon updated', { tabId, favicon: favicons[0] })
      syncToRenderer()
    }
  })

  view.webContents.on('did-finish-load', () => {
    const tabData = getTabData(tabId)
    if (!tabData) return

    const uiWebContents = getUiWebContents()
    if (uiWebContents && tabData.isActive) {
      uiWebContents.send('view:loaded', {
        url: view.webContents.getURL(),
        timestamp: Date.now(),
      })
    }
  })

  logger.info('[ViewManager] Tab event listeners attached', { tabId })
}

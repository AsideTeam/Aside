import type { BrowserWindow, WebContents, WebContentsView } from 'electron'

import type { LoggerLike, TabData } from './types'

export function ensureUITopmost({
  contentWindow,
  uiWebContents,
  lastReorderTarget,
  setLastReorderTarget,
  logger,
}: {
  contentWindow: BrowserWindow
  uiWebContents: WebContents
  lastReorderTarget: 'ui' | 'content' | null
  setLastReorderTarget: (next: 'ui' | 'content') => void
  logger: LoggerLike
}): void {
  if (lastReorderTarget === 'ui') return

  try {
    const contentView = contentWindow.getContentView()
    const uiId = uiWebContents.id

    const uiView = contentView.children.find((child) => {
      const maybe = child as unknown as { webContents?: { id?: number } }
      return maybe.webContents?.id === uiId
    })

    if (uiView) {
      contentView.addChildView(uiView as WebContentsView)
      setLastReorderTarget('ui')
    }
  } catch (error) {
    logger.error('[ViewManager] Failed to reorder UI view', error)
  }
}

export function ensureContentTopmost({
  contentWindow,
  activeTabId,
  tabs,
  lastReorderTarget,
  setLastReorderTarget,
  logger,
}: {
  contentWindow: BrowserWindow
  activeTabId: string
  tabs: Map<string, TabData>
  lastReorderTarget: 'ui' | 'content' | null
  setLastReorderTarget: (next: 'ui' | 'content') => void
  logger: LoggerLike
}): void {
  if (lastReorderTarget === 'content') return

  try {
    const tabData = tabs.get(activeTabId)
    if (!tabData) return

    const contentView = contentWindow.getContentView()
    contentView.addChildView(tabData.view)
    setLastReorderTarget('content')
  } catch (error) {
    logger.error('[ViewManager] Failed to reorder content view', error)
  }
}

export function dumpContentViewTree({
  reason,
  contentWindow,
  uiWebContents,
  logger,
}: {
  reason: string
  contentWindow: BrowserWindow
  uiWebContents: WebContents | null
  logger: LoggerLike
}): void {
  try {
    const contentView = contentWindow.getContentView()
    const uiId = uiWebContents?.id

    const children = contentView.children.map((child, index) => {
      const ctor = (child as unknown as { constructor?: { name?: string } }).constructor?.name
      const maybe = child as unknown as { webContents?: { id?: number } }
      const wcId = maybe.webContents?.id
      let bounds: unknown = null
      try {
        bounds = (child as unknown as { getBounds?: () => unknown }).getBounds?.() ?? null
      } catch {
        bounds = null
      }
      return {
        index,
        type: ctor ?? 'Unknown',
        isUiWebContents: uiId ? wcId === uiId : false,
        webContentsId: wcId ?? null,
        isContentRoot: false,
        bounds,
      }
    })

    logger.info('[ViewManager] ContentView tree', {
      reason,
      windowId: contentWindow.id,
      uiWebContentsId: uiId ?? null,
      childCount: children.length,
      children,
    })
  } catch (error) {
    logger.error('[ViewManager] Failed to dump content view tree', error)
  }
}

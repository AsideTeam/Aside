import type { BrowserWindow } from 'electron'

import type { Bounds, LoggerLike, TabData } from './types'

export function applyLayout({
  contentWindow,
  tabs,
  externalActiveBounds,
  logger,
}: {
  contentWindow: BrowserWindow
  tabs: Map<string, TabData>
  externalActiveBounds: Bounds | null
  logger: LoggerLike
}): void {
  const { width, height } = contentWindow.getBounds()

  const defaultBounds: Bounds = {
    x: 0,
    y: 0,
    width,
    height: Math.max(0, height),
  }

  const activeBounds = externalActiveBounds ?? defaultBounds

  logger.debug('[MAIN LAYOUT] Applying bounds:', {
    contentWindow: { w: width, h: height },
    externalBounds: externalActiveBounds,
    finalBounds: activeBounds,
    usingExternal: !!externalActiveBounds,
  })

  for (const [, tabData] of tabs) {
    if (tabData.isActive) {
      if (tabData.url.startsWith('about:')) {
        tabData.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
        logger.debug('[ViewManager] Layout: hiding WebView for about page', { url: tabData.url })
      } else {
        tabData.view.setBounds(activeBounds)
      }
    } else {
      tabData.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
    }
  }
}

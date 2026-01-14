import type { BrowserWindow } from 'electron'

import type { ViewBounds } from '@shared/types/view'
import type { Bounds, LoggerLike, TabData } from './types'

export function computeExternalActiveBounds(args: {
  contentWindow: BrowserWindow
  safeArea: ViewBounds
  logger: LoggerLike
}): { x: number; y: number; width: number; height: number } {
  const { contentWindow, safeArea, logger } = args
  const contentBounds = contentWindow.getBounds()
  const { width, height } = contentBounds

  logger.debug('[📐 MAIN] Content Window actual bounds:', {
    x: contentBounds.x,
    y: contentBounds.y,
    width: contentBounds.width,
    height: contentBounds.height,
  })

  const bleed = 0

  const externalActiveBounds = {
    x: safeArea.left,
    y: safeArea.top,
    width: Math.max(0, width - safeArea.left + bleed),
    height: Math.max(0, height - safeArea.top + bleed),
  }

  logger.debug('[📐 MAIN] Calculated bounds from safe-area (with bleed):', {
    contentWindow: { w: width, h: height },
    safeArea,
    bleed,
    calculatedBounds: externalActiveBounds,
  })

  return externalActiveBounds
}

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

  const hiddenBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 }
  const boundsEqual = (a: Bounds, b: Bounds): boolean =>
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height

  for (const [, tabData] of tabs) {
    const current = tabData.view.getBounds()
    if (tabData.isActive) {
      if (tabData.url.startsWith('about:')) {
        if (!boundsEqual(current, hiddenBounds)) tabData.view.setBounds(hiddenBounds)
        logger.debug('[ViewManager] Layout: hiding WebView for about page', { url: tabData.url })
      } else {
        if (!boundsEqual(current, activeBounds)) tabData.view.setBounds(activeBounds)
      }
    } else {
      if (!boundsEqual(current, hiddenBounds)) tabData.view.setBounds(hiddenBounds)
    }
  }
}

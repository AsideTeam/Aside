import type { WebContents } from 'electron'

import type { LoggerLike, TabData } from './types'

export function disposeSettingsSubscriptions(unsubs: Array<() => void>): void {
  for (const unsub of unsubs) {
    try {
      unsub()
    } catch {
      // ignore
    }
  }
}

export function applyThemeToAllTabs(args: {
  tabs: Map<string, TabData>
  applyAppearance: (tab: TabData) => void
}): void {
  const { tabs, applyAppearance } = args
  for (const tab of tabs.values()) {
    applyAppearance(tab)
  }
}

export function reloadAllNonAboutTabs(args: { tabs: Map<string, TabData>; logger: LoggerLike }): void {
  const { tabs, logger } = args
  for (const tab of tabs.values()) {
    if (tab.url.startsWith('about:')) continue
    try {
      tab.view.webContents.reload()
    } catch (error) {
      logger.warn('[ViewManager] Failed to reload tab after language change', { error: String(error) })
    }
  }
}

export function getZoomFactorFromSetting(value: string): number {
  const percent = Number.parseInt(value, 10)
  if (Number.isNaN(percent)) return 1
  const clamped = Math.min(500, Math.max(25, percent))
  return clamped / 100
}

export function applyPageZoomToWebContents(webContents: WebContents, zoomSetting: string, logger: LoggerLike): void {
  try {
    const factor = getZoomFactorFromSetting(zoomSetting)
    webContents.setZoomFactor(factor)
    logger.info('[ViewManager] Applied page zoom', { factor, zoomSetting })
  } catch (error) {
    logger.warn('[ViewManager] Failed to apply page zoom', { error: String(error), zoomSetting })
  }
}

export function applyPageZoomToAllTabs(tabs: Map<string, TabData>, zoomSetting: string, logger: LoggerLike): void {
  for (const tab of tabs.values()) {
    applyPageZoomToWebContents(tab.view.webContents, zoomSetting, logger)
  }
}

import { WebContentsView } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc/channels'
import { OverlayContentPointerEventSchema } from '@shared/validation/schemas'

import type { LoggerLike, TabData } from './types'
import type { RecentlyClosedTab } from './state'

export function attachTabEvents(args: {
  tabId: string
  view: WebContentsView
  getTabData: (tabId: string) => TabData | undefined
  getUiWebContents: () => Electron.WebContents | null
  syncToRenderer: () => void
  createTab: (url: string) => Promise<string>
  logger: LoggerLike
}): void {
  const { tabId, view, getTabData, getUiWebContents, syncToRenderer, createTab, logger } = args

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

export async function navigateActiveTab(args: {
  tabs: Map<string, TabData>
  activeTabId: string | null
  url: string
  applyAppearance: (tab: TabData) => void
  syncToRenderer: () => void
  logger: LoggerLike
}): Promise<void> {
  const { tabs, activeTabId, url, applyAppearance, syncToRenderer, logger } = args

  if (!activeTabId) {
    logger.warn('[ViewManager] No active tab to navigate')
    return
  }

  const tabData = tabs.get(activeTabId)
  if (!tabData) {
    logger.warn('[ViewManager] Active tab not found')
    return
  }

  try {
    if (url.startsWith('about:')) {
      const aboutPage = url.replace('about:', '')
      switch (aboutPage) {
        case 'preferences':
        case 'settings':
          tabData.url = url
          tabData.title = 'Settings'
          tabData.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
          logger.info('[ViewManager] Navigating to settings page', { tabId: activeTabId })
          syncToRenderer()
          return
        default:
          logger.warn('[ViewManager] Unknown about page:', { page: aboutPage })
          return
      }
    }

    applyAppearance(tabData)
    void tabData.view.webContents.loadURL(url).catch((err) => {
      logger.error('[ViewManager] loadURL error', { url, error: err })
    })

    tabData.url = url
    logger.info('[ViewManager] Navigate started', { url })
    syncToRenderer()
  } catch (error) {
    logger.error('[ViewManager] Navigate failed:', { error, url })
    throw error
  }
}

export function goBack(args: { tabs: Map<string, TabData>; activeTabId: string | null; logger: LoggerLike }): void {
  const { tabs, activeTabId, logger } = args
  if (!activeTabId) return
  const tabData = tabs.get(activeTabId)
  if (tabData?.view.webContents.navigationHistory.canGoBack()) {
    tabData.view.webContents.navigationHistory.goBack()
    logger.info('[ViewManager] Go back', { tabId: activeTabId })
  }
}

export function goForward(args: {
  tabs: Map<string, TabData>
  activeTabId: string | null
  logger: LoggerLike
}): void {
  const { tabs, activeTabId, logger } = args
  if (!activeTabId) return
  const tabData = tabs.get(activeTabId)
  if (tabData?.view.webContents.navigationHistory.canGoForward()) {
    tabData.view.webContents.navigationHistory.goForward()
    logger.info('[ViewManager] Go forward', { tabId: activeTabId })
  }
}

export function reload(args: { tabs: Map<string, TabData>; activeTabId: string | null; logger: LoggerLike }): void {
  const { tabs, activeTabId, logger } = args
  if (!activeTabId) return
  const tabData = tabs.get(activeTabId)
  if (tabData) {
    tabData.view.webContents.reload()
    logger.info('[ViewManager] Reload', { tabId: activeTabId })
  }
}

export async function createTab(args: {
  contentWindow: Electron.BrowserWindow
  tabs: Map<string, TabData>
  url: string
  zoomSetting: string
  applyZoom: (webContents: Electron.WebContents, zoomSetting: string) => void
  setupTabEvents: (tabId: string, view: WebContentsView) => void
  applyAppearance: (webContents: Electron.WebContents) => void
  ensureUITopmost: () => void
  dumpTree?: (reason: string) => void
  logger: LoggerLike
}): Promise<string> {
  const {
    contentWindow,
    tabs,
    url,
    zoomSetting,
    applyZoom,
    setupTabEvents,
    applyAppearance,
    ensureUITopmost,
    dumpTree,
    logger,
  } = args

  logger.info('[ViewManager] Creating new tab...', { url })

  const view = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  })

  view.setBackgroundColor('#00000000')

  applyZoom(view.webContents, zoomSetting)

  const tabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

  const tabData: TabData = {
    id: tabId,
    view,
    url,
    title: 'New Tab',
    isActive: false,
    isPinned: false,
    isFavorite: false,
  }

  tabs.set(tabId, tabData)

  const contentView = contentWindow.getContentView()

  try {
    if (contentView.children.includes(view)) {
      contentView.removeChildView(view)
    }
  } catch {
    // ignore
  }

  contentView.addChildView(view)

  ensureUITopmost()

  dumpTree?.('after-add-tab-view')
  view.setBounds({ x: 0, y: 0, width: 0, height: 0 })

  setupTabEvents(tabId, view)

  applyAppearance(view.webContents)

  void view.webContents.loadURL(url).catch((err) => {
    logger.error('[ViewManager] Failed to load URL in tab', { tabId, url, error: err })
  })

  logger.info('[ViewManager] Tab created (loading in background)', { tabId, url })

  return tabId
}

export function switchTab(args: {
  tabs: Map<string, TabData>
  activeTabId: string | null
  tabId: string
  applyZoomToActive: (tab: TabData) => void
  layout: () => void
  syncToRenderer: () => void
  logger: LoggerLike
}): string | null {
  const { tabs, activeTabId, tabId, applyZoomToActive, layout, syncToRenderer, logger } = args
  const tabData = tabs.get(tabId)
  if (!tabData) {
    logger.warn('[ViewManager] Tab not found', { tabId })
    return activeTabId
  }

  if (activeTabId) {
    const prevTab = tabs.get(activeTabId)
    if (prevTab) {
      prevTab.isActive = false
      prevTab.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
    }
  }

  tabData.isActive = true

  applyZoomToActive(tabData)

  layout()

  logger.info('[ViewManager] Tab switched', { tabId })

  syncToRenderer()

  return tabId
}

export function closeTab(args: {
  tabs: Map<string, TabData>
  activeTabId: string | null
  contentWindow: Electron.BrowserWindow | null
  tabId: string
  recentlyClosed: RecentlyClosedTab[]
  maxRecentClosed: number
  switchTab: (nextTabId: string) => void
  setActiveTabId: (next: string | null) => void
  syncToRenderer: () => void
  logger: LoggerLike
}): void {
  const {
    tabs,
    activeTabId,
    contentWindow,
    tabId,
    recentlyClosed,
    maxRecentClosed,
    switchTab,
    setActiveTabId,
    syncToRenderer,
    logger,
  } = args

  const tabData = tabs.get(tabId)
  if (!tabData) {
    logger.warn('[ViewManager] Tab not found', { tabId })
    return
  }

  try {
    recentlyClosed.push({
      id: tabData.id,
      url: tabData.url,
      title: tabData.title,
      timestamp: Date.now(),
      isPinned: tabData.isPinned,
    })

    if (recentlyClosed.length > maxRecentClosed) {
      recentlyClosed.shift()
    }

    if (contentWindow) {
      contentWindow.getContentView().removeChildView(tabData.view)
    }

    tabData.view.webContents.close()
    tabs.delete(tabId)

    if (activeTabId === tabId) {
      const remainingTabId = Array.from(tabs.keys())[0]
      if (remainingTabId) {
        switchTab(remainingTabId)
      } else {
        setActiveTabId(null)
      }
    }

    logger.info('[ViewManager] Tab closed', { tabId })

    syncToRenderer()
  } catch (error) {
    logger.error('[ViewManager] Tab close failed:', error)
  }
}

export async function duplicateTab(args: {
  tabs: Map<string, TabData>
  tabId: string
  createTab: (url: string) => Promise<string>
  logger: LoggerLike
}): Promise<string> {
  const { tabs, tabId, createTab, logger } = args
  const tab = tabs.get(tabId)
  if (!tab) {
    throw new Error('Tab not found')
  }

  const newTabId = await createTab(tab.url)
  logger.info('[ViewManager] Tab duplicated', { originalId: tabId, newId: newTabId })
  return newTabId
}

export function closeOtherTabs(args: {
  tabs: Map<string, TabData>
  keepTabId: string
  closeTab: (tabId: string) => void
  logger: LoggerLike
}): void {
  const { tabs, keepTabId, closeTab, logger } = args
  const tabsToClose = Array.from(tabs.keys()).filter((id) => id !== keepTabId)
  for (const tabId of tabsToClose) {
    closeTab(tabId)
  }
  logger.info('[ViewManager] Closed other tabs', { kept: keepTabId, closed: tabsToClose.length })
}

export async function closeAllTabs(args: {
  tabs: Map<string, TabData>
  closeTab: (tabId: string) => void
  createTab: (url: string) => Promise<string>
  homepage: string
  logger: LoggerLike
}): Promise<void> {
  const { tabs, closeTab, createTab, homepage, logger } = args

  const allTabIds = Array.from(tabs.keys())
  for (const tabId of allTabIds) {
    closeTab(tabId)
  }

  if (tabs.size === 0) {
    await createTab(homepage)
  }

  logger.info('[ViewManager] Closed all tabs')
}

export async function restoreClosedTab(args: {
  recentlyClosed: RecentlyClosedTab[]
  createTab: (url: string) => Promise<string>
  setPinned: (tabId: string, pinned: boolean) => void
  logger: LoggerLike
}): Promise<string | null> {
  const { recentlyClosed, createTab, setPinned, logger } = args

  if (recentlyClosed.length === 0) {
    logger.warn('[ViewManager] No recently closed tabs to restore')
    return null
  }

  const closedTab = recentlyClosed.pop()
  if (!closedTab) return null

  const newTabId = await createTab(closedTab.url)
  if (closedTab.isPinned) {
    setPinned(newTabId, true)
  }

  logger.info('[ViewManager] Restored closed tab', { url: closedTab.url, newId: newTabId })
  return newTabId
}

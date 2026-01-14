/**
 * ViewManager - WebContentsView 관리자
 *
 * 책임: 탭(WebContentsView) 리스트 및 레이아웃 계산
 * - 탭 생성/제거/전환
 * - 각 탭의 상태 관리 (URL, 히스토리, 스크롤 위치)
 * - 레이아웃 계산 (3-column layout 등)
 * - 탭 간 네비게이션
 *
 * 사용 예:
 *   import { ViewManager } from '@main/managers/viewManager'
 *   await ViewManager.initialize(mainWindow)
 *   ViewManager.createTab('https://google.com')
 *
 * 아키텍처:
 * - 각 View = WebContentsView (경량, 빠른 전환)
 * - MainWindow = 컨테이너 (View들을 호스팅)
 * - ViewManager = 상태 관리 및 레이아웃 계산
 */

import { BrowserWindow, WebContents, WebContentsView } from 'electron'

import { AppearanceService } from '@main/services/AppearanceService'
import { SettingsStore } from '@main/services/SettingsStore'
import { logger } from '@main/utils/logger'
import type { ViewBounds } from '@shared/types/view'

import { dumpContentViewTree, ensureContentTopmost, ensureUITopmost } from './contentView'
import { applyLayout, computeExternalActiveBounds } from './layout'
import { createInitialViewManagerState, DEFAULT_MAX_RECENT_CLOSED, type ViewManagerState } from './state'
import { getTabsSnapshot, moveTabToSection, reorderTab, reorderTabWithinSection, setPinned, syncTabsToRenderer } from './tabs'
import {
  attachTabEvents,
  closeAllTabs,
  closeOtherTabs,
  closeTab,
  createTab,
  duplicateTab,
  goBack,
  goForward,
  navigateActiveTab,
  reload,
  restoreClosedTab,
  switchTab,
} from './tabOps'
import type { TabData } from './types'
import {
  applyPageZoomToAllTabs,
  applyPageZoomToWebContents,
  applyThemeToAllTabs,
  disposeSettingsSubscriptions,
  reloadAllNonAboutTabs,
} from './runtime'

export class ViewManager {
  private static state: ViewManagerState = createInitialViewManagerState()
  private static readonly MAX_RECENT_CLOSED = DEFAULT_MAX_RECENT_CLOSED
  private static syncTimer: ReturnType<typeof setTimeout> | null = null
  private static readonly SYNC_DEBOUNCE_MS = 16

  private static scheduleSyncToRenderer(): void {
    if (this.syncTimer) return
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null
      this.syncToRenderer()
    }, this.SYNC_DEBOUNCE_MS)
  }

  static async initialize(contentWindow: BrowserWindow, uiWebContents: WebContents): Promise<void> {
    if (this.state.contentWindow) {
      logger.warn('[ViewManager] Already initialized. Skipping.')
      return
    }

    if (this.state.isInitializing) {
      throw new Error('[ViewManager] Initialization already in progress')
    }

    this.state.isInitializing = true

    try {
      logger.info('[ViewManager] Initializing...')

      this.state.contentWindow = contentWindow
      this.state.uiWebContents = uiWebContents

      const settingsStore = SettingsStore.getInstance()
      const initialZoom = settingsStore.get('pageZoom')
      applyPageZoomToAllTabs(this.state.tabs, initialZoom, logger)

      this.state.settingsUnsubscribers.push(
        settingsStore.onChange('pageZoom', (newValue) => {
          const zoomSetting = typeof newValue === 'string' ? newValue : settingsStore.get('pageZoom')
          applyPageZoomToAllTabs(this.state.tabs, zoomSetting, logger)
        })
      )

      this.state.settingsUnsubscribers.push(
        settingsStore.onChange('theme', () => {
          applyThemeToAllTabs({
            tabs: this.state.tabs,
            applyAppearance: (tab) => {
              void AppearanceService.applyToWebContents(tab.view.webContents)
            },
          })
        })
      )

      this.state.settingsUnsubscribers.push(
        settingsStore.onChange('language', () => {
          reloadAllNonAboutTabs({ tabs: this.state.tabs, logger })
        })
      )

      this.dumpContentViewTree('after-initialize')

      this.state.contentWindow.on('resize', () => {
        this.layout()
      })

      const homepage = settingsStore.get('homepage')
      const homeTabId = await this.createTab(homepage)
      logger.info('[ViewManager] Home tab created', { tabId: homeTabId })

      this.switchTab(homeTabId)

      this.layout()
      logger.info('[ViewManager] Layout applied')


      this.dumpContentViewTree('after-layout')

      logger.info('[ViewManager] Initialization completed')
    } catch (error) {
      logger.error('[ViewManager] Initialization failed:', error)
      throw error
    } finally {
      this.state.isInitializing = false
    }
  }

  static async createTab(url: string): Promise<string> {
    if (!this.state.contentWindow) {
      throw new Error('[ViewManager] Not initialized. Call initialize() first.')
    }

    try {
      const settingsStore = SettingsStore.getInstance()
      const zoomSetting = settingsStore.get('pageZoom')
      const tabId = await createTab({
        contentWindow: this.state.contentWindow,
        tabs: this.state.tabs,
        url,
        zoomSetting,
        applyZoom: (wc, setting) => applyPageZoomToWebContents(wc, setting, logger),
        setupTabEvents: (id, view) => this.setupTabEvents(id, view),
        applyAppearance: (wc) => {
          void AppearanceService.applyToWebContents(wc)
        },
        dumpTree:
          process.env.ASIDE_VIEW_TREE_DEBUG === '1'
            ? (reason) => this.dumpContentViewTree(reason)
            : undefined,
        logger,
      })

      return tabId
    } catch (error) {
      logger.error('[ViewManager] Tab creation failed:', error)
      throw error
    }
  }

  static switchTab(tabId: string): void {
    const settingsStore = SettingsStore.getInstance()
    const next = switchTab({
      tabs: this.state.tabs,
      activeTabId: this.state.activeTabId,
      tabId,
      applyZoomToActive: (tab: TabData) =>
        applyPageZoomToWebContents(tab.view.webContents, settingsStore.get('pageZoom'), logger),
      layout: () => this.layout(),
      syncToRenderer: () => this.scheduleSyncToRenderer(),
      logger,
    })

    this.state.activeTabId = next
  }

  static setActiveViewBounds(safeArea: ViewBounds): void {
    if (!this.state.contentWindow) {
      logger.warn('[ViewManager] contentWindow not available; ignoring safe-area')
      return
    }

    // Dedupe: Renderer can send the same safe-area repeatedly during layout.
    if (this.state.lastSafeArea && this.state.lastSafeArea.left === safeArea.left && this.state.lastSafeArea.top === safeArea.top) {
      return
    }
    this.state.lastSafeArea = safeArea

    const nextBounds = computeExternalActiveBounds({
      contentWindow: this.state.contentWindow,
      safeArea,
      logger,
    })

    const prev = this.state.externalActiveBounds
    if (prev && prev.x === nextBounds.x && prev.y === nextBounds.y && prev.width === nextBounds.width && prev.height === nextBounds.height) {
      return
    }

    this.state.externalActiveBounds = nextBounds

    this.layout()
  }

  static closeTab(tabId: string): void {
    closeTab({
      tabs: this.state.tabs,
      activeTabId: this.state.activeTabId,
      contentWindow: this.state.contentWindow,
      tabId,
      recentlyClosed: this.state.recentlyClosed,
      maxRecentClosed: this.MAX_RECENT_CLOSED,
      switchTab: (nextTabId) => this.switchTab(nextTabId),
      setActiveTabId: (next) => {
        this.state.activeTabId = next
      },
      syncToRenderer: () => this.scheduleSyncToRenderer(),
      logger,
    })
  }

  static getTabs(): Array<Omit<TabData, 'view'>> {
    return getTabsSnapshot(this.state.tabs)
  }

  static getActiveTabId(): string | null {
    return this.state.activeTabId
  }

  static setPinned(tabId: string, pinned: boolean): void {
    setPinned({ tabs: this.state.tabs, tabId, pinned, logger })
    this.scheduleSyncToRenderer()
  }

  static reorderTab(tabId: string, targetId: string): void {
    reorderTab({ tabs: this.state.tabs, tabId, targetId, logger })
    this.scheduleSyncToRenderer()
  }

  static reorderTabWithinSection(tabId: string, position: number): void {
    reorderTabWithinSection({ tabs: this.state.tabs, tabId, position, logger })
    this.scheduleSyncToRenderer()
  }

  static reorderIcon(fromIndex: number, toIndex: number): void {
    logger.info('[ViewManager] Icon reordered', { fromIndex, toIndex })
  }

  static moveTabToSection(tabId: string, targetType: 'icon' | 'space' | 'tab'): void {
    moveTabToSection({ tabs: this.state.tabs, tabId, targetType, logger })

    this.scheduleSyncToRenderer()
  }

  static async duplicateTab(tabId: string): Promise<string> {
    return duplicateTab({
      tabs: this.state.tabs,
      tabId,
      createTab: (url) => this.createTab(url),
      logger,
    })
  }

  static closeOtherTabs(keepTabId: string): void {
    closeOtherTabs({
      tabs: this.state.tabs,
      keepTabId,
      closeTab: (id) => this.closeTab(id),
      logger,
    })
  }

  static closeAllTabs(): void {
    const homepage = SettingsStore.getInstance().get('homepage')
    void closeAllTabs({
      tabs: this.state.tabs,
      closeTab: (id) => this.closeTab(id),
      createTab: (url) => this.createTab(url),
      homepage,
      logger,
    })
  }

  static async restoreClosedTab(): Promise<string | null> {
    return restoreClosedTab({
      recentlyClosed: this.state.recentlyClosed,
      createTab: (url) => this.createTab(url),
      setPinned: (id, pinned) => this.setPinned(id, pinned),
      logger,
    })
  }

  static getRecentlyClosed(): Array<{ id: string; url: string; title: string; timestamp: number; isPinned: boolean }> {
    return [...this.state.recentlyClosed]
  }

  static async navigate(url: string): Promise<void> {
    await navigateActiveTab({
      tabs: this.state.tabs,
      activeTabId: this.state.activeTabId,
      url,
      applyAppearance: (tab) => {
        void AppearanceService.applyToWebContents(tab.view.webContents)
      },
      syncToRenderer: () => this.scheduleSyncToRenderer(),
      logger,
    })
  }

  static goBack(): void {
    goBack({ tabs: this.state.tabs, activeTabId: this.state.activeTabId, logger })
  }

  static goForward(): void {
    goForward({ tabs: this.state.tabs, activeTabId: this.state.activeTabId, logger })
  }

  static reload(): void {
    reload({ tabs: this.state.tabs, activeTabId: this.state.activeTabId, logger })
  }

  static destroy(): void {
    logger.info('[ViewManager] Destroying all tabs...')

    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = null
    }

    disposeSettingsSubscriptions(this.state.settingsUnsubscribers)
    this.state.settingsUnsubscribers = []

    for (const [tabId] of this.state.tabs) {
      try {
        this.closeTab(tabId)
      } catch (error) {
        logger.error('[ViewManager] Error closing tab:', { tabId, error })
      }
    }

    this.state.tabs.clear()
    this.state.activeTabId = null
    this.state.contentWindow = null
    this.state.uiWebContents = null

    logger.info('[ViewManager] All tabs destroyed')
  }

  static hideActiveView(): void {
    if (!this.state.activeTabId) return

    const tabData = this.state.tabs.get(this.state.activeTabId)
    if (tabData && this.state.contentWindow) {
      tabData.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
      logger.info('[ViewManager] Active view hidden', { tabId: this.state.activeTabId })
    }
  }

  static showActiveView(): void {
    if (!this.state.activeTabId) return

    const tabData = this.state.tabs.get(this.state.activeTabId)
    if (tabData) {
      this.layout()
      logger.info('[ViewManager] Active view shown', { tabId: this.state.activeTabId })
    }
  }

  private static layout(): void {
    if (!this.state.contentWindow) return
    applyLayout({
      contentWindow: this.state.contentWindow,
      tabs: this.state.tabs,
      externalActiveBounds: this.state.externalActiveBounds,
      logger,
    })
  }

  private static syncToRenderer(): void {
    syncTabsToRenderer({
      uiWebContents: this.state.uiWebContents,
      tabs: this.state.tabs,
      activeTabId: this.state.activeTabId,
      logger,
    })
  }

  private static setupTabEvents(tabId: string, view: WebContentsView): void {
    attachTabEvents({
      tabId,
      view,
      getTabData: (id) => this.state.tabs.get(id),
      getUiWebContents: () => this.state.uiWebContents,
      syncToRenderer: () => this.scheduleSyncToRenderer(),
      createTab: (url) => this.createTab(url),
      logger,
    })
  }

  static ensureUITopmost(): void {
    if (!this.state.contentWindow || !this.state.uiWebContents) return
    ensureUITopmost({
      contentWindow: this.state.contentWindow,
      uiWebContents: this.state.uiWebContents,
      lastReorderTarget: this.state.lastReorderTarget,
      setLastReorderTarget: (next) => {
        this.state.lastReorderTarget = next
      },
      logger,
    })
  }

  static ensureContentTopmost(): void {
    if (!this.state.contentWindow || !this.state.activeTabId) return
    ensureContentTopmost({
      contentWindow: this.state.contentWindow,
      activeTabId: this.state.activeTabId,
      tabs: this.state.tabs,
      lastReorderTarget: this.state.lastReorderTarget,
      setLastReorderTarget: (next) => {
        this.state.lastReorderTarget = next
      },
      logger,
    })
  }

  private static dumpContentViewTree(reason: string): void {
    if (!this.state.contentWindow) return
    dumpContentViewTree({
      reason,
      contentWindow: this.state.contentWindow,
      uiWebContents: this.state.uiWebContents,
      logger,
    })
  }
}

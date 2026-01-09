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

/**
 * ViewManager 싱글톤
 *
 * 상태:
 * - tabs: 모든 탭 리스트
 * - activeTabId: 현재 활성 탭 ID
 * - mainWindow: 부모 BrowserWindow
 */
export class ViewManager {
  private static state: ViewManagerState = createInitialViewManagerState()
  private static readonly MAX_RECENT_CLOSED = DEFAULT_MAX_RECENT_CLOSED

  /**
   * ViewManager 초기화
   *
   * 프로세스:
   * 1. 메인 윈도우 저장
   * 2. 기본 탭 1개 생성 (홈페이지)
   * 3. 레이아웃 적용
   */
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

      // Apply runtime settings to content views (no renderer trust).
      const settingsStore = SettingsStore.getInstance()
      const initialZoom = settingsStore.get('pageZoom')
      applyPageZoomToAllTabs(this.state.tabs, initialZoom, logger)

      // Subscribe to settings that affect WebContents behavior.
      this.state.settingsUnsubscribers.push(
        settingsStore.onChange('pageZoom', (newValue) => {
          const zoomSetting = typeof newValue === 'string' ? newValue : settingsStore.get('pageZoom')
          applyPageZoomToAllTabs(this.state.tabs, zoomSetting, logger)
        })
      )

      // Theme / language changes should be reflected in existing WebContentsViews.
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

      // Language (Accept-Language) is applied at the session layer.
      // Most sites only pick it up on navigation/reload.
      this.state.settingsUnsubscribers.push(
        settingsStore.onChange('language', () => {
          reloadAllNonAboutTabs({ tabs: this.state.tabs, logger })
        })
      )

      this.dumpContentViewTree('after-initialize')

      // 윈도우 리사이즈 시 레이아웃 재계산
      this.state.contentWindow.on('resize', () => {
        this.layout()
      })

      // Step 1: 기본 탭 생성 (홈페이지)
      const homepage = SettingsStore.getInstance().get('homepage')
      const homeTabId = await this.createTab(homepage)
      logger.info('[ViewManager] Home tab created', { tabId: homeTabId })

      // ✅ 기본 탭을 활성화하지 않으면 모든 뷰가 0x0으로 남아 "웹이 안 뜸"
      this.switchTab(homeTabId)

      // Step 2: 레이아웃 계산 및 적용
      this.layout()
      logger.info('[ViewManager] Layout applied')

      // ⭐ UI 뷰를 최상위로 올려 Overlay 보장 (투명도 설정 후 안전)
      this.ensureUITopmost()

      this.dumpContentViewTree('after-layout')

      logger.info('[ViewManager] Initialization completed')
    } catch (error) {
      logger.error('[ViewManager] Initialization failed:', error)
      throw error
    } finally {
      this.state.isInitializing = false
    }
  }

  /**
   * 새 탭 생성
   */
  static async createTab(url: string): Promise<string> {
    if (!this.state.contentWindow) {
      throw new Error('[ViewManager] Not initialized. Call initialize() first.')
    }

    try {
      const zoomSetting = SettingsStore.getInstance().get('pageZoom')
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
        ensureUITopmost: () => this.ensureUITopmost(),
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

  /**
   * 탭 전환
   */
  static switchTab(tabId: string): void {
    const next = switchTab({
      tabs: this.state.tabs,
      activeTabId: this.state.activeTabId,
      tabId,
      applyZoomToActive: (tab: TabData) =>
        applyPageZoomToWebContents(tab.view.webContents, SettingsStore.getInstance().get('pageZoom'), logger),
      layout: () => this.layout(),
      syncToRenderer: () => this.syncToRenderer(),
      logger,
    })

    this.state.activeTabId = next
  }

  /**
   * Renderer에서 들어온 safe-area 오프셋을 받아 실제 bounds 계산
   */
  static setActiveViewBounds(safeArea: ViewBounds): void {
    if (!this.state.contentWindow) {
      logger.warn('[ViewManager] contentWindow not available; ignoring safe-area')
      return
    }

    this.state.externalActiveBounds = computeExternalActiveBounds({
      contentWindow: this.state.contentWindow,
      safeArea,
      logger,
    })

    this.layout()
  }

  /**
   * 탭 닫기
   */
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
      syncToRenderer: () => this.syncToRenderer(),
      logger,
    })
  }

  /**
   * 탭 리스트 반환 (뷰 객체 제외)
   */
  static getTabs(): Array<Omit<TabData, 'view'>> {
    return getTabsSnapshot(this.state.tabs)
  }

  static getActiveTabId(): string | null {
    return this.state.activeTabId
  }

  /**
   * 탭 고정/해제 (Space 섹션에 표시)
   */
  static setPinned(tabId: string, pinned: boolean): void {
    setPinned({ tabs: this.state.tabs, tabId, pinned, logger })
    this.syncToRenderer()
  }

  /**
   * 탭 순서 변경 (드래그앤드롭)
   */
  static reorderTab(tabId: string, targetId: string): void {
    reorderTab({ tabs: this.state.tabs, tabId, targetId, logger })
    this.syncToRenderer()
  }

  /**
   * 같은 섹션 내에서 탭 순서 변경
   */
  static reorderTabWithinSection(tabId: string, position: number): void {
    reorderTabWithinSection({ tabs: this.state.tabs, tabId, position, logger })
    this.syncToRenderer()
  }

  /**
   * Icon 섹션의 앱 순서 변경 (고정 앱 순서)
   */
  static reorderIcon(fromIndex: number, toIndex: number): void {
    logger.info('[ViewManager] Icon reordered', { fromIndex, toIndex })
  }

  /**
   * 탭을 다른 섹션으로 이동 (Icon/Space/Tab)
   */
  static moveTabToSection(tabId: string, targetType: 'icon' | 'space' | 'tab'): void {
    moveTabToSection({ tabs: this.state.tabs, tabId, targetType, logger })

    this.syncToRenderer()
  }

  /**
   * 탭 복제 (같은 URL로 새 탭 생성)
   */
  static async duplicateTab(tabId: string): Promise<string> {
    return duplicateTab({
      tabs: this.state.tabs,
      tabId,
      createTab: (url) => this.createTab(url),
      logger,
    })
  }

  /**
   * 다른 탭 모두 닫기
   */
  static closeOtherTabs(keepTabId: string): void {
    closeOtherTabs({
      tabs: this.state.tabs,
      keepTabId,
      closeTab: (id) => this.closeTab(id),
      logger,
    })
  }

  /**
   * 모든 탭 닫기 (최소 1개는 유지)
   */
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

  /**
   * 닫은 탭 복원 (가장 최근)
   */
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

  /**
   * 현재 활성 탭에서 URL 이동
   */
  static async navigate(url: string): Promise<void> {
    await navigateActiveTab({
      tabs: this.state.tabs,
      activeTabId: this.state.activeTabId,
      url,
      applyAppearance: (tab) => {
        void AppearanceService.applyToWebContents(tab.view.webContents)
      },
      syncToRenderer: () => this.syncToRenderer(),
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

  /**
   * 모든 탭 정리 (앱 종료 시)
   */
  static destroy(): void {
    logger.info('[ViewManager] Destroying all tabs...')

    disposeSettingsSubscriptions(this.state.settingsUnsubscribers)
    this.state.settingsUnsubscribers = []

    // 모든 탭 정리
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

  /**
   * 활성 탭의 WebContentsView 숨기기
   */
  static hideActiveView(): void {
    if (!this.state.activeTabId) return

    const tabData = this.state.tabs.get(this.state.activeTabId)
    if (tabData && this.state.contentWindow) {
      tabData.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
      logger.info('[ViewManager] Active view hidden', { tabId: this.state.activeTabId })
    }
  }

  /**
   * 활성 탭의 WebContentsView 다시 표시
   */
  static showActiveView(): void {
    if (!this.state.activeTabId) return

    const tabData = this.state.tabs.get(this.state.activeTabId)
    if (tabData) {
      this.layout()
      logger.info('[ViewManager] Active view shown', { tabId: this.state.activeTabId })
    }
  }

  /**
   * 레이아웃 계산 및 적용
   */
  private static layout(): void {
    if (!this.state.contentWindow) return
    applyLayout({
      contentWindow: this.state.contentWindow,
      tabs: this.state.tabs,
      externalActiveBounds: this.state.externalActiveBounds,
      logger,
    })
  }

  /**
   * Renderer 프로세스에 탭 상태 동기화
   */
  private static syncToRenderer(): void {
    syncTabsToRenderer({
      uiWebContents: this.state.uiWebContents,
      tabs: this.state.tabs,
      activeTabId: this.state.activeTabId,
      logger,
    })
  }

  /**
   * 탭 이벤트 설정
   */
  private static setupTabEvents(tabId: string, view: WebContentsView): void {
    attachTabEvents({
      tabId,
      view,
      getTabData: (id) => this.state.tabs.get(id),
      getUiWebContents: () => this.state.uiWebContents,
      syncToRenderer: () => this.syncToRenderer(),
      createTab: (url) => this.createTab(url),
      logger,
    })
  }

  /**
   * UI View를 최상단(Z-Order top)으로 이동
   */
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

  /**
   * Content View(웹탭)를 최상단으로 이동하여 클릭 가능하게 함
   */
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

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
 *   import { ViewManager } from '@main/managers/view-manager'
 *   await ViewManager.initialize(mainWindow)
 *   ViewManager.createTab('https://google.com')
 *
 * 아키텍처:
 * - 각 View = WebContentsView (경량, 빠른 전환)
 * - MainWindow = 컨테이너 (View들을 호스팅)
 * - ViewManager = 상태 관리 및 레이아웃 계산
 */

import { BrowserWindow, WebContents, WebContentsView } from 'electron'
import { logger } from '@main/utils/logger'
import type { ViewBounds } from '@shared/types/view'
import type { TabData, TabSection } from './viewManager/types'
import { applyLayout } from './viewManager/layout'
import { attachTabEvents } from './viewManager/tabEvents'
import { SettingsStore } from '@main/services/SettingsStore'
import {
  dumpContentViewTree,
  ensureContentTopmost as ensureContentTopmostImpl,
  ensureUITopmost as ensureUITopmostImpl,
} from './viewManager/contentView'


/**
 * ViewManager 싱글톤
 *
 * 상태:
 * - tabs: 모든 탭 리스트
 * - activeTabId: 현재 활성 탭 ID
 * - mainWindow: 부모 BrowserWindow
 */
export class ViewManager {
  private static tabs: Map<string, TabData> = new Map()
  private static activeTabId: string | null = null
  private static contentWindow: BrowserWindow | null = null
  private static uiWebContents: WebContents | null = null
  private static isInitializing = false
  private static lastReorderTarget: 'ui' | 'content' | null = null
  private static externalActiveBounds: { x: number; y: number; width: number; height: number } | null = null
  
  // NEW: Recently closed tabs for undo
  private static recentlyClosed: Array<{ id: string; url: string; title: string; timestamp: number; isPinned: boolean }> = []
  private static readonly MAX_RECENT_CLOSED = 10

  private static settingsUnsubscribers: Array<() => void> = []

  private static getZoomFactorFromSetting(value: string): number {
    const percent = Number.parseInt(value, 10)
    if (Number.isNaN(percent)) return 1
    const clamped = Math.min(500, Math.max(25, percent))
    return clamped / 100
  }

  private static applyPageZoomToWebContents(webContents: WebContents, zoomSetting: string): void {
    try {
      const factor = this.getZoomFactorFromSetting(zoomSetting)
      webContents.setZoomFactor(factor)
      logger.info('[ViewManager] Applied page zoom', { factor, zoomSetting })
    } catch (error) {
      logger.warn('[ViewManager] Failed to apply page zoom', { error: String(error), zoomSetting })
    }
  }

  private static applyPageZoomToAllTabs(zoomSetting: string): void {
    for (const tab of this.tabs.values()) {
      this.applyPageZoomToWebContents(tab.view.webContents, zoomSetting)
    }
  }



  /**
   * ViewManager 초기화
   *
   * 프로세스:
   * 1. 메인 윈도우 저장
   * 2. 기본 탭 1개 생성 (홈페이지)
   * 3. 레이아웃 적용
   *
   * @param window - 부모 BrowserWindow
   */
  static async initialize(contentWindow: BrowserWindow, uiWebContents: WebContents): Promise<void> {
    if (this.contentWindow) {
      logger.warn('[ViewManager] Already initialized. Skipping.')
      return
    }

    if (this.isInitializing) {
      throw new Error('[ViewManager] Initialization already in progress')
    }

    this.isInitializing = true

    try {
      logger.info('[ViewManager] Initializing...')

      this.contentWindow = contentWindow
      this.uiWebContents = uiWebContents

      // Apply runtime settings to content views (no renderer trust).
      const settingsStore = SettingsStore.getInstance()
      const initialZoom = settingsStore.get('pageZoom')
      this.applyPageZoomToAllTabs(initialZoom)

      // Subscribe to settings that affect WebContents behavior.
      this.settingsUnsubscribers.push(
        settingsStore.onChange('pageZoom', (newValue) => {
          const zoomSetting = typeof newValue === 'string' ? newValue : settingsStore.get('pageZoom')
          this.applyPageZoomToAllTabs(zoomSetting)
        })
      )

      this.dumpContentViewTree('after-initialize')

      // 윈도우 리사이즈 시 레이아웃 재계산
      this.contentWindow.on('resize', () => {
        this.layout()
      })

      // Step 1: 기본 탭 생성 (홈페이지)
      const homeTabId = await this.createTab('https://www.google.com')
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
      this.isInitializing = false
    }
  }

  /**
   * 새 탭 생성
   *
   * 프로세스:
   * 1. WebContentsView 생성
   * 2. 탭 데이터 저장
   * 3. URL 로드
   * 4. 이벤트 리스너 설정
   *
   * @param url - 초기 URL
   * @returns 생성된 탭 ID
   */
  static async createTab(url: string): Promise<string> {
    if (!this.contentWindow) {
      throw new Error('[ViewManager] Not initialized. Call initialize() first.')
    }

    try {
      logger.info('[ViewManager] Creating new tab...', { url })

      // Step 1: WebContentsView 생성
      // ⭐ backgroundColor를 투명하게 설정 (기본값은 흰색!)
      const view = new WebContentsView({
        webPreferences: {
          contextIsolation: true,
          sandbox: true,
        },
      })

      // ⭐ 투명 배경 설정 (Electron은 기본적으로 흰색 배경 사용)
      view.setBackgroundColor('#00000000')

      // Apply persisted zoom immediately (so initial load is correct).
      const zoomSetting = SettingsStore.getInstance().get('pageZoom')
      this.applyPageZoomToWebContents(view.webContents, zoomSetting)

      // Step 2: 고유 ID 생성
      const tabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

      // Step 3: 탭 데이터 저장
      const tabData: TabData = {
        id: tabId,
        view,
        url,
        title: 'New Tab',
        isActive: false,
        isPinned: false, // Default: not pinned
        isFavorite: false,
      }

      this.tabs.set(tabId, tabData)

      // Step 4: ContentWindow에 추가 (초기에는 숨김)
      // 단일 윈도우(Views): 탭 WebContentsView를 topmost에 두어 Google이 앞에 보이게 한다.
      // React UI는 CSS z-index로 header/sidebar overlay를 유지한다.
      const contentView = this.contentWindow.getContentView()

      try {
        if (contentView.children.includes(view)) {
          contentView.removeChildView(view)
        }
      } catch {
        // ignore
      }

      contentView.addChildView(view)  // 탭을 먼저 추가

      // ⭐ UI 뷰를 다시 최상위로 (탭 위로) 이동 (투명도 설정 후 안전)
      this.ensureUITopmost()

      this.dumpContentViewTree('after-add-tab-view')
      view.setBounds({ x: 0, y: 0, width: 0, height: 0 })

      // Step 5: 이벤트 리스너 설정 (URL 로드 전에 설정하여 이벤트 누락 방지)
      this.setupTabEvents(tabId, view)

      // Step 6: URL 로드 (비동기, 기다리지 않음 - 속도 최적화)
      // 페이지가 로드되면 이벤트 리스너가 title/favicon을 자동 업데이트
      void view.webContents.loadURL(url).catch((err) => {
        logger.error('[ViewManager] Failed to load URL in tab', { tabId, url, error: err })
      })

      logger.info('[ViewManager] Tab created (loading in background)', { tabId, url })

      return tabId
    } catch (error) {
      logger.error('[ViewManager] Tab creation failed:', error)
      throw error
    }
  }

  /**
   * 탭 전환
   *
   * @param tabId - 활성화할 탭 ID
   */
  static switchTab(tabId: string): void {
    const tabData = this.tabs.get(tabId)
    if (!tabData) {
      logger.warn('[ViewManager] Tab not found', { tabId })
      return
    }

    // 이전 탭 비활성화
    if (this.activeTabId) {
      const prevTab = this.tabs.get(this.activeTabId)
      if (prevTab) {
        prevTab.isActive = false
        prevTab.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
      }
    }

    // 새 탭 활성화
    this.activeTabId = tabId
    tabData.isActive = true

    // Ensure zoom is applied for the active tab.
    this.applyPageZoomToWebContents(tabData.view.webContents, SettingsStore.getInstance().get('pageZoom'))

    this.layout()

    logger.info('[ViewManager] Tab switched', { tabId })
    
    // Renderer 동기화
    this.syncToRenderer()
  }

  /**
   * Renderer에서 들어온 safe-area 오프셋을 받아 실제 bounds 계산
   */
  static setActiveViewBounds(safeArea: ViewBounds): void {
    if (!this.contentWindow) {
      logger.warn('[ViewManager] contentWindow not available; ignoring safe-area')
      return
    }

    const contentBounds = this.contentWindow.getBounds()
    const { width, height } = contentBounds

    // ⭐ 디버깅: Content Window 실제 크기
    logger.info('[📐 MAIN] Content Window actual bounds:', {
      x: contentBounds.x,
      y: contentBounds.y,
      width: contentBounds.width,
      height: contentBounds.height,
    })

    // Bleed는 투명 배경 설정으로 필요 없어짐
    const bleed = 0

    // Safe-area 오프셋을 빼서 실제 WebContentsView bounds 계산
    this.externalActiveBounds = {
      x: safeArea.left,
      y: safeArea.top,
      width: Math.max(0, width - safeArea.left + bleed),
      height: Math.max(0, height - safeArea.top + bleed),
    }

    logger.debug('[📐 MAIN] Calculated bounds from safe-area (with bleed):', {
      contentWindow: { w: width, h: height },
      safeArea,
      bleed,
      calculatedBounds: this.externalActiveBounds
    })

    this.layout()
  }

  /**
   * 탭 닫기
   *
   * @param tabId - 닫을 탭 ID
   */
  static closeTab(tabId: string): void {
    const tabData = this.tabs.get(tabId)
    if (!tabData) {
      logger.warn('[ViewManager] Tab not found', { tabId })
      return
    }

    try {
      // Save to recently closed (for undo)
      this.recentlyClosed.push({
        id: tabData.id,
        url: tabData.url,
        title: tabData.title,
        timestamp: Date.now(),
        isPinned: tabData.isPinned,
      })
      // Keep only last MAX_RECENT_CLOSED items
      if (this.recentlyClosed.length > this.MAX_RECENT_CLOSED) {
        this.recentlyClosed.shift()
      }

      // WebContents View 제거
      // ⚠️ Electron 39: contentView는 게터 메서드로 변경됨
      if (this.contentWindow) {
        this.contentWindow.getContentView().removeChildView(tabData.view)
      }

      tabData.view.webContents.close()
      this.tabs.delete(tabId)

      // 활성 탭 닫혔으면 다른 탭 활성화
      if (this.activeTabId === tabId) {
        const remainingTabId = Array.from(this.tabs.keys())[0]
        if (remainingTabId) {
          this.switchTab(remainingTabId)
        } else {
          this.activeTabId = null
        }
      }

      logger.info('[ViewManager] Tab closed', { tabId })
      
      // Renderer 동기화
      this.syncToRenderer()
    } catch (error) {
      logger.error('[ViewManager] Tab close failed:', error)
    }
  }

  /**
   * 탭 리스트 반환
   *
   * @returns 모든 탭 메타데이터 (뷰 객체 제외)
   */
  static getTabs(): Array<Omit<TabData, 'view'>> {
    return Array.from(this.tabs.values()).map(({ id, url, title, isActive, isPinned, isFavorite, favicon }) => ({
      id,
      url,
      title,
      isActive,
      isPinned,
      isFavorite,
      favicon,
    }))
  }

  private static getTabSection(tab: Pick<TabData, 'isPinned' | 'isFavorite'>): TabSection {
    if (tab.isFavorite) return 'icon'
    if (tab.isPinned) return 'space'
    return 'tab'
  }

  /**
   * 활성 탭 ID 반환
   */
  static getActiveTabId(): string | null {
    return this.activeTabId
  }

  /**
   * 탭 고정/해제 (Space 섹션에 표시)
   */
  static setPinned(tabId: string, pinned: boolean): void {
    const tab = this.tabs.get(tabId)
    if (!tab) {
      logger.warn('[ViewManager] Tab not found for pin', { tabId })
      return
    }

    tab.isPinned = pinned
    if (pinned) {
      tab.isFavorite = false
    }
    logger.info('[ViewManager] Tab pin status changed', { tabId, pinned })
    this.syncToRenderer()
  }

  /**
   * 탭 순서 변경 (드래그앤드롭)
   */
  static reorderTab(tabId: string, targetId: string): void {
    const allTabs = Array.from(this.tabs.entries())
    const fromIndex = allTabs.findIndex(([id]) => id === tabId)
    const toIndex = allTabs.findIndex(([id]) => id === targetId)

    if (fromIndex === -1 || toIndex === -1) {
      logger.warn('[ViewManager] Invalid tab IDs for reorder', { tabId, targetId })
      return
    }

    // Reorder array
    const [movedTab] = allTabs.splice(fromIndex, 1)
    allTabs.splice(toIndex, 0, movedTab)

    // Recreate Map with new order
    this.tabs.clear()
    allTabs.forEach(([id, data]) => {
      this.tabs.set(id, data)
    })

    logger.info('[ViewManager] Tab reordered', { tabId, targetId, fromIndex, toIndex })
    this.syncToRenderer()
  }

  /**
   * 같은 섹션 내에서 탭 순서 변경
   * 
   * @param tabId - 이동할 탭 ID
   * @param position - 새로운 위치 (0부터 시작)
   */
  static reorderTabWithinSection(tabId: string, position: number): void {
    const tab = this.tabs.get(tabId)
    if (!tab) {
      logger.warn('[ViewManager] Tab not found for reorder', { tabId })
      return
    }

    const section = this.getTabSection(tab)

    // 같은 섹션에 속하는 탭들만 필터링
    const sectionTabs = Array.from(this.tabs.entries()).filter(([_, data]) => {
      return this.getTabSection(data) === section
    })

    const currentIndex = sectionTabs.findIndex(([id]) => id === tabId)
    if (currentIndex === -1 || position < 0 || position >= sectionTabs.length) {
      logger.warn('[ViewManager] Invalid position for reorder', { tabId, position, sectionLength: sectionTabs.length })
      return
    }

    // 섹션 내에서 순서 변경
    const [movedEntry] = sectionTabs.splice(currentIndex, 1)
    sectionTabs.splice(position, 0, movedEntry)

    // 전체 탭 리스트 재구성 (icon/space/tab 3개 섹션 순서 유지)
    const allTabs = Array.from(this.tabs.entries())
    const newTabs: Array<[string, TabData]> = []

    const iconTabs = allTabs.filter(([_, data]) => this.getTabSection(data) === 'icon')
    const spaceTabs = allTabs.filter(([_, data]) => this.getTabSection(data) === 'space')
    const normalTabs = allTabs.filter(([_, data]) => this.getTabSection(data) === 'tab')

    const reorderedSectionTabs = sectionTabs

    switch (section) {
      case 'icon':
        newTabs.push(...reorderedSectionTabs)
        newTabs.push(...spaceTabs)
        newTabs.push(...normalTabs)
        break
      case 'space':
        newTabs.push(...iconTabs)
        newTabs.push(...reorderedSectionTabs)
        newTabs.push(...normalTabs)
        break
      case 'tab':
        newTabs.push(...iconTabs)
        newTabs.push(...spaceTabs)
        newTabs.push(...reorderedSectionTabs)
        break
    }

    this.tabs.clear()
    newTabs.forEach(([id, data]) => {
      this.tabs.set(id, data)
    })

    logger.info('[ViewManager] Tab reordered within section', { tabId, position, currentIndex })
    this.syncToRenderer()
  }

  /**
   * Icon 섹션의 앱 순서 변경 (고정 앱 순서)
   * 
   * @param fromIndex - 원본 인덱스
   * @param toIndex - 목표 인덱스
   */
  static reorderIcon(fromIndex: number, toIndex: number): void {
    // Icon 순서는 localStorage나 별도 설정에서 관리할 수 있음
    // 현재는 로깅만 수행
    logger.info('[ViewManager] Icon reordered', { fromIndex, toIndex })
    // TODO: 실제 Icon 순서 저장소 구현 필요
  }

  /**
   * 탭을 다른 섹션으로 이동 (Icon/Space/Tab)
   * 
   * @param tabId - 이동할 탭 ID
   * @param targetType - 목표 섹션 ('icon' | 'space' | 'tab')
   */
  static moveTabToSection(tabId: string, targetType: 'icon' | 'space' | 'tab'): void {
    const tab = this.tabs.get(tabId)
    if (!tab) {
      logger.warn('[ViewManager] Tab not found for move-section', { tabId })
      return
    }

    const previousType = this.getTabSection(tab)
    
    switch (targetType) {
      case 'icon':
        // Icon 섹션으로 이동 (즐겨찾기)
        tab.isFavorite = true
        tab.isPinned = false
        logger.info('[ViewManager] Tab moved to icon section', { tabId, previousType })
        break
      case 'space':
        // Space 섹션으로 이동 (핀된 탭)
        tab.isFavorite = false
        tab.isPinned = true
        logger.info('[ViewManager] Tab moved to space section', { tabId, previousType })
        break
      case 'tab':
        // Tab 섹션으로 이동 (일반 탭)
        tab.isFavorite = false
        tab.isPinned = false
        logger.info('[ViewManager] Tab moved to tab section', { tabId, previousType })
        break
    }

    this.syncToRenderer()
  }

  /**
   * 탭 복제 (같은 URL로 새 탭 생성)
   */
  static async duplicateTab(tabId: string): Promise<string> {
    const tab = this.tabs.get(tabId)
    if (!tab) {
      throw new Error('Tab not found')
    }

    const newTabId = await this.createTab(tab.url)
    logger.info('[ViewManager] Tab duplicated', { originalId: tabId, newId: newTabId })
    return newTabId
  }

  /**
   * 다른 탭 모두 닫기
   */
  static closeOtherTabs(keepTabId: string): void {
    const tabsToClose = Array.from(this.tabs.keys()).filter(id => id !== keepTabId)
    for (const tabId of tabsToClose) {
      this.closeTab(tabId)
    }
    logger.info('[ViewManager] Closed other tabs', { kept: keepTabId, closed: tabsToClose.length })
  }

  /**
   * 모든 탭 닫기 (최소 1개는 유지)
   */
  static closeAllTabs(): void {
    const allTabIds = Array.from(this.tabs.keys())
    
    // Close all tabs
    for (const tabId of allTabIds) {
      this.closeTab(tabId)
    }

    // Create one new tab if none remain
    if (this.tabs.size === 0) {
      void this.createTab('https://www.google.com')
    }
    
    logger.info('[ViewManager] Closed all tabs')
  }

  /**
   * 닫은 탭 복원 (가장 최근)
   */
  static async restoreClosedTab(): Promise<string | null> {
    if (this.recentlyClosed.length === 0) {
      logger.warn('[ViewManager] No recently closed tabs to restore')
      return null
    }

    const closedTab = this.recentlyClosed.pop()
    if (!closedTab) {
      return null
    }
    const newTabId = await this.createTab(closedTab.url)
    
    // Restore pinned status
    if (closedTab.isPinned) {
      this.setPinned(newTabId, true)
    }

    logger.info('[ViewManager] Restored closed tab', { url: closedTab.url, newId: newTabId })
    return newTabId
  }

  /**
   * Get recently closed tabs list
   */
  static getRecentlyClosed(): Array<{ id: string; url: string; title: string; timestamp: number; isPinned: boolean }> {
    return [...this.recentlyClosed]
  }

  /**
   * 현재 활성 탭에서 URL 이동
   * about: 스키마 처리 (React 컴포넌트로 렌더링)
   * 
   * ⚠️ 중요: loadURL()은 비동기이지만, 완료를 기다리지 않는다
   * did-finish-load / did-fail-load 이벤트로 결과를 감지해야 함
   */
  static async navigate(url: string): Promise<void> {
    if (!this.activeTabId) {
      logger.warn('[ViewManager] No active tab to navigate')
      return
    }

    const tabData = this.tabs.get(this.activeTabId)
    if (!tabData) {
      logger.warn('[ViewManager] Active tab not found')
      return
    }

    try {
      // about: 스키마 처리 (React 컴포넌트에서 렌더링)
      if (url.startsWith('about:')) {
        const aboutPage = url.replace('about:', '')
        
        // 지원하는 내부 페이지 목록
        switch (aboutPage) {
          case 'preferences':
          case 'settings':
            // about: 페이지는 React에서 처리하므로 URL만 업데이트
            tabData.url = url
            tabData.title = 'Settings'
            
            // ⭐ 핵심: Main의 WebView를 숨기기
            // Renderer에서 Settings를 렌더링할 때, Main의 WebView가 가려지지 않도록
            // WebView의 bounds를 0으로 설정하여 화면에서 제거
            tabData.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
            
            logger.info('[ViewManager] Navigating to settings page', { tabId: this.activeTabId })
            this.syncToRenderer()
            return
          
          default:
            logger.warn('[ViewManager] Unknown about page:', { page: aboutPage })
            return
        }
      }

      // 일반 URL 로드 (fire-and-forget)
      void tabData.view.webContents.loadURL(url).catch((err) => {
        logger.error('[ViewManager] loadURL error', { url, error: err })
      })
      
      tabData.url = url
      logger.info('[ViewManager] Navigate started', { url })
      this.syncToRenderer()
    } catch (error) {
      logger.error('[ViewManager] Navigate failed:', { error, url })
      throw error
    }
  }

  /**
   * 뒤로 가기
   */
  static goBack(): void {
    if (!this.activeTabId) return
    const tabData = this.tabs.get(this.activeTabId)
    if (tabData?.view.webContents.navigationHistory.canGoBack()) {
      tabData.view.webContents.navigationHistory.goBack()
      logger.info('[ViewManager] Go back', { tabId: this.activeTabId })
    }
  }

  /**
   * 앞으로 가기
   */
  static goForward(): void {
    if (!this.activeTabId) return
    const tabData = this.tabs.get(this.activeTabId)
    if (tabData?.view.webContents.navigationHistory.canGoForward()) {
      tabData.view.webContents.navigationHistory.goForward()
      logger.info('[ViewManager] Go forward', { tabId: this.activeTabId })
    }
  }

  /**
   * 새로고침
   */
  static reload(): void {
    if (!this.activeTabId) return
    const tabData = this.tabs.get(this.activeTabId)
    if (tabData) {
      tabData.view.webContents.reload()
      logger.info('[ViewManager] Reload', { tabId: this.activeTabId })
    }
  }

  /**
   * 모든 탭 정리 (앱 종료 시)
   */
  static destroy(): void {
    logger.info('[ViewManager] Destroying all tabs...')

    // 모든 탭 정리
    for (const [tabId] of this.tabs) {
      try {
        this.closeTab(tabId)
      } catch (error) {
        logger.error('[ViewManager] Error closing tab:', { tabId, error })
      }
    }

    this.tabs.clear()
    this.activeTabId = null
    this.contentWindow = null
    this.uiWebContents = null

    logger.info('[ViewManager] All tabs destroyed')
  }

  /**
   * 활성 탭의 WebContentsView 숨기기
   * Settings 페이지 표시 시 사용
   */
  static hideActiveView(): void {
    if (!this.activeTabId) return

    const tabData = this.tabs.get(this.activeTabId)
    if (tabData && this.contentWindow) {
      tabData.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
      logger.info('[ViewManager] Active view hidden', { tabId: this.activeTabId })
    }
  }

  /**
   * 활성 탭의 WebContentsView 다시 표시
   * Settings 페이지 닫을 시 사용
   */
  static showActiveView(): void {
    if (!this.activeTabId) return

    const tabData = this.tabs.get(this.activeTabId)
    if (tabData) {
      this.layout()
      logger.info('[ViewManager] Active view shown', { tabId: this.activeTabId })
    }
  }

  /**
   * 레이아웃 계산 및 적용
   *
   * React UI 영역 (TabBar + AddressBar)을 제외한 영역에 WebContentsView 배치
   */
  private static layout(): void {
    if (!this.contentWindow) return
    applyLayout({
      contentWindow: this.contentWindow,
      tabs: this.tabs,
      externalActiveBounds: this.externalActiveBounds,
      logger,
    })
  }

  /**
   * Renderer 프로세스에 탭 상태 동기화
   * 
   * tabs:updated 이벤트를 Main Window의 webContents로 전송
   */
  private static syncToRenderer(): void {
    if (!this.uiWebContents) return

    const state = {
      tabs: this.getTabs(),
      activeTabId: this.activeTabId,
    }

    try {
      this.uiWebContents.send('tabs:updated', state)
      logger.info('[ViewManager] Synced to renderer', { tabCount: state.tabs.length })
    } catch (error) {
      logger.error('[ViewManager] Failed to sync to renderer:', error)
    }
  }

  /**
   * 탭 이벤트 설정
   *
   * @param tabId - 탭 ID
   * @param view - WebContentsView 인스턴스
   */
  private static setupTabEvents(tabId: string, view: WebContentsView): void {
    attachTabEvents({
      tabId,
      view,
      getTabData: (id) => this.tabs.get(id),
      getUiWebContents: () => this.uiWebContents,
      syncToRenderer: () => this.syncToRenderer(),
      createTab: (url) => this.createTab(url),
      logger,
    })
  }

  /**
   * UI WebContents가 항상 최상위(마지막 인덱스)에 오도록 보장
   * - UI View의 배경이 투명(#00000000)하므로 Web Content를 가리지 않음
   * - UI 요소(헤더, 사이드바)만 Web Content 위에 overlay됨
   */
  /**
   * UI View를 최상단(Z-Order top)으로 이동
   */
  static ensureUITopmost(): void {
    if (!this.contentWindow || !this.uiWebContents) return
    ensureUITopmostImpl({
      contentWindow: this.contentWindow,
      uiWebContents: this.uiWebContents,
      lastReorderTarget: this.lastReorderTarget,
      setLastReorderTarget: (next) => {
        this.lastReorderTarget = next
      },
      logger,
    })
  }

  /**
   * Content View(웹탭)를 최상단으로 이동하여 클릭 가능하게 함
   */
  static ensureContentTopmost(): void {
    if (!this.contentWindow || !this.activeTabId) return
    ensureContentTopmostImpl({
      contentWindow: this.contentWindow,
      activeTabId: this.activeTabId,
      tabs: this.tabs,
      lastReorderTarget: this.lastReorderTarget,
      setLastReorderTarget: (next) => {
        this.lastReorderTarget = next
      },
      logger,
    })
  }

  private static dumpContentViewTree(reason: string): void {
    if (!this.contentWindow) return
    dumpContentViewTree({
      reason,
      contentWindow: this.contentWindow,
      uiWebContents: this.uiWebContents,
      logger,
    })
  }
}

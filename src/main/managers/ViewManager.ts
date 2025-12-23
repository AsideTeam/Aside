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

import { BrowserWindow, WebContentsView } from 'electron'
import { logger } from '@main/utils/Logger'
import { LAYOUT } from '@shared/constants/layout'

/**
 * 탭 데이터 모델
 */
interface TabData {
  id: string
  view: WebContentsView
  url: string
  title: string
  isActive: boolean
}

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
  private static mainWindow: BrowserWindow | null = null
  private static isInitializing = false

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
  static async initialize(window: BrowserWindow): Promise<void> {
    if (this.mainWindow) {
      logger.warn('[ViewManager] Already initialized. Skipping.')
      return
    }

    if (this.isInitializing) {
      throw new Error('[ViewManager] Initialization already in progress')
    }

    this.isInitializing = true

    try {
      logger.info('[ViewManager] Initializing...')

      this.mainWindow = window

      // 윈도우 리사이즈 시 레이아웃 재계산
      this.mainWindow.on('resize', () => {
        this.layout()
      })

      // Step 1: 기본 탭 생성 (홈페이지)
      const homeTabId = await this.createTab('https://www.google.com')
      logger.info('[ViewManager] Home tab created', { tabId: homeTabId })

      // Step 2: 레이아웃 계산 및 적용
      this.layout()
      logger.info('[ViewManager] Layout applied')

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
    if (!this.mainWindow) {
      throw new Error('[ViewManager] Not initialized. Call initialize() first.')
    }

    try {
      logger.info('[ViewManager] Creating new tab...', { url })

      // Step 1: WebContentsView 생성
      const view = new WebContentsView({
        webPreferences: {
          contextIsolation: true,
          sandbox: true,
        },
      })

      // Step 2: 고유 ID 생성
      const tabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

      // Step 3: 탭 데이터 저장
      const tabData: TabData = {
        id: tabId,
        view,
        url,
        title: 'New Tab',
        isActive: false,
      }

      this.tabs.set(tabId, tabData)

      // Step 4: MainWindow에 추가 (초기에는 숨김)
      // ⚠️ Electron 39: contentView는 게터 메서드로 변경됨
      this.mainWindow.getContentView().addChildView(view)
      view.setBounds({ x: 0, y: 0, width: 0, height: 0 })

      // Step 5: URL 로드
      await view.webContents.loadURL(url)

      // Step 6: 이벤트 리스너 설정
      this.setupTabEvents(tabId, view)

      logger.info('[ViewManager] Tab created', { tabId, url })

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
    this.layout()

    logger.info('[ViewManager] Tab switched', { tabId })
    
    // Renderer 동기화
    this.syncToRenderer()
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
      // WebContentsView 제거
      // ⚠️ Electron 39: contentView는 게터 메서드로 변경됨
      if (this.mainWindow) {
        this.mainWindow.getContentView().removeChildView(tabData.view)
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
    return Array.from(this.tabs.values()).map(({ id, url, title, isActive }) => ({
      id,
      url,
      title,
      isActive,
    }))
  }

  /**
   * 활성 탭 ID 반환
   */
  static getActiveTabId(): string | null {
    return this.activeTabId
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

      // 일반 URL 로드
      // ⚠️ loadURL()은 완료를 기다리지 않음 (fire-and-forget)
      // 결과는 did-finish-load / did-fail-load 이벤트로 감지
      const loadPromise = tabData.view.webContents.loadURL(url)
      
      // 최대 30초 타임아웃으로 대기
      await Promise.race([
        loadPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('loadURL timeout')), 30000)
        ),
      ])
      
      tabData.url = url
      logger.info('[ViewManager] URL loading started', { tabId: this.activeTabId, url })
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
    this.mainWindow = null

    logger.info('[ViewManager] All tabs destroyed')
  }

  /**
   * 활성 탭의 WebContentsView 숨기기
   * Settings 페이지 표시 시 사용
   */
  static hideActiveView(): void {
    if (!this.activeTabId) return

    const tabData = this.tabs.get(this.activeTabId)
    if (tabData && this.mainWindow) {
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
    if (!this.mainWindow) return

    const { width, height } = this.mainWindow.getBounds()
    
    // UI 영역 높이 (TabBar + AddressBar)
    const toolbarHeight = LAYOUT.TOOLBAR_HEIGHT
    
    // WebContentsView는 UI 아래에 배치
    const contentY = toolbarHeight
    const contentHeight = height - toolbarHeight

    for (const [, tabData] of this.tabs) {
      if (tabData.isActive) {
        // ⭐ about: 페이지는 WebView를 숨김 (React에서 렌더링됨)
        if (tabData.url.startsWith('about:')) {
          tabData.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
          logger.debug('[ViewManager] Layout: hiding WebView for about page', { url: tabData.url })
        } else {
          // 일반 웹페이지: 보이기
          tabData.view.setBounds({ 
            x: 0, 
            y: contentY, 
            width, 
            height: Math.max(0, contentHeight) 
          })
        }
      } else {
        tabData.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
      }
    }
  }

  /**
   * Renderer 프로세스에 탭 상태 동기화
   * 
   * tabs:updated 이벤트를 Main Window의 webContents로 전송
   */
  private static syncToRenderer(): void {
    if (!this.mainWindow) return

    const state = {
      tabs: this.getTabs(),
      activeTabId: this.activeTabId,
    }

    try {
      this.mainWindow.webContents.send('tabs:updated', state)
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
    // 타이틀 변경
    view.webContents.on('page-title-updated', (_event, title) => {
      const tabData = this.tabs.get(tabId)
      if (tabData) {
        tabData.title = title
        logger.info('[ViewManager] Tab title updated', { tabId, title })
        this.syncToRenderer()
      }
    })

    // URL 변경
    view.webContents.on('did-navigate', (_event, url) => {
      const tabData = this.tabs.get(tabId)
      if (tabData) {
        tabData.url = url
        logger.info('[ViewManager] Tab URL changed', { tabId, url })
        this.syncToRenderer()
      }
    })

    // In-page 네비게이션 (해시 변경 등)
    view.webContents.on('did-navigate-in-page', (_event, url) => {
      const tabData = this.tabs.get(tabId)
      if (tabData) {
        tabData.url = url
        this.syncToRenderer()
      }
    })

    logger.info('[ViewManager] Tab event listeners attached', { tabId })
  }
}

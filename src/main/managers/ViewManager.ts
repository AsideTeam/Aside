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
import { IPC_CHANNELS } from '@shared/ipc/channels'
import type { ViewBounds } from '@shared/types/view'
import { OverlayContentPointerEventSchema } from '@shared/validation/schemas'

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
  private static contentWindow: BrowserWindow | null = null
  private static uiWindow: BrowserWindow | null = null
  private static isInitializing = false
  private static externalActiveBounds: { x: number; y: number; width: number; height: number } | null = null

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
  static async initialize(contentWindow: BrowserWindow, uiWindow: BrowserWindow): Promise<void> {
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
      this.uiWindow = uiWindow

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

      // Step 4: ContentWindow에 추가 (초기에는 숨김)
      // ⚠️ Electron 39: contentView는 게터 메서드로 변경됨
      this.contentWindow.getContentView().addChildView(view)
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
      // WebContentsView 제거
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
    this.contentWindow = null
    this.uiWindow = null

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

    const { width, height } = this.contentWindow.getBounds()

    // Dual-window 오버레이 모드 기본: 전체를 꽉 채움 (UI는 다른 창에서 오버레이)
    const defaultBounds = {
      x: 0,
      y: 0,
      width,
      height: Math.max(0, height),
    }

    // Zen/Arc: Renderer에서 들어온 bounds가 있으면 그걸 우선
    const activeBounds = this.externalActiveBounds ?? defaultBounds

    logger.debug('[MAIN LAYOUT] Applying bounds:', {
      contentWindow: { w: width, h: height },
      externalBounds: this.externalActiveBounds,
      finalBounds: activeBounds,
      usingExternal: !!this.externalActiveBounds
    })

    for (const [, tabData] of this.tabs) {
      if (tabData.isActive) {
        // ⭐ about: 페이지는 WebView를 숨김 (React에서 렌더링됨)
        if (tabData.url.startsWith('about:')) {
          tabData.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
          logger.debug('[ViewManager] Layout: hiding WebView for about page', { url: tabData.url })
        } else {
          // 일반 웹페이지: 보이기
          tabData.view.setBounds(activeBounds)
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
    if (!this.uiWindow) return

    const state = {
      tabs: this.getTabs(),
      activeTabId: this.activeTabId,
    }

    try {
      this.uiWindow.webContents.send('tabs:updated', state)
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
    // WebView(content)에서 발생한 마우스 업/다운을 Renderer(UI overlay)로 브로드캐스트한다.
    // uiWindow가 Ghost일 때 Renderer가 mouseup을 못 받아 overlay open이 "붙는" 문제를 방지.
    view.webContents.on('before-input-event', (_event, input) => {
      try {
        if (!this.uiWindow) return
        if (input.type !== 'mouseDown' && input.type !== 'mouseUp') return

        const payload = OverlayContentPointerEventSchema.parse({
          kind: input.type,
          timestamp: Date.now(),
        })

        this.uiWindow.webContents.send(IPC_CHANNELS.OVERLAY.CONTENT_POINTER, payload)
      } catch {
        // ignore
      }
    })

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

        if (this.uiWindow && tabData.isActive) {
          this.uiWindow.webContents.send('view:navigated', {
            url,
            canGoBack: view.webContents.navigationHistory.canGoBack(),
            canGoForward: view.webContents.navigationHistory.canGoForward(),
            timestamp: Date.now(),
          })
        }
      }
    })

    // In-page 네비게이션 (해시 변경 등)
    view.webContents.on('did-navigate-in-page', (_event, url) => {
      const tabData = this.tabs.get(tabId)
      if (tabData) {
        tabData.url = url
        this.syncToRenderer()

        if (this.uiWindow && tabData.isActive) {
          this.uiWindow.webContents.send('view:navigated', {
            url,
            canGoBack: view.webContents.navigationHistory.canGoBack(),
            canGoForward: view.webContents.navigationHistory.canGoForward(),
            timestamp: Date.now(),
          })
        }
      }
    })

    // 로드 완료
    view.webContents.on('did-finish-load', () => {
      const tabData = this.tabs.get(tabId)
      if (!tabData) return

      if (this.uiWindow && tabData.isActive) {
        this.uiWindow.webContents.send('view:loaded', {
          url: view.webContents.getURL(),
          timestamp: Date.now(),
        })
      }
    })

    logger.info('[ViewManager] Tab event listeners attached', { tabId })
  }
}

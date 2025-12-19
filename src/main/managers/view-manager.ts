import { BrowserWindow, WebContentsView } from 'electron'
import { LAYOUT } from '@shared/constants/layout'
import { createLogger } from '@main/utils/logger'

const logger = createLogger('view-manager')

export interface ManagedTab {
  id: string
  view: WebContentsView
  title: string
  url: string
  favicon?: string
}

/**
 * ★ Core: WebContentsView(탭) 관리
 * 
 * 책임:
 * - 탭 생성/삭제/전환
 * - 웹뷰 좌표 계산 및 리사이징
 * - 네비게이션 상태 추적
 * 
 * 싱글톤 패턴 적용
 */
export class ViewManager {
  private static instance: ViewManager | null = null
  private tabs: Map<string, ManagedTab> = new Map()
  private activeTabId: string | null = null
  private currentSidebarWidth: number = LAYOUT.SIDEBAR_WIDTH_COLLAPSED
  private mainWindow: BrowserWindow | null = null

  private constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    logger.info('ViewManager initialized')
  }

  static initialize(mainWindow: BrowserWindow): void {
    if (!ViewManager.instance) {
      ViewManager.instance = new ViewManager(mainWindow)
    }
  }

  static getInstance(): ViewManager | null {
    return ViewManager.instance
  }

  /**
   * 탭 생성
   */
  createTab(tabId: string, url: string, title: string = 'New Tab'): ManagedTab {
    if (!this.mainWindow) throw new Error('Main window not initialized')

    // 새 WebContentsView 생성
    const view = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        javascript: true,
        sandbox: true
      }
    })

    // 탭 정보 저장
    const tab: ManagedTab = {
      id: tabId,
      view,
      title,
      url
    }

    this.tabs.set(tabId, tab)

    // 첫 탭이면 활성화
    if (!this.activeTabId) {
      this.switchTab(tabId)
    }

    // URL 로드
    view.webContents.loadURL(url).catch(err => {
      console.error(`Failed to load ${url}:`, err)
    })

    // 내비게이션 이벤트
    this.setupWebContentsHandlers(tabId, view)

    return tab
  }

  /**
   * 탭 닫기
   */
  closeTab(tabId: string): void {
    if (!this.mainWindow) return

    const tab = this.tabs.get(tabId)
    if (!tab) return

    // 활성 탭이면 다른 탭으로 전환
    if (this.activeTabId === tabId) {
      const tabs = Array.from(this.tabs.keys()).filter(id => id !== tabId)
      if (tabs.length > 0) {
        this.switchTab(tabs[0])
      } else {
        this.activeTabId = null
      }
    }

    // 웹뷰 제거
    this.mainWindow.contentView.removeChildView(tab.view)
    this.tabs.delete(tabId)
  }

  /**
   * 탭 전환
   */
  switchTab(tabId: string): void {
    if (!this.mainWindow) return

    const tab = this.tabs.get(tabId)
    if (!tab) return

    // 기존 활성 탭 제거
    if (this.activeTabId && this.activeTabId !== tabId) {
      const oldTab = this.tabs.get(this.activeTabId)
      if (oldTab) {
        this.mainWindow.contentView.removeChildView(oldTab.view)
      }
    }

    // 새 탭 추가
    this.activeTabId = tabId
    this.mainWindow.contentView.addChildView(tab.view, 1)
    this.updateWebViewBounds()

    // 웹뷰 포커스
    tab.view.webContents.focus()
  }

  /**
   * 사이드바 토글 (크기 변경)
   */
  toggleSidebar(expanded: boolean): void {
    const newWidth = expanded
      ? LAYOUT.SIDEBAR_WIDTH_EXPANDED
      : LAYOUT.SIDEBAR_WIDTH_COLLAPSED
    this.currentSidebarWidth = newWidth
    this.updateWebViewBounds()
  }

  /**
   * 웹뷰 좌표 재계산 및 적용
   */
  private updateWebViewBounds(): void {
    if (!this.mainWindow || !this.activeTabId) return

    const tab = this.tabs.get(this.activeTabId)
    if (!tab) return

    const bounds = this.mainWindow.getBounds()

    const x = this.currentSidebarWidth + LAYOUT.FRAME_PADDING
    const y = LAYOUT.FRAME_PADDING
    const width = bounds.width - this.currentSidebarWidth - LAYOUT.FRAME_PADDING * 2
    const height = bounds.height - LAYOUT.FRAME_PADDING * 2

    tab.view.setBounds({
      x,
      y,
      width: Math.max(width, 0),
      height: Math.max(height, 0)
    })
  }

  /**
   * 창 크기 변경 시 웹뷰 리사이징
   */
  onWindowResize(): void {
    this.updateWebViewBounds()
  }

  /**
   * WebContents 이벤트 핸들러 설정
   */
  private setupWebContentsHandlers(tabId: string, view: WebContentsView): void {
    // 제목 변경
    view.webContents.on('page-title-updated', (_event, title) => {
      const tab = this.tabs.get(tabId)
      if (tab) {
        tab.title = title
      }
    })

    // 페이비콘 변경 (간단한 구현)
    view.webContents.on('did-navigate', () => {
      const tab = this.tabs.get(tabId)
      if (tab) {
        tab.url = view.webContents.getURL()
      }
    })
  }

  /**
   * 활성 탭 정보 조회
   */
  getActiveTab(): ManagedTab | null {
    if (!this.activeTabId) return null
    return this.tabs.get(this.activeTabId) || null
  }

  /**
   * 모든 탭 조회
   */
  getAllTabs(): ManagedTab[] {
    return Array.from(this.tabs.values())
  }

  /**
   * 탭 정보 조회
   */
  getTab(tabId: string): ManagedTab | null {
    return this.tabs.get(tabId) || null
  }

  /**
   * 현재 활성 탭 ID
   */
  getActiveTabId(): string | null {
    return this.activeTabId
  }

  /**
   * 현재 사이드바 너비
   */
  getCurrentSidebarWidth(): number {
    return this.currentSidebarWidth
  }

  /**
   * 모든 리소스 정리 (Shutdown)
   */
  destroy(): void {
    logger.info('ViewManager destroying')
    for (const [tabId, tab] of this.tabs.entries()) {
      try {
        if (this.mainWindow) {
          this.mainWindow.contentView.removeChildView(tab.view)
        }
        logger.info(`Tab removed: ${tabId}`)
      } catch (error) {
        logger.error(`Error removing tab ${tabId}`, error)
      }
    }
    this.tabs.clear()
    this.activeTabId = null
    logger.info('ViewManager destroyed')
  }
}

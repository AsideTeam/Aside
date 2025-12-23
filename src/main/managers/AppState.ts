/**
 * Application State Manager
 *
 * 책임: 앱 수준의 상태 관리 (In-Memory)
 * - 트레이 모드 여부
 * - 창 최소화/최대화 상태
 * - 사용자 선호도 (테마, 레이아웃 등)
 *
 * 사용 예:
 *   import { AppState } from '@main/managers/AppState'
 *   AppState.setIsTrayMode(true)
 *   AppState.getIsTrayMode() // true
 *
 * 주의:
 * - 메모리만 사용 (영구 저장은 DB)
 * - 앱 재시작 시 기본값으로 리셋됨
 */

import { logger } from '@main/utils/Logger'

/**
 * 앱 상태 데이터 모델
 */
interface AppStateData {
  isTrayMode: boolean
  isWindowMinimized: boolean
  isWindowMaximized: boolean
  lastActiveTabId: string | null
}

/**
 * AppState 싱글톤
 */
export class AppState {
  private static state: AppStateData = {
    isTrayMode: false,
    isWindowMinimized: false,
    isWindowMaximized: false,
    lastActiveTabId: null,
  }

  /**
   * 트레이 모드 설정
   */
  static setIsTrayMode(value: boolean): void {
    this.state.isTrayMode = value
    logger.info('[AppState] Tray mode changed', { isTrayMode: value })
  }

  /**
   * 트레이 모드 여부 반환
   */
  static getIsTrayMode(): boolean {
    return this.state.isTrayMode
  }

  /**
   * 창 최소화 상태 설정
   */
  static setIsWindowMinimized(value: boolean): void {
    this.state.isWindowMinimized = value
    logger.info('[AppState] Window minimized state changed', { isWindowMinimized: value })
  }

  /**
   * 창 최소화 상태 반환
   */
  static getIsWindowMinimized(): boolean {
    return this.state.isWindowMinimized
  }

  /**
   * 창 최대화 상태 설정
   */
  static setIsWindowMaximized(value: boolean): void {
    this.state.isWindowMaximized = value
    logger.info('[AppState] Window maximized state changed', { isWindowMaximized: value })
  }

  /**
   * 창 최대화 상태 반환
   */
  static getIsWindowMaximized(): boolean {
    return this.state.isWindowMaximized
  }

  /**
   * 마지막 활성 탭 ID 설정
   */
  static setLastActiveTabId(tabId: string | null): void {
    this.state.lastActiveTabId = tabId
    logger.info('[AppState] Last active tab changed', { tabId })
  }

  /**
   * 마지막 활성 탭 ID 반환
   */
  static getLastActiveTabId(): string | null {
    return this.state.lastActiveTabId
  }

  /**
   * 전체 상태 반환 (디버깅용)
   */
  static getState(): AppStateData {
    return { ...this.state }
  }

  /**
   * 상태 리셋 (앱 시작 시)
   */
  static reset(): void {
    this.state = {
      isTrayMode: false,
      isWindowMinimized: false,
      isWindowMaximized: false,
      lastActiveTabId: null,
    }
    logger.info('[AppState] State reset')
  }
}

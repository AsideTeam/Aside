import { useAppStore } from '../store/appStore'
import { logIpcCall, logIpcError, logIpcResponse, logStateSync } from '../utils/logger'

/**
 * IPC 호출 래퍼 + 에러 처리 + 유효성 검사
 * 
 * 역할:
 * 1. Renderer 측 URL 유효성 검사 (빠른 피드백)
 * 2. IPC 호출 (Main으로 Zod 검증됨)
 * 3. Main 응답 처리 + 에러 처리
 * 4. Zustand 상태 업데이트
 */

export async function createTab(url: string): Promise<string> {
  try {
    // 기본 유효성 검사
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL: must be a non-empty string')
    }

    // 길이 제한 (DoS 방지)
    if (url.length > 2048) {
      throw new Error('URL too long (max 2048 characters)')
    }

    // Main 프로세스로 IPC 호출 (Zod 검증됨)
    logIpcCall('tab:create', { url })
    const response = await window.electronAPI?.tab?.create?.(url)

    if (!response) {
      throw new Error('No response from Main process')
    }

    if (!response.success) {
      logIpcError('tab:create', new Error(response.error || 'Failed to create tab'))
      throw new Error(response.error || 'Failed to create tab')
    }

    logIpcResponse('tab:create', response)
    return response.tabId || ''
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[IPC] Failed to create tab:', message)
    throw new Error(`Tab creation failed: ${message}`)
  }
}

export async function closeTab(tabId: string): Promise<void> {
  try {
    if (!tabId || typeof tabId !== 'string') {
      throw new Error('Invalid tab ID')
    }

    const response = await window.electronAPI?.tab?.close?.(tabId)

    if (!response) {
      throw new Error('No response from Main process')
    }

    if (!response.success) {
      throw new Error(response.error || 'Failed to close tab')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[IPC] Failed to close tab:', message)
    throw new Error(`Tab closure failed: ${message}`)
  }
}

export async function switchTab(tabId: string): Promise<void> {
  try {
    if (!tabId || typeof tabId !== 'string') {
      throw new Error('Invalid tab ID')
    }

    const response = await window.electronAPI?.tab?.switch?.(tabId)

    if (!response) {
      throw new Error('No response from Main process')
    }

    if (!response.success) {
      throw new Error(response.error || 'Failed to switch tab')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[IPC] Failed to switch tab:', message)
    throw new Error(`Tab switch failed: ${message}`)
  }
}

export async function getAppState() {
  try {
    const response = await window.electronAPI?.app?.getState?.()

    if (!response) {
      throw new Error('No response from Main process')
    }

    if (!response.success) {
      throw new Error(response.error || 'Failed to get app state')
    }

    return response.state || {}
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[IPC] Failed to get app state:', message)
    throw error
  }
}

/**
 * 현재 탭에서 URL 이동 (새 탭 생성 X)
 */
export async function navigate(url: string): Promise<void> {
  try {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL')
    }

    if (url.length > 2048) {
      throw new Error('URL too long')
    }

    logIpcCall('tab:navigate', { url })
    const response = await window.electronAPI?.tab?.navigate?.(url)

    if (!response) {
      throw new Error('No response from Main process')
    }

    if (!response.success) {
      throw new Error(response.error || 'Failed to navigate')
    }

    logIpcResponse('tab:navigate', response)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[IPC] Failed to navigate:', message)
    throw new Error(`Navigation failed: ${message}`)
  }
}

/**
 * 뒤로 가기
 */
export async function goBack(): Promise<void> {
  try {
    const response = await window.electronAPI?.tab?.back?.()
    if (!response?.success) {
      throw new Error(response?.error || 'Failed to go back')
    }
  } catch (error) {
    console.error('[IPC] Failed to go back:', error)
  }
}

/**
 * 앞으로 가기
 */
export async function goForward(): Promise<void> {
  try {
    const response = await window.electronAPI?.tab?.forward?.()
    if (!response?.success) {
      throw new Error(response?.error || 'Failed to go forward')
    }
  } catch (error) {
    console.error('[IPC] Failed to go forward:', error)
  }
}

/**
 * 새로고침
 */
export async function reload(): Promise<void> {
  try {
    const response = await window.electronAPI?.tab?.reload?.()
    if (!response?.success) {
      throw new Error(response?.error || 'Failed to reload')
    }
  } catch (error) {
    console.error('[IPC] Failed to reload:', error)
  }
}

/**
 * Renderer ↔ Main 상태 동기화
 * 
 * Main 프로세스에서 'store:update' 이벤트가 오면
 * Zustand 스토어를 업데이트함
 */
export function syncAppStore(data: unknown) {
  try {
    if (!data) return

    const { tabs, activeTabId } = data as { tabs?: unknown; activeTabId?: unknown }

    const updates = {
      tabs: Array.isArray(tabs) ? tabs : useAppStore.getState().tabs,
      activeTabId: typeof activeTabId === 'string' ? activeTabId : useAppStore.getState().activeTabId,
    }

    logStateSync(updates)
    useAppStore.setState(updates)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logIpcError('store:sync', new Error(message))
  }
}

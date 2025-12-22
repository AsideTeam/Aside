/**
 * Renderer 프로세스 초기화 스크립트
 * 
 * 역할:
 * 1. IPC 리스너 등록 (Main ↔ Renderer 통신)
 * 2. Zustand 스토어 초기화
 * 3. 에러 바운더리 설정
 * 4. 개발자 도구 진입점
 */

import { syncAppStore, getAppState } from '../lib/ipc-client'

/**
 * Renderer 초기화
 * 
 * 호출 시점: React 마운트 전
 * (main.tsx에서 ReactDOM.createRoot() 전)
 */
export async function initializeRenderer() {
  try {
    console.log('[Renderer] Initializing...')

    // 1. Main → Renderer 상태 동기화 리스너
    if (window.electronAPI?.on) {
      // NOTE: Main에서 실제로 emit하는 이벤트 채널과 맞춰야 동작함.
      // 현재는 안전한 훅만 걸어두고, 이벤트는 Phase 2B에서 Main에 추가.
      window.electronAPI.on('tabs:updated', (data: unknown) => {
        console.log('[Renderer] Received tabs:updated:', data)
        syncAppStore(data)
      })
    }

    // 2. Main 프로세스에서 현재 상태 요청
    const initialState = await getAppState()
    if (initialState) {
      syncAppStore(initialState)
    }

    // 3. 글로벌 에러 핸들러
    window.addEventListener('error', (event) => {
      console.error('[Renderer] Uncaught error:', event.error)
      // 에러 리포팅 (선택)
    })

    // 4. 처리되지 않은 Promise 거부 핸들러
    window.addEventListener('unhandledrejection', (event) => {
      console.error('[Renderer] Unhandled rejection:', event.reason)
      // 에러 리포팅 (선택)
    })

    console.log('[Renderer] Initialization complete')
  } catch (error) {
    console.error('[Renderer] Initialization failed:', error)
    throw error
  }
}

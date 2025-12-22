import React from 'react'
import { useAppStore } from '../../store/appStore'

/**
 * 콘텐츠 표시 영역
 * 
 * 주의: 실제 웹 콘텐츠는 여기에 렌더링되지 않습니다!
 * 
 * 이유:
 * - Main 프로세스의 WebContentsView가 BrowserWindow contentView에 직접 붙음
 * - React는 Renderer 프로세스에서만 실행됨
 * - 이 div는 플레이스홀더일 뿐
 * 
 * 흐름:
 * 1. Main이 tab:create IPC 호출을 수신
 * 2. ViewManager.createTab(url) → WebContentsView 생성 + BrowserWindow에 붙임
 * 3. Renderer에 'store:update' 이벤트 전송
 * 4. React가 탭 상태 업데이트 (이 컴포넌트는 상태만 표시)
 * 5. 실제 웹 콘텐츠는 Main 프로세스 WebContentsView에서 표시됨
 */
export function ContentArea() {
  const activeTabId = useAppStore((state) => state.activeTabId)
  const activeTab = useAppStore((state) =>
    state.tabs.find((t) => t.id === state.activeTabId)
  )

  return (
    <div className="content-area flex-1 bg-gray-950 overflow-hidden">
      {activeTabId && activeTab ? (
        <div className="h-full w-full flex flex-col items-center justify-center text-gray-500">
          <div className="text-center space-y-2">
            <p className="text-sm">Loading: {activeTab.url}</p>
            <p className="text-xs text-gray-600">Tab ID: {activeTabId}</p>
          </div>
        </div>
      ) : (
        <div className="h-full w-full flex items-center justify-center text-gray-600">
          <div className="text-center">
            <p className="text-lg font-medium">No tab open</p>
            <p className="text-sm text-gray-500 mt-2">Click the + button to create a new tab</p>
          </div>
        </div>
      )}
    </div>
  )
}

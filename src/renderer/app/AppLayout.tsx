import { useMemo, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { TabBar } from '../components/TabBar'
import { AddressBar } from '../components/AddressBar'
import { Settings } from '../components/Settings'

/**
 * 메인 레이아웃: 탭바 + 주소창 (크롬 스타일)
 * - 일반 웹사이트: 탭바 + 주소창 + WebContentsView
 * - about: 페이지: 전체 React 컴포넌트 (Settings 등)
 */
export function AppLayout() {
  const activeTabId = useAppStore((state) => state.activeTabId)
  const tabs = useAppStore((state) => state.tabs)

  // 활성 탭의 URL 확인
  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId),
    [tabs, activeTabId]
  )

  // about: 페이지인지 확인
  const isAboutPage = activeTab?.url.startsWith('about:') ?? false
  const aboutPage = isAboutPage && activeTab ? activeTab.url.replace('about:', '') : null

  // Settings 페이지 표시 여부
  const isSettingsPage = aboutPage === 'preferences' || aboutPage === 'settings'

  // Settings 열림/닫힘 상태를 Main Process에 알리기
  useEffect(() => {
    if (window.electronAPI?.invoke) {
      // Main Process에 Settings 상태 전달
      void window.electronAPI.invoke('view:settings-toggled', { isOpen: isSettingsPage })
    }
  }, [isSettingsPage])

  // Settings 페이지: 전체 화면 (TabBar + AddressBar + Settings 내용)
  if (isSettingsPage) {
    return (
      <div className="app-layout flex flex-col h-screen w-screen bg-[#202124]">
        {/* 탭바 (40px) */}
        <TabBar />

        {/* 주소창 (48px) */}
        <AddressBar />

        {/* Settings 콘텐츠 */}
        <div className="flex-1 overflow-hidden">
          <Settings />
        </div>
      </div>
    )
  }

  // 일반 웹페이지
  return (
    <div className="app-layout flex flex-col h-screen w-screen bg-[#202124]">
      {/* 탭바 (40px) */}
      <TabBar />

      {/* 주소창 (48px) */}
      <AddressBar />

      {/* WebContentsView 영역 (나머지 공간) */}
      <div className="flex-1 overflow-hidden" />
    </div>
  )
}

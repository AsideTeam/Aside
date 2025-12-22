import { useMemo } from 'react'
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
  const isAboutPage = activeTab?.url.startsWith('about:')
  const aboutPage = isAboutPage ? activeTab.url.replace('about:', '') : null

  // Settings 페이지 표시 여부
  const isSettingsPage = aboutPage === 'preferences' || aboutPage === 'settings'

  if (isSettingsPage) {
    return (
      <div className="app-layout flex flex-col h-screen w-screen bg-[#202124]">
        <Settings />
      </div>
    )
  }

  return (
    <div className="app-layout flex flex-col h-23 w-screen bg-[#202124]">
      {/* 탭바 (44px) - macOS 신호등 버튼 영역 확보 */}
      <TabBar />

      {/* 주소창 + 네비게이션 버튼 (48px) - Chrome 스타일 */}
      <AddressBar />
    </div>
  )
}

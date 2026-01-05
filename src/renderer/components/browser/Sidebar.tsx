/**
 * Sidebar Component - Arc Browser Style (V2)
 *
 * 개선된 구조:
 * 1. Favicon Bar (상단) - 사용자 추가 앱/웹사이트 파비콘
 * 2. Space Section - 고정 탭들 (앱 재시작 후에도 유지)
 * 3. Active Tabs Section - 현재 열려있는 탭들
 * 4. Footer - 다운로드 + 추가 옵션
 */

import React, { useLayoutEffect, useRef } from 'react'
import { Plus, Download } from 'lucide-react'
import { useOverlayStore } from '@renderer/lib/overlayStore'
import { cn } from '@renderer/styles'
import { useTabs } from '@renderer/hooks/useTabs'

import {
  PinnedAppsGrid,
  SectionHeader,
  PinnedTabItem,
  TabListItem,
  SidebarDivider,
} from './sidebar/index'

export const Sidebar: React.FC = () => {
  const { tabs, activeTabId, createTab, closeTab, switchTab } = useTabs()
  const isOpen = useOverlayStore((s) => s.sidebarOpen)
  const isLatched = useOverlayStore((s) => s.sidebarLatched)
  const headerOpen = useOverlayStore((s) => s.headerOpen)
  const headerLatched = useOverlayStore((s) => s.headerLatched)

  // Separate pinned (Space) vs normal (Active) tabs
  const pinnedTabs = tabs.filter((t) => {
    const tab = t as unknown as { isPinned?: boolean }
    return Boolean(tab.isPinned)
  })
  const normalTabs = tabs.filter((t) => {
    const tab = t as unknown as { isPinned?: boolean }
    return !tab.isPinned
  })

  const shouldPushDown = headerOpen || headerLatched
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Dynamic width measurement for overlay hover zones
  useLayoutEffect(() => {
    const measureAndSend = async () => {
      if (!sidebarRef.current) return

      const contentWidth = sidebarRef.current.offsetWidth
      const hitZoneWidth = 96
      const hoverWidth = isOpen || isLatched ? contentWidth : hitZoneWidth

      try {
        const payload = {
          sidebarRightPx: hoverWidth,
          dpr: window.devicePixelRatio,
          timestamp: Date.now(),
        }
        await window.electronAPI.invoke('overlay:update-hover-metrics', payload)
      } catch (error) {
        console.error('[Sidebar] Failed to send hover metrics:', error)
      }
    }

    void measureAndSend()
    const timers = [100, 300, 500].map((t) =>
      setTimeout(() => void measureAndSend(), t)
    )

    window.addEventListener('resize', measureAndSend)
    const heartbeat = setInterval(measureAndSend, 2000)

    return () => {
      window.removeEventListener('resize', measureAndSend)
      clearInterval(heartbeat)
      timers.forEach(clearTimeout)
    }
  }, [isOpen, isLatched])

  return (
    <aside
      ref={sidebarRef}
      style={{
        pointerEvents: isOpen || isLatched ? 'auto' : 'none',
        width: '288px',
        top: shouldPushDown ? '56px' : '0',
        height: shouldPushDown ? 'calc(100% - 56px)' : '100%',
      }}
      className={cn(
        'fixed left-0 z-9999',
        'w-72',
        'bg-[#0E0F11]',
        'border-r border-white/5',
        'text-gray-300 text-sm',
        'transition-all duration-300 ease-out',
        '-translate-x-full',
        (isOpen || isLatched) && 'translate-x-0',
        'drag-region select-none',
        'flex flex-col'
      )}
      data-overlay-zone="sidebar"
      data-interactive="true"
    >
      {/* 1. FAVICON BAR (최상단) */}
      <div className="sidebar-favicon-section">
        <PinnedAppsGrid
          onFaviconClick={(item: unknown) => {
            const fav = item as unknown as { url: string }
            createTab(fav.url)
          }}
        />
      </div>

      {/* Main scrollable content */}
      <div className="flex-1 overflow-y-auto no-scrollbar sidebar-scroll-area">
        
        {/* 2. SPACE SECTION (고정 탭) */}
        {pinnedTabs.length > 0 && (
          <section className="sidebar-space-section">
            <SectionHeader title="Space" />
            <div className="sidebar-space-items">
              {pinnedTabs.map((tab) => (
                <PinnedTabItem
                  key={tab.id}
                  id={tab.id}
                  title={tab.title || 'Untitled'}
                  type="bookmark"
                  isActive={tab.id === activeTabId}
                  onSelect={() => switchTab(tab.id)}
                  onDelete={() => closeTab(tab.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* 3. ACTIVE TABS SECTION */}
        <section className="sidebar-active-section">
          <SidebarDivider text="활성 탭" />

          {/* New Tab Button */}
          <button
            onClick={() => {
              createTab()
            }}
            className="sidebar-new-tab-btn"
          >
            <div className="sidebar-new-tab-icon">
              <Plus size={14} />
            </div>
            <span>새 탭</span>
          </button>

          {/* Active Tabs List */}
          <div className="sidebar-tabs-list">
            {normalTabs.length > 0 ? (
              normalTabs.map((tab) => (
                <TabListItem
                  key={tab.id}
                  id={tab.id}
                  title={tab.title || 'Untitled'}
                  isActive={tab.id === activeTabId}
                  onSelect={() => switchTab(tab.id)}
                  onClose={() => closeTab(tab.id)}
                />
              ))
            ) : (
              <div className="sidebar-empty-state">
                <p>열려 있는 탭이 없습니다</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 4. FOOTER */}
      <div className="sidebar-footer">
        <button
          className="sidebar-footer-btn"
          title="Downloads"
          onClick={() => console.log('[Sidebar] Downloads clicked')}
        >
          <Download size={18} />
        </button>
        <button
          className="sidebar-footer-btn sidebar-footer-btn--add"
          title="Add Space"
          onClick={() => console.log('[Sidebar] Add Space clicked')}
        >
          <Plus size={18} />
        </button>
      </div>
    </aside>
  )
}

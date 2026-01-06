/**
 * Sidebar Component - Arc Browser Style (V2)
 *
 * 개선된 구조:
 * 1. Favicon Bar (상단) - 사용자 추가 앱/웹사이트 파비콘
 * 2. Space Section - 고정 탭들 (앱 재시작 후에도 유지)
 * 3. Active Tabs Section - 현재 열려있는 탭들
 * 4. Footer - 다운로드 + 추가 옵션
 */

import React, { useRef } from 'react'
import { Plus, Download } from 'lucide-react'
import { useOverlayStore } from '@renderer/lib/overlayStore'
import { cn } from '@renderer/styles'
import { useTabs } from '@renderer/hooks'

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
  const pinnedTabs = tabs.filter((t: unknown) => {
    const tab = t as unknown as { isPinned?: boolean }
    return Boolean(tab.isPinned)
  })
  const normalTabs = tabs.filter((t: unknown) => {
    const tab = t as unknown as { isPinned?: boolean }
    return !tab.isPinned
  })

  const shouldPushDown = headerOpen || headerLatched
  const sidebarRef = useRef<HTMLDivElement>(null)



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
        'select-none', // Removed drag-region
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
              {pinnedTabs.map((tab: unknown) => (
                <PinnedTabItem
                  key={(tab as unknown as { id: string }).id}
                  id={(tab as unknown as { id: string }).id}
                  title={(tab as unknown as { title?: string }).title || 'Untitled'}
                  type="bookmark"
                  isActive={(tab as unknown as { id: string }).id === activeTabId}
                  onSelect={() => switchTab((tab as unknown as { id: string }).id)}
                  onDelete={() => closeTab((tab as unknown as { id: string }).id)}
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
              normalTabs.map((tab: unknown) => (
                <TabListItem
                  key={(tab as unknown as { id: string }).id}
                  id={(tab as unknown as { id: string }).id}
                  title={(tab as unknown as { title?: string }).title || 'Untitled'}
                  isActive={(tab as unknown as { id: string }).id === activeTabId}
                  onSelect={() => switchTab((tab as unknown as { id: string }).id)}
                  onClose={() => closeTab((tab as unknown as { id: string }).id)}
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

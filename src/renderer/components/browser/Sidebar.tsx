/**
 * Sidebar Component - Arc Browser Style
 *
 * 5-section layout:
 * 1. Pinned Apps Grid (2x3)
 * 2. Space / Pinned tabs section
 * 3. Tab List (scrollable main area)
 * 4. Mini Player (conditional)
 * 5. Footer Actions
 *
 * Dynamic width measurement & hover zone communication with Main Process
 */

import React, { useLayoutEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { useOverlayStore } from '@renderer/lib/overlayStore'
import { cn } from '@renderer/styles'
import { useTabs } from '@renderer/hooks/useTabs'

import {
  PinnedAppsGrid,
  SectionHeader,
  PinnedTabItem,
  TabListItem,
  SidebarDivider,
  MiniPlayer,
  SidebarFooter,
} from './sidebar/index'

export const Sidebar: React.FC = () => {
  const { tabs, activeTabId, createTab, closeTab, switchTab } = useTabs()
  const isOpen = useOverlayStore((s) => s.sidebarOpen)
  const isLatched = useOverlayStore((s) => s.sidebarLatched)
  const headerOpen = useOverlayStore((s) => s.headerOpen)
  const headerLatched = useOverlayStore((s) => s.headerLatched)

  // 미니 플레이어 상태 (나중에 실제 미디어 감지로 변경)
  const [showMiniPlayer] = useState(false)
  const [isMediaPlaying] = useState(false)

  // Push down if header is visible (floating or pinned)
  const shouldPushDown = headerOpen || headerLatched

  // Separate tabs
  const pinnedTabs = tabs.filter((t) => {
    const tab = t as unknown as { isPinned?: boolean }
    return Boolean(tab.isPinned)
  })
  const normalTabs = tabs

  const sidebarRef = useRef<HTMLDivElement>(null)

  // Dynamic sidebar width measurement for overlay hover zones
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
      {/* Main scrollable content area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-4">
        
        {/* 1. PINNED APPS GRID */}
        <section>
          <SectionHeader title="Apps" />
          <PinnedAppsGrid
            onAppClick={(app: unknown) => {
              const appData = app as unknown as { url: string }
              createTab(appData.url)
            }}
          />
        </section>

        {/* 2. SPACE / PINNED TABS SECTION (if any pinned tabs exist) */}
        {pinnedTabs.length > 0 && (
          <section className="space-y-2">
            <SectionHeader title="Space" />
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
          </section>
        )}

        {/* 3. ACTIVE TABS LIST SECTION */}
        <section className="space-y-3">
          <SidebarDivider text="활성 탭" />

          {/* New Tab Button */}
          <button
            onClick={() => {
              createTab()
            }}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg',
              'text-gray-400 hover:text-white',
              'hover:bg-white/5',
              'transition-colors group',
              'font-medium text-[13px]'
            )}
          >
            <div className={cn(
              'w-5 h-5 flex items-center justify-center rounded-md',
              'bg-white/5 group-hover:bg-white/10',
              'transition-colors'
            )}>
              <Plus size={14} />
            </div>
            <span>새 탭</span>
          </button>

          {/* Tab List Items */}
          <div className="space-y-1">
            {normalTabs.map((tab) => (
              <TabListItem
                key={tab.id}
                id={tab.id}
                title={tab.title || 'Untitled'}
                isActive={tab.id === activeTabId}
                onSelect={() => switchTab(tab.id)}
                onClose={() => closeTab(tab.id)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* 4. MINI PLAYER (Conditional) */}
      {showMiniPlayer && (
        <div className="px-3 py-3">
          <MiniPlayer
            isVisible={true}
            isPlaying={isMediaPlaying}
            title="호리미야 -piece-"
            artist="애니메이션"
            thumbnail=""
          />
        </div>
      )}

      {/* 5. SIDEBAR FOOTER */}
      <SidebarFooter
        onSettingsClick={() => {
          console.log('[Sidebar] Settings clicked')
        }}
        onDownloadsClick={() => {
          console.log('[Sidebar] Downloads clicked')
        }}
        onAddClick={() => {
          console.log('[Sidebar] Add Space clicked')
        }}
      />
    </aside>
  )
}

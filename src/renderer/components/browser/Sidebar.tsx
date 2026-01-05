/**
 * Sidebar Component - Aside Browser
 *
 * 미니멀한 사이드바
 * - 상단: 고정 탭 그리드
 * - 중간: 탭 목록
 * - 하단: 액션 버튼
 */

import React, { useState, useLayoutEffect, useRef } from 'react';
import {
  Plus,
  X,
  Download,
  FolderClosed,
  Globe,
  Settings,
} from 'lucide-react';
import { useOverlayStore } from '@renderer/lib/overlayStore'
import { cn } from '@renderer/styles'

interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isActive: boolean;
  isPinned?: boolean;
}

interface PinnedTab {
  id: string;
  title: string;
  url: string;
}

// 더미 데이터
const PINNED_TABS: PinnedTab[] = [
  { id: 'p1', title: 'GitHub', url: 'https://github.com' },
  { id: 'p2', title: 'ChatGPT', url: 'https://chat.openai.com' },
];

const INITIAL_TABS: Tab[] = [
  {
    id: '1',
    title: 'Google',
    url: 'https://google.com',
    isActive: true,
    isPinned: false,
  },
];

export const Sidebar: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>(INITIAL_TABS);
  const isOpen = useOverlayStore((s) => s.sidebarOpen)
  const isLatched = useOverlayStore((s) => s.sidebarLatched)

  const handleAddTab = () => {
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      title: 'New Tab',
      url: 'about:blank',
      isActive: true,
      isPinned: false,
    };
    setTabs((prev) => [
      ...prev.map((t) => ({ ...t, isActive: false })),
      newTab,
    ]);
  };

  const sidebarRef = useRef<HTMLDivElement>(null)

  // 🔍 Component mount/unmount tracking
  useLayoutEffect(() => {
    const instanceId = Math.random().toString(36).substring(7)
    console.log(`[Sidebar-${instanceId}] 🟢 MOUNTED`)
    return () => {
      console.log(`[Sidebar-${instanceId}] 🔴 UNMOUNTED`)
    }
  }, [])

  // ⭐ Dynamic sidebar width measurement  
  useLayoutEffect(() => {
    const measureAndSend = async () => {
      if (!sidebarRef.current) return
      
      const contentWidth = sidebarRef.current.offsetWidth
      const hitZoneWidth = 96 // w-24
      
      // Sidebar가 열려있거나 고정된 경우 전체 너비를 영역으로 사용, 닫힌 경우 핫존만 사용
      const hoverWidth = (isOpen || isLatched) ? contentWidth : hitZoneWidth

      // Send to Main process for hover zone calculation
      try {
        const payload = {
          sidebarRightPx: hoverWidth,
          dpr: window.devicePixelRatio,
          timestamp: Date.now(),
        }
        
        const response = await window.electronAPI.invoke('overlay:update-hover-metrics', payload) as { success: boolean; error?: string }
        
        if (!response.success) {
          console.error('[Sidebar] ❌ Main process rejected metrics:', response.error)
          return
        }
      } catch (error) {
        console.error('[Sidebar] ❌ Failed to send hover metrics:', error)
      }
    }
    // Call immediately
    void measureAndSend()
    // And after delays to ensure DOM/CSS is ready
    setTimeout(() => void measureAndSend(), 100)
    setTimeout(() => void measureAndSend(), 300)
    setTimeout(() => void measureAndSend(), 500)
    
    // Re-measure on window resize
    window.addEventListener('resize', measureAndSend)
    
    // Heartbeat: keep metrics fresh for Main process stale-guard
    const heartbeat = setInterval(measureAndSend, 2000)
    
    return () => {
      window.removeEventListener('resize', measureAndSend)
      clearInterval(heartbeat)
    }
  }, [isOpen, isLatched]) // ⚠️ Re-measure when state changes!

  const handleSelectTab = (tabId: string) => {
    setTabs((prev) =>
      prev.map((t) => ({ ...t, isActive: t.id === tabId }))
    );
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs((prev) => prev.filter((t) => t.id !== tabId));
  };

  return (
    <>
      {/* Sidebar overlay - Using Tailwind v4 */}
      <aside
        ref={sidebarRef}
        style={{ pointerEvents: (isOpen || isLatched) ? 'auto' : 'none' }}
        className={cn(
          // Base positioning and z-index
          'fixed top-0 left-0 h-full z-9999',
          'w-72', // Increased from w-64 (256px) to w-72 (288px) for better UX
          // Background and border
          'bg-linear-to-b from-gray-900 to-gray-800',
          'border-r border-white/10',
          // Text styling
          'text-white text-sm',
          // Transform animation(GPU accelerated)
          'transition-transform duration-300 ease-out',
          // Default: hidden to the left
          '-translate-x-full',
          // Open state: slide in
          isOpen && 'translate-x-0',
          // Pinned state: always visible
          isLatched && 'translate-x-0',
          // Draggable
          'drag-region select-none',
        )}
        data-overlay-zone="sidebar"
        data-interactive="true"
      >
      {/* Pinned Tabs */}
      <div className="aside-pinned-area">
        <div className="aside-pinned-grid">
          {PINNED_TABS.map((tab) => (
            <button
              key={tab.id}
              className="aside-pinned-tab"
              title={tab.title}
              type="button"
            >
              <Globe size={20} />
            </button>
          ))}
        </div>
      </div>

      {/* Space Label */}
      <div className="aside-space-header">
        <span className="aside-space-label">Aside</span>
      </div>

      {/* Tabs List */}
      <div className="aside-tabs-area">
        {tabs.map((tab) => {
          const tabClass = tab.isActive ? 'aside-tab aside-tab-active' : 'aside-tab'
          return (
            <div
              key={tab.id}
              className={tabClass}
              onClick={() => handleSelectTab(tab.id)}
              role="tab"
              aria-selected={tab.isActive}
            >
              <div className="aside-tab-icon">
                <Globe size={16} />
              </div>
              <span className="aside-tab-title">{tab.title}</span>
              <button
                type="button"
                className="aside-tab-close"
                onClick={(e) => handleCloseTab(tab.id, e)}
                aria-label="닫기"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}

        {/* Folder */}
        <div className="aside-folder" role="button" tabIndex={0}>
          <div className="aside-folder-icon">
            <FolderClosed size={16} />
          </div>
          <span className="aside-folder-title">New Folder</span>
        </div>
      </div>

      {/* Divider */}
      <div className="aside-divider">
        <span className="aside-divider-text">탭 정리</span>
      </div>

      {/* New Tab Button */}
      <button type="button" className="aside-new-tab" onClick={handleAddTab}>
        <Plus size={16} />
        <span className="aside-label">새 탭</span>
      </button>

      {/* Bottom Actions */}
      <div className="aside-bottom-actions">
        <button type="button" className="aside-action-btn" title="Downloads">
          <Download size={18} />
        </button>
        <div className="flex-1" />
        <button type="button" className="aside-action-btn" title="Settings">
          <Settings size={18} />
        </button>
      </div>
      </aside>
    </>
  );
};

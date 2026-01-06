/**
 * Sidebar Component - Redesigned Layout
 *
 * 4-Section Layout:
 * 1. Icon Section - Favicon grid (3x3, max 12)
 * 2. Space - Frequent tabs area
 * 3. Tab - Default new tabs list
 * 4. Footer - Download + Settings
 */

import React, { useRef } from 'react'
import { Plus, Download, Settings, MoreHorizontal, Globe, X } from 'lucide-react'
import { useOverlayStore } from '@renderer/lib/overlayStore'
import { cn } from '@renderer/styles'
import { useTabs } from '@renderer/hooks'
import { getFaviconUrl } from '@renderer/lib/faviconUtils'

// Sample icon data (will be dynamic later)
const ICON_APPS = [
  { id: 'gmail', name: 'Gmail', url: 'https://mail.google.com', icon: '📧' },
  { id: 'drive', name: 'Drive', url: 'https://drive.google.com', icon: '💿' },
  { id: 'chess', name: 'Chess', url: 'https://chess.com', icon: '♟️' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com', icon: '✨' },
  { id: 'github', name: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { id: 'youtube', name: 'YouTube', url: 'https://youtube.com', icon: '📺' },
]

export const Sidebar: React.FC = () => {
  const { tabs, activeTabId, createTab, closeTab, switchTab } = useTabs()
  const isOpen = useOverlayStore((s) => s.sidebarOpen)
  const isLatched = useOverlayStore((s) => s.sidebarLatched)
  const headerOpen = useOverlayStore((s) => s.headerOpen)
  const headerLatched = useOverlayStore((s) => s.headerLatched)

  // Separate pinned (Space) vs normal (Active) tabs
  const pinnedTabs = tabs.filter((t: unknown) => {
    const tab = t as { isPinned?: boolean }
    return Boolean(tab.isPinned)
  })
  const normalTabs = tabs.filter((t: unknown) => {
    const tab = t as { isPinned?: boolean }
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
        'select-none',
        'flex flex-col'
      )}
      data-overlay-zone="sidebar"
      data-interactive="true"
    >
      {/* 1. ICON SECTION */}
      <div className="sidebar-icon-section">
        <div className="sidebar-icon-grid">
          {ICON_APPS.map((app) => (
            <button
              key={app.id}
              className="sidebar-icon-item"
              onClick={() => void createTab(app.url)}
              title={app.name}
            >
              <img 
                src={getFaviconUrl(app.url)} 
                alt={app.name}
                className="w-8 h-8 object-contain rounded-md"
              />
            </button>
          ))}
        </div>
      </div>

      {/* 2. SPACE SECTION */}
      {pinnedTabs.length > 0 && (
        <div className="sidebar-space-section">
          <div className="sidebar-space-header">
            <span className="sidebar-space-title">Space</span>
            <button className="sidebar-space-menu">
              <MoreHorizontal size={14} />
            </button>
          </div>
          <div className="sidebar-space-list">
            {pinnedTabs.map((tab: unknown) => {
              const t = tab as { id: string; title?: string }
              const isActive = t.id === activeTabId
              return (
                <div
                  key={t.id}
                  className={cn(
                    'sidebar-space-item',
                    isActive && 'sidebar-space-item--active'
                  )}
                  onClick={() => void switchTab(t.id)}
                >
                  <div className="sidebar-space-icon">
                    <Globe size={16} />
                  </div>
                  <span className="sidebar-space-text">{t.title || 'Untitled'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. TAB SECTION */}
      <div className="sidebar-tab-section">
        {/* New Tab Button */}
        <button
          className="sidebar-new-tab"
          onClick={() => void createTab()}
        >
          <div className="sidebar-new-tab-icon">
            <Plus size={14} />
          </div>
          <span>New Tab</span>
        </button>

        <div className="sidebar-tab-divider" />

        {/* Tab List */}
        <div className="sidebar-tab-list">
          {normalTabs.map((tab: unknown) => {
            const t = tab as { id: string; title?: string; favicon?: string; url: string }
            const isActive = t.id === activeTabId
            return (
              <div
                key={t.id}
                className={cn(
                  'sidebar-tab-item',
                  isActive && 'sidebar-tab-item--active'
                )}
                onClick={() => void switchTab(t.id)}
              >
                <div className="sidebar-tab-left">
                  <div className="sidebar-tab-favicon">
                    <img 
                      src={getFaviconUrl(t.url, t.favicon)} 
                      alt="" 
                      className="w-3 h-3 object-contain rounded-sm"
                    />
                  </div>
                  <span className="sidebar-tab-title">{t.title || 'Loading...'}</span>
                </div>
                <button
                  className="sidebar-tab-close"
                  onClick={(e) => {
                    e.stopPropagation()
                    void closeTab(t.id)
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. FOOTER */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-left">
          <button className="sidebar-footer-btn" title="Settings">
            <Settings size={16} />
          </button>
        </div>
        <div className="sidebar-footer-right">
          <button className="sidebar-footer-btn" title="Downloads">
            <Download size={16} />
          </button>
          <button 
            className="sidebar-footer-btn" 
            title="New Tab"
            onClick={() => void createTab()}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

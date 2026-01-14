/**
 * ChromeLayout
 *
 * Chrome 브라우저 스타일 레이아웃
 * - 상단: Tab Strip + Toolbar (Address Bar, Nav)
 * - 하단: WebContentsView (투명 영역)
 *
 * 아키텍처:
 * BrowserWindow (frame: false)
 *   ├── React: Top Bar (pointer-events: auto)
 *   └── WebContentsView (Electron Native)
 */

import React, { useRef, useLayoutEffect, useEffect } from 'react'
import { Plus, X, RotateCw, ChevronLeft, ChevronRight, MoreVertical, Star, Shield } from 'lucide-react'
import { useTabs, useWebContents, useViewBounds, useWindowFocus, useWindowSize } from '@renderer/hooks'
import { cn } from '@renderer/styles'
import { AddressBar } from '../components/browser/AddressBar'
import { SettingsPage } from '@renderer/pages'
import { logger } from '@renderer/lib/logger'

// --- Constants ---
const TAB_STRIP_HEIGHT = 42
const TOOLBAR_HEIGHT = 46
const TOP_BAR_HEIGHT = TAB_STRIP_HEIGHT + TOOLBAR_HEIGHT

// --- Tab Component ---
const ChromeTab: React.FC<{
  title: string
  favicon?: string
  isActive: boolean
  onSelect: () => void
  onClose: () => void
}> = ({ title, favicon, isActive, onSelect, onClose }) => {
  return (
    <div
      onClick={onSelect}
      className={cn('chrome-tab', isActive && 'chrome-tab--active')}
      title={title}
    >
      {/* Favicon */}
      {favicon ? (
        <img src={favicon} alt="" className="chrome-tab__favicon" />
      ) : (
        <div className="chrome-tab__favicon bg-gray-500/30" />
      )}

      {/* Title */}
      <span className="chrome-tab__title">{title || 'New Tab'}</span>

      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="chrome-tab__close"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export const ChromeLayout: React.FC = () => {
  const { tabs, activeTabId, createTab, closeTab, switchTab } = useTabs()
  const web = useWebContents()
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const isWindowFocused = useWindowFocus()
  const { width: windowWidth } = useWindowSize()
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const lastHoverMetricsRef = React.useRef<{ headerBottomPx: number; sidebarRightPx: number; dpr: number } | null>(null)

  const topbarRef = useRef<HTMLDivElement | null>(null)
  const [topBarHeight, setTopBarHeight] = React.useState<number>(TOP_BAR_HEIGHT)

  const viewPlaceholderRef = useRef<HTMLDivElement>(null)
  const { updateBounds } = useViewBounds(viewPlaceholderRef)

  // Enable Overlay Mode (Transparent Background)
  useEffect(() => {
    document.documentElement.classList.add('aside-overlay-mode')
    return () => {
      document.documentElement.classList.remove('aside-overlay-mode')
    }
  }, [])

  // Report Hover Metrics (Critical for Click-Through)
  useLayoutEffect(() => {
    const measureTopbar = () => {
      const el = topbarRef.current
      if (!el) return TOP_BAR_HEIGHT
      return Math.max(0, Math.round(el.getBoundingClientRect().height))
    }

    const sendMetrics = async () => {
      try {
        const dpr = window.devicePixelRatio
        const measured = measureTopbar()
        if (measured !== topBarHeight) setTopBarHeight(measured)

        const next = { headerBottomPx: measured, sidebarRightPx: 0, dpr }
        const last = lastHoverMetricsRef.current
        if (last && last.headerBottomPx === next.headerBottomPx && last.sidebarRightPx === next.sidebarRightPx && last.dpr === next.dpr) return
        lastHoverMetricsRef.current = next
        const payload = {
          headerBottomPx: measured,
          sidebarRightPx: 0,
          dpr,
          timestamp: Date.now(),
        }
        await window.electronAPI.invoke('overlay:update-hover-metrics', payload)
      } catch (error) {
        logger.error('[ChromeLayout] Failed to send hover metrics', error)
      }
    }

    void sendMetrics()
    window.addEventListener('resize', sendMetrics)
    return () => window.removeEventListener('resize', sendMetrics)
  }, [windowWidth])

  // Update WebContentsView Bounds
  useLayoutEffect(() => {
    const measure = () => {
      updateBounds({ top: topBarHeight, left: 0 })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [topBarHeight, updateBounds])

  // Settings Toggle Logic
  useEffect(() => {
    const url = activeTab?.url ?? ''
    const shouldOpen = url === 'about:settings' || url === 'about:preferences'
    if (settingsOpen === shouldOpen) return
    setSettingsOpen(shouldOpen)
    void window.electronAPI?.invoke('view:settings-toggled', { isOpen: shouldOpen }).catch(() => {})
  }, [activeTab?.url, settingsOpen])

  const handleNavigate = async (url: string) => {
    await window.electronAPI?.invoke('tab:navigate', { url })
  }

  return (
    <div className={cn('chrome-layout', !isWindowFocused && 'chrome-layout--blurred')}>
      {/* ===== Top Bar (Interactive) ===== */}
      <div ref={topbarRef} className="chrome-topbar">
        {/* Tab Strip Row */}
        <div className="chrome-tabstrip">
          <div className="chrome-tabstrip__traffic-lights-spacer" />

          <div className="chrome-tabstrip__tabs">
            {tabs.map((tab) => (
              <ChromeTab
                key={tab.id}
                title={tab.title}
                favicon={tab.favicon}
                isActive={tab.id === activeTabId}
                onSelect={() => switchTab(tab.id)}
                onClose={() => closeTab(tab.id)}
              />
            ))}
            {/* New Tab Button - Inside Scroll Container for correct positioning */}
            <button className="chrome-newtab-btn" onClick={() => createTab()} title="New Tab">
               <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar Row */}
        <div className="chrome-toolbar">
          {/* Navigation */}
          <div className="chrome-toolbar__nav">
            <button
              className="chrome-toolbar__nav-btn"
              onClick={web.goBack}
              disabled={!web.canGoBack}
              title="Back"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="chrome-toolbar__nav-btn"
              onClick={web.goForward}
              disabled={!web.canGoForward}
              title="Forward"
            >
              <ChevronRight size={20} />
            </button>
            <button className="chrome-toolbar__nav-btn" onClick={web.reload} title="Reload">
              <RotateCw size={18} />
            </button>
          </div>

          {/* Omnibox (Address Bar) */}
          <div className="chrome-omnibox">
            <Shield size={14} className="chrome-omnibox__icon" />
            <AddressBar
              currentUrl={activeTab?.url}
              onNavigate={handleNavigate}
              wrapperClassName="flex-1"
              inputClassName="chrome-omnibox__input"
            />
            <button className="chrome-omnibox__star" title="Bookmark this page">
              <Star size={16} />
            </button>
          </div>

          {/* Actions */}
          <div className="chrome-toolbar__actions">
            <button
              className="chrome-toolbar__action-btn"
              onClick={() => setSettingsOpen(!settingsOpen)}
              title="Settings"
            >
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== Content Area (Click-Through) ===== */}
      <div className="chrome-content">
        <div ref={viewPlaceholderRef} className="chrome-content__placeholder" />

        {/* Settings Overlay */}
        {settingsOpen && (
          <div className="chrome-settings-overlay">
            <SettingsPage />
          </div>
        )}
      </div>
    </div>
  )
}

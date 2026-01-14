import React, { useLayoutEffect, useRef } from 'react'
import { Pin, PanelLeft, ChevronLeft, ChevronRight } from 'lucide-react'

import { AddressBar } from './AddressBar'
import { useOverlayStore } from '@renderer/lib/overlayStore'
import { useI18n, useTabs, useWebContents, useWindowSize } from '@renderer/hooks'
import { cn } from '@renderer/styles'
import { logger } from '@renderer/lib/logger'

export const AsideHeader: React.FC = () => {
  const { t } = useI18n()
  const isOpen = useOverlayStore((s) => s.headerOpen)
  const isHeaderLatched = useOverlayStore((s) => s.headerLatched)
  const isSidebarLatched = useOverlayStore((s) => s.sidebarLatched)
  const toggleHeaderLatch = useOverlayStore((s) => s.toggleHeaderLatch)
  const toggleSidebarLatch = useOverlayStore((s) => s.toggleSidebarLatch)

  const web = useWebContents()
  const { tabs, activeTabId } = useTabs()
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const { width: windowWidth } = useWindowSize()
  const headerRef = useRef<HTMLDivElement>(null)
  const lastHoverMetricsRef = useRef<{ headerBottomPx: number; dpr: number } | null>(null)

  const handleNavigate = async (url: string) => {
    await window.electronAPI?.invoke('tab:navigate', { url })
  }

  useLayoutEffect(() => {
    const measureAndSend = async () => {
      if (!headerRef.current) return
      try {
        const hoverHeight = Math.max(0, Math.round(headerRef.current.getBoundingClientRect().height))
        const dpr = window.devicePixelRatio
        const last = lastHoverMetricsRef.current
        if (last && last.headerBottomPx === hoverHeight && last.dpr === dpr) return
        lastHoverMetricsRef.current = { headerBottomPx: hoverHeight, dpr }
        const payload = {
          headerBottomPx: hoverHeight,
          dpr,
          timestamp: Date.now(),
        }
        await window.electronAPI.invoke('overlay:update-hover-metrics', payload)
      } catch (error) {
        logger.error('[AsideHeader] Failed to send hover metrics', error)
      }
    }

    void measureAndSend()
    setTimeout(() => void measureAndSend(), 100)
    window.addEventListener('resize', measureAndSend)
    return () => window.removeEventListener('resize', measureAndSend)
  }, [windowWidth])

  return (
    <div
      ref={headerRef}
      style={{
        pointerEvents: isOpen || isHeaderLatched ? 'auto' : 'none',
        left: isSidebarLatched ? 'var(--aside-sidebar-width)' : '0',
        width: isSidebarLatched ? 'calc(100% - var(--aside-sidebar-width))' : '100%',
        height: '52px',
      }}
      className={cn(
        'fixed top-0 z-10000',
        'transition-transform duration-200 ease-out',
        '-translate-y-full',
        (isOpen || isHeaderLatched) && 'translate-y-0',
        'bg-transparent'
      )}
      data-overlay-zone="header"
      data-interactive="true"
    >
      <div
        className={cn(
          'relative w-full h-full flex items-center justify-between',
          'bg-(--color-bg-secondary)/95 backdrop-blur-xl', // Fixed syntax
          'border-b border-(--color-border-primary)', // Fixed syntax
          'drag-region',
          'pr-6'
        )}
      >
        {/* LEFT GROUP: Traffic Spacer + Nav */}
        <div className="flex items-center h-full no-drag z-20">
          {/* Traffic Light Spacer - Fixed non-shrinkable area */}
          <div className="w-[85px] h-full shrink-0" />

          {/* Nav Buttons - Larger touch targets */}
          <div className="flex items-center gap-2">
            <button
              onClick={web.goBack}
              disabled={!web.canGoBack}
              className={cn(
                'w-8 h-8 flex items-center justify-center',
                'rounded-lg bg-transparent border-none',
                'text-(--color-text-secondary)',
                'hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)',
                'disabled:opacity-30 disabled:cursor-not-allowed',
                'transition-all duration-150 cursor-pointer'
              )}
              title={t('nav.back')}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={web.goForward}
              disabled={!web.canGoForward}
              className={cn(
                'w-8 h-8 flex items-center justify-center',
                'rounded-lg bg-transparent border-none',
                'text-(--color-text-secondary)',
                'hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)',
                'disabled:opacity-30 disabled:cursor-not-allowed',
                'transition-all duration-150 cursor-pointer'
              )}
              title={t('nav.forward')}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* CENTER GROUP: Address Bar (Absolute Centered) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-4 no-drag z-10">
          <div
            className={cn(
              'flex items-center w-full h-10 px-4',
              'bg-(--color-bg-tertiary) rounded-xl',
              'border border-transparent',
              'hover:border-(--color-border-light)',
              'focus-within:border-(--color-accent) focus-within:bg-(--color-bg-secondary)',
              'transition-all duration-200 shadow-sm'
            )}
          >
            <AddressBar
              currentUrl={activeTab?.url}
              onNavigate={handleNavigate}
              wrapperClassName="w-full"
              inputClassName={cn(
                'w-full h-full bg-transparent border-none',
                'text-sm text-(--color-text-primary) text-center',
                'placeholder:text-(--color-text-tertiary)',
                'focus:outline-none'
              )}
            />
          </div>
        </div>

        {/* RIGHT GROUP: Controls */}
        <div className="flex items-center gap-3 ml-3 no-drag z-20">
          <button
            onClick={toggleSidebarLatch}
            className={cn(
              'w-9 h-9 flex items-center justify-center',
              'rounded-lg border-none',
              'transition-all duration-150 cursor-pointer',
              isSidebarLatched
                ? 'bg-(--color-bg-active) text-(--color-text-primary)'
                : 'bg-transparent text-(--color-text-secondary) hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)'
            )}
            title={isSidebarLatched ? t('overlay.sidebarLatch.off') : t('overlay.sidebarLatch.on')}
          >
            <PanelLeft size={18} />
          </button>
          <button
            onClick={toggleHeaderLatch}
            className={cn(
              'w-9 h-9 flex items-center justify-center',
              'rounded-lg border-none',
              'transition-all duration-150 cursor-pointer',
              isHeaderLatched
                ? 'bg-(--color-bg-active) text-(--color-text-primary)'
                : 'bg-transparent text-(--color-text-secondary) hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)'
            )}
            title={isHeaderLatched ? t('overlay.headerLatch.off') : t('overlay.headerLatch.on')}
          >
            <Pin size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

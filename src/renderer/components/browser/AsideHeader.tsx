import React, { useLayoutEffect, useRef } from 'react'
import { Pin, PanelLeft, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'

import { AddressBar } from './AddressBar'
import { useOverlayStore } from '@renderer/lib/overlayStore'
import { useTabs, useWebContents, useWindowSize } from '@renderer/hooks'
import { cn } from '@renderer/styles'
import { logger } from '@renderer/lib/logger'

export const AsideHeader: React.FC = () => {
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

  const handleNavigate = async (url: string) => {
    await window.electronAPI?.invoke('tab:navigate', { url })
  }

  useLayoutEffect(() => {
    const measureAndSend = async () => {
      if (!headerRef.current) return

      const hoverHeight = 128

      try {
        const payload = {
          headerBottomPx: hoverHeight,
          dpr: window.devicePixelRatio,
          timestamp: Date.now(),
        }

        const response = (await window.electronAPI.invoke('overlay:update-hover-metrics', payload)) as {
          success: boolean
          error?: string
        }

        if (!response.success) {
          logger.warn('[AsideHeader] Main process rejected metrics', { error: response.error })
        }
      } catch (error) {
        logger.error('[AsideHeader] Failed to send hover metrics', error)
      }
    }

    void measureAndSend()
    setTimeout(() => void measureAndSend(), 100)
    setTimeout(() => void measureAndSend(), 300)
    setTimeout(() => void measureAndSend(), 500)

    window.addEventListener('resize', measureAndSend)
    const heartbeat = setInterval(measureAndSend, 2000)

    return () => {
      window.removeEventListener('resize', measureAndSend)
      clearInterval(heartbeat)
    }
  }, [windowWidth])

  return (
    <div
      ref={headerRef}
      style={{
        pointerEvents: isOpen || isHeaderLatched ? 'auto' : 'none',
        left: isSidebarLatched ? 'var(--aside-sidebar-width)' : '0',
        width: isSidebarLatched ? 'calc(100% - var(--aside-sidebar-width))' : '100%',
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
          'relative flex items-center gap-3',
          'h-14 px-3 pl-3',
          'border border-(--color-border-light) bg-(--color-bg-primary)',
          'backdrop-blur-xl',
          'shadow-lg shadow-black/10',
          'drag-region'
        )}
      >
        {/* Left: Navigation */}
        <div className="flex items-center gap-2 z-10 no-drag">
          <button
            className={cn(
              'flex items-center justify-center w-8 h-8',
              'rounded-lg border-none bg-transparent',
              'text-(--color-text-secondary) hover:bg-(--color-bg-tertiary)',
              'transition-all duration-150',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              'no-drag'
            )}
            style={{ pointerEvents: 'auto' }}
            onClick={web.goBack}
            disabled={!web.canGoBack}
            title="뒤로"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            className={cn(
              'flex items-center justify-center w-8 h-8',
              'rounded-lg border-none bg-transparent',
              'text-(--color-text-secondary) hover:bg-(--color-bg-tertiary)',
              'transition-all duration-150',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              'no-drag'
            )}
            style={{ pointerEvents: 'auto' }}
            onClick={web.goForward}
            disabled={!web.canGoForward}
            title="앞으로"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            className={cn(
              'flex items-center justify-center w-8 h-8',
              'rounded-lg border-none bg-transparent',
              'text-(--color-text-secondary) hover:bg-(--color-bg-tertiary)',
              'transition-all duration-150',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              'no-drag',
              web.isLoading && 'animate-spin'
            )}
            style={{ pointerEvents: 'auto' }}
            onClick={web.reload}
            disabled={web.isLoading}
            title="새로고침"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Address bar */}
        <div className="flex-1 flex justify-center items-center mx-3">
          <AddressBar
            currentUrl={activeTab?.url}
            onNavigate={handleNavigate}
            wrapperClassName="z-10 w-[40%]"
            inputClassName={cn(
              'w-full h-8 px-3',
              'border-none bg-transparent',
              'text-(--color-text-primary) text-sm text-center outline-none',
              'placeholder:text-(--color-text-muted)',
              'focus:bg-(--color-bg-tertiary)'
            )}
          />
        </div>

        {/* Right: Overlay controls */}
        <div className="flex items-center gap-3 z-10 no-drag">
          <button
            onClick={toggleSidebarLatch}
            className={cn(
              'flex items-center justify-center w-8 h-8',
              'rounded-lg border-none',
              'transition-all duration-150',
              'no-drag',
              isSidebarLatched
                ? 'bg-(--color-bg-tertiary) text-(--color-text-primary)'
                : 'bg-transparent text-(--color-text-secondary) hover:bg-(--color-bg-tertiary)'
            )}
            style={{ pointerEvents: 'auto' }}
            title={isSidebarLatched ? '사이드바 고정 해제 (Cmd/Ctrl+B)' : '사이드바 고정 (Cmd/Ctrl+B)'}
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <button
            onClick={toggleHeaderLatch}
            className={cn(
              'flex items-center justify-center w-8 h-8',
              'rounded-lg border-none',
              'transition-all duration-150',
              'no-drag',
              isHeaderLatched
                ? 'bg-(--color-bg-tertiary) text-(--color-text-primary)'
                : 'bg-transparent text-(--color-text-secondary) hover:bg-(--color-bg-tertiary)'
            )}
            style={{ pointerEvents: 'auto' }}
            title={isHeaderLatched ? '주소바 고정 해제 (Cmd/Ctrl+L)' : '주소바 고정 (Cmd/Ctrl+L)'}
          >
            <Pin className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}


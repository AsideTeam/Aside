import React, { useLayoutEffect, useRef } from 'react'
import { AddressBar } from './AddressBar'
import { Pin, PanelLeft, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'
import { useOverlayStore } from '@renderer/lib/overlayStore'
import { useWebContents, useWindowSize, useTabs } from '@renderer/hooks'
import { cn } from '@renderer/styles'

export const AsideHeader: React.FC = () => {
  const isOpen = useOverlayStore((s) => s.headerOpen)
  const isHeaderLatched = useOverlayStore((s) => s.headerLatched)
  const isSidebarLatched = useOverlayStore((s) => s.sidebarLatched)
  const toggleHeaderLatch = useOverlayStore((s) => s.toggleHeaderLatch)
  const toggleSidebarLatch = useOverlayStore((s) => s.toggleSidebarLatch)
  
  const web = useWebContents()
  const { tabs, activeTabId } = useTabs()
  const activeTab = tabs.find(t => t.id === activeTabId)
  const { width: windowWidth } = useWindowSize()
  const headerRef = useRef<HTMLDivElement>(null)

  // Navigate handler
  const handleNavigate = async (url: string) => {
    if (!activeTabId) return
    await window.electronAPI?.invoke('tab:navigate', { tabId: activeTabId, url })
  }



  // ⭐ Dynamic header height measurement
  useLayoutEffect(() => {
    const measureAndSend = async () => {
      if (!headerRef.current) {
        console.warn('[AsideHeader] headerRef.current is null!')
        return
      }
      
      const height = headerRef.current.offsetHeight
      console.log(`[AsideHeader] Measured height: ${height} (Threshold: 40)`)
      
      const hoverHeight = 128
      
      // Send to Main process for hover zone calculation
      try {
        const payload = {
          headerBottomPx: hoverHeight,
          dpr: window.devicePixelRatio,
          timestamp: Date.now(),
        }
        
        const response = await window.electronAPI.invoke('overlay:update-hover-metrics', payload) as { success: boolean; error?: string }
        
        if (!response.success) {
          console.error('[AsideHeader] ❌ Main process rejected metrics:', response.error)
          return
        }
      } catch (error) {
        console.error('[AsideHeader] ❌ Failed to send hover metrics:', error)
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
  }, [windowWidth])

  return (
    <>

      
      {/* Header overlay - Using Tailwind v4 with data attributes */}
      <div
        ref={headerRef}
        style={{ 
          pointerEvents: (isOpen || isHeaderLatched) ? 'auto' : 'none',
          left: isSidebarLatched ? 'var(--aside-sidebar-width)' : '0',
          width: isSidebarLatched ? 'calc(100% - var(--aside-sidebar-width))' : '100%',
        }}
        className={cn(
          // Base positioning and z-index - Header must be ABOVE Sidebar (9999)
          'fixed top-0 z-10000',
          // Transform animation (GPU accelerated)
          'transition-transform duration-200 ease-out',
          // Default: hidden above screen
          '-translate-y-full',
          // Open state: slide down
          isOpen && 'translate-y-0',
          // Pinned state: always visible
          isHeaderLatched && 'translate-y-0',
          // Header should also have backdrop and shadow
          'bg-transparent',
        )}
        data-overlay-zone="header"
        data-interactive="true"
      >
        <div className={cn(
          'relative flex items-center gap-3',
          'h-14 px-3 pl-3', // Increased from h-11 to h-14 for better UX
          'border border-white/10 bg-[rgb(3,7,18)]',
          'backdrop-blur-xl',
          'shadow-lg shadow-black/10',
          'drag-region' // ← Entire surface is draggable
        )}>
          {/* Native macOS traffic lights appear automatically on hover (customButtonsOnHover) */}

          {/* 1. Navigation buttons (left) */}
          <div className="flex items-center gap-2 z-10 no-drag">
            <button
              className={cn(
                'flex items-center justify-center w-8 h-8',
                'rounded-lg border-none bg-transparent',
                'text-white/70 hover:bg-white/10',
                'transition-all duration-150',
                'disabled:opacity-30 disabled:cursor-not-allowed',
                'no-drag' // ⚠️ Important for Electron interactivity
              )}
              style={{ pointerEvents: 'auto' }} // ⚠️ Ensure it's clickable
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
                'text-white/70 hover:bg-white/10',
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
                'text-white/70 hover:bg-white/10',
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

          {/* 2. Address bar (center) - Shrunk to 40% width */}
          <div className="flex-1 flex justify-center items-center mx-3">
            <AddressBar 
              currentUrl={activeTab?.url}
              onNavigate={handleNavigate}
              wrapperClassName="z-10 w-[40%]" 
              inputClassName={cn(
                'w-full h-8 px-3',
                'border-none bg-transparent',
                'text-white text-sm text-center outline-none',
                'placeholder:text-white/30',
                'focus:bg-white/5'
                // no-drag removed to allow window dragging via address bar
              )}
            />
          </div>

          {/* 3. Action buttons (right) */}
          <div className="flex items-center gap-3 z-10 no-drag">
            <button
              onClick={toggleSidebarLatch}
              className={cn(
                'flex items-center justify-center w-8 h-8',
                'rounded-lg border-none',
                'transition-all duration-150',
                'no-drag',
                isSidebarLatched 
                  ? 'bg-white/8 text-white' 
                  : 'bg-transparent text-white/70 hover:bg-white/10'
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
                  ? 'bg-white/8 text-white' 
                  : 'bg-transparent text-white/70 hover:bg-white/10'
              )}
              style={{ pointerEvents: 'auto' }}
              title={isHeaderLatched ? '주소바 고정 해제 (Cmd/Ctrl+L)' : '주소바 고정 (Cmd/Ctrl+L)'}
            >
              <Pin className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}


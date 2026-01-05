import React, { useLayoutEffect, useRef } from 'react'
import { AddressBar } from './AddressBar'
import { Pin, PanelLeft, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'
import { useOverlayStore } from '@renderer/lib/overlayStore'
import { useWebContents } from '@renderer/hooks'
import { cn } from '@renderer/styles'

export const AsideHeader: React.FC = () => {
  const isOpen = useOverlayStore((s) => s.headerOpen)
  const isHeaderLatched = useOverlayStore((s) => s.headerLatched)
  const isSidebarLatched = useOverlayStore((s) => s.sidebarLatched)
  const toggleHeaderLatch = useOverlayStore((s) => s.toggleHeaderLatch)
  const toggleSidebarLatch = useOverlayStore((s) => s.toggleSidebarLatch)
  
  const web = useWebContents()
  const headerRef = useRef<HTMLDivElement>(null)

  // 🔍 Component mount/unmount tracking
  useLayoutEffect(() => {
    const instanceId = Math.random().toString(36).substring(7)
    console.log(`[AsideHeader-${instanceId}] 🟢 MOUNTED`)
    return () => {
      console.log(`[AsideHeader-${instanceId}] 🔴 UNMOUNTED`)
    }
  }, [])

  // ⭐ Dynamic header height measurement
  useLayoutEffect(() => {
    const measureAndSend = async () => {
      if (!headerRef.current) {
        console.warn('[AsideHeader] headerRef.current is null!')
        return
      }
      
      const height = headerRef.current.offsetHeight
      console.log(`[AsideHeader] Measured height: ${height} (Threshold: 40)`)
      
      // ⚠️ 측정값이 유효하지 않거나 너무 작으면(HitZone 크기 등) 전송하지 않음
      // Header는 최소 56px이어야 함. 40px 미만은 무시.
      if (height < 40) {
        console.warn(`[AsideHeader] Height ${height}px is below threshold (40px), skipping update.`)
        return
      }
      
      // Send to Main process for hover zone calculation
      try {
        const payload = {
          headerBottomPx: height,
          dpr: window.devicePixelRatio,
          timestamp: Date.now(),
        }
        console.log('[AsideHeader] 📤 Sending payload:', JSON.stringify(payload))
        
        const response = await window.electronAPI.invoke('overlay:update-hover-metrics', payload) as { success: boolean; error?: string }
        
        if (!response.success) {
          console.error('[AsideHeader] ❌ Main process rejected metrics:', response.error)
          return
        }
        
        console.log('[AsideHeader] ✅ Sent metrics successfully:', { headerBottomPx: height })
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
    return () => window.removeEventListener('resize', measureAndSend)
  }, [])

  return (
    <>
      {/* Hit zone for hover detection - EXPANDED to 128px for much better UX */}
      <div
        className="fixed top-0 left-0 w-full h-32 z-9998 drag-region"
        style={{ pointerEvents: 'auto' }}
        data-overlay-zone="header"
        aria-hidden="true"
      />
      
      {/* Header overlay - Using Tailwind v4 with data attributes */}
      <div
        ref={headerRef}
        style={{ pointerEvents: (isOpen || isHeaderLatched) ? 'auto' : 'none' }}
        className={cn(
          // Base positioning and z-index
          'fixed top-0 left-0 w-full z-9999',
          // Transform animation (GPU accelerated)
          'transition-transform duration-200 ease-out',
          // Default: hidden above screen
          '-translate-y-full',
          // Open state: slide down
          isOpen && 'translate-y-0',
          // Pinned state: always visible
          isHeaderLatched && 'translate-y-0',
          // Adjust for sidebar when pinned
          isSidebarLatched && isHeaderLatched && 'left-(--size-sidebar-width)',
          isSidebarLatched && isHeaderLatched && 'w-[calc(100%-var(--size-sidebar-width))]',
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
          'drag-region' // Entire surface is draggable
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
                'disabled:opacity-30 disabled:cursor-not-allowed'
              )}
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
                'disabled:opacity-30 disabled:cursor-not-allowed'
              )}
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
                web.isLoading && 'animate-spin'
              )}
              onClick={web.reload}
              disabled={web.isLoading}
              title="새로고침"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* 2. Address bar (center) */}
          <AddressBar 
            wrapperClassName="flex-1 min-w-0 mx-3 z-10" 
            inputClassName={cn(
              'flex-1 min-w-0 w-full h-8 px-3',
              'border-none bg-transparent',
              'text-white text-sm text-center outline-none',
              'placeholder:text-white/30',
              'focus:bg-white/5',
              'no-drag'
            )}
          />

          {/* 3. Action buttons (right) */}
          <div className="flex items-center gap-3 z-10 no-drag">
            <button
              onClick={toggleSidebarLatch}
              className={cn(
                'flex items-center justify-center w-8 h-8',
                'rounded-lg border-none',
                'transition-all duration-150',
                isSidebarLatched 
                  ? 'bg-white/8 text-white' 
                  : 'bg-transparent text-white/70 hover:bg-white/10'
              )}
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
                isHeaderLatched 
                  ? 'bg-white/8 text-white' 
                  : 'bg-transparent text-white/70 hover:bg-white/10'
              )}
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


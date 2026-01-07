/**
 * ZenLayout
 *
 * Arc/Zen 브라우저 스타일 레이아웃
 * - 좌측 사이드바 (탭, 빠른 접근)
 * - 우측 WebContentsView 영역 (구멍 뚫린 자리)
 *
 * 아키텍처:
 * BrowserWindow (frame: false, vibrancy: sidebar)
 *   ├── React: Sidebar + ContentArea (div, 투명)
 *   └── WebContentsView (Electron Native, 자식 뷰)
 */

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from '../components/browser/Sidebar';
import { AsideHeader } from '../components/browser/AsideHeader';
import { cn, tokens } from '@renderer/styles';
import { useTabs, useViewBounds, useWindowFocus, useOverlayInteraction } from '@renderer/hooks';
import { useOverlayStore } from '@renderer/lib/overlayStore';
import { logger } from '@renderer/lib';
import { SettingsPage } from '@renderer/pages';

export const ZenLayout: React.FC = () => {
  // ⭐ 디버깅 로그 제거 (과도한 렌더링 로그 방지)
  // logger.info('[ZenLayout] Rendering component');

  const isFocused = useWindowFocus();
  const headerOpen = useOverlayStore((s) => s.headerOpen)
  const sidebarOpen = useOverlayStore((s) => s.sidebarOpen)
  const headerLatched = useOverlayStore((s) => s.headerLatched)
  const sidebarLatched = useOverlayStore((s) => s.sidebarLatched)

  const { tabs, activeTabId } = useTabs()
  const activeTab = useMemo(() => tabs.find((t) => t.id === activeTabId) ?? null, [tabs, activeTabId])

  const [settingsOpen, setSettingsOpen] = useState(false)
  const lastNormalUrlByTabIdRef = useRef<Record<string, string>>({})


  // ⭐ Pinned 상태에서 WebContentsView가 차지할 수 없는 safe-area(inset)를 측정한다.
  // width/height가 아니라 실제 경계(right/bottom)를 쓰면 transform/서브픽셀/보더로 인한 오차에 강하다.
  const [pinnedInsets, setPinnedInsets] = useState<{ left: number; top: number }>({
    left: 0,
    top: 0,
  })

  const viewPlaceholderRef = useRef<HTMLDivElement | null>(null)
  const { updateBounds } = useViewBounds(viewPlaceholderRef)

  useOverlayInteraction();

  useEffect(() => {
    document.documentElement.classList.add('aside-overlay-mode');
    return () => {
      document.documentElement.classList.remove('aside-overlay-mode');
    };
  }, [])

  // Track last non-about URL per tab so Settings can close back.
  useEffect(() => {
    if (!activeTabId || !activeTab?.url) return
    if (!activeTab.url.startsWith('about:')) {
      lastNormalUrlByTabIdRef.current[activeTabId] = activeTab.url
    }
  }, [activeTabId, activeTab?.url])

  // Settings visibility is driven by active tab URL.
  useEffect(() => {
    const url = activeTab?.url ?? ''
    const shouldOpen = url === 'about:settings' || url === 'about:preferences'
    if (settingsOpen === shouldOpen) return

    setSettingsOpen(shouldOpen)

    // Ask main to hide/show the active WebContentsView to prevent overlap.
    void window.electronAPI?.invoke('view:settings-toggled', { isOpen: shouldOpen }).catch(() => {
      // ignore
    })

    logger.info('[ZenLayout] Settings toggle', { shouldOpen, url })
  }, [activeTab?.url, settingsOpen])

  // 1. Inset calculation & Bounds Sync
  useLayoutEffect(() => {
    const measure = () => {
      // Pinned 상태일 때만 실제 Inset을 적용함 (Floating/Open일 때는 0)
      const left = sidebarLatched ? 288 : 0; // Sidebar w-72 = 288px
      const top = headerLatched ? 56 : 0;    // Header h-14 = 56px

      setPinnedInsets({ left, top });
      
      // Update native view bounds with explicit offsets
      updateBounds({ left, top });
    };

    measure();
    
    // Animation 완료 시점에 한 번 더 확실히 보정 (Transition이 300ms이므로 350ms 후)
    const timer = setTimeout(measure, 350); 
    
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      clearTimeout(timer);
    };
  }, [headerLatched, sidebarLatched, updateBounds]);

  return (
    <div
      className={cn(
        'aside-overlay',
        isFocused ? 'aside-window-focused' : 'aside-window-blurred',
        headerOpen ? 'aside-overlay--header-open' : '',
        sidebarOpen ? 'aside-overlay--sidebar-open' : '',
        headerLatched ? 'aside-overlay--header-pinned' : '',
        sidebarLatched ? 'aside-overlay--sidebar-pinned' : '',
        tokens.colors.text.primary,
      )}
      style={
        {
          '--aside-sidebar-width': `${pinnedInsets.left}px`,
          '--aside-header-height': `${pinnedInsets.top}px`,
          pointerEvents: 'none', // ⚠️ CRITICAL: Let clicks pass through root
        } as React.CSSProperties
      }
    >
      {/* WebContentsView 자리(placeholder). ⭐ 항상 전체 화면을 차지하며, Header/Sidebar가 위에 overlay됨 */}
      <div className={cn('aside-frame', 'no-drag')}>
        <div className="aside-view-container">
          <div ref={viewPlaceholderRef} className="aside-view-placeholder" />
        </div>
      </div>

      {/* Settings overlay (prevents webview overlap by hiding active view in main) */}
      {settingsOpen ? (
        <div
          className={cn(
            'fixed right-0 bottom-0',
            // Keep Sidebar(9999) + Header(10000) interactive/visible above.
            'z-9000',
            'pointer-events-auto',
            tokens.colors.bg.primary,
          )}
          style={
            {
              left: 'var(--aside-sidebar-width)',
              top: 'var(--aside-header-height)',
            } as React.CSSProperties
          }
        >
          <div className="w-full h-full overflow-hidden">
            <SettingsPage />
          </div>

          <button
            className={cn(
              'absolute top-3 right-3',
              'px-3 py-1.5 rounded-lg',
              'bg-white/5 hover:bg-white/10',
              'text-sm text-white/80',
              'no-drag'
            )}
            onClick={() => {
              const fallbackUrl = 'https://www.google.com'
              const lastUrl = (activeTabId && lastNormalUrlByTabIdRef.current[activeTabId]) || fallbackUrl
              void window.electronAPI?.invoke('tab:navigate', { url: lastUrl }).catch(() => {
                // ignore
              })
            }}
          >
            닫기
          </button>
        </div>
      ) : null}

      {/* DEV-only: sidebar와 WebContentsView placeholder 사이 실제 레이아웃 gap 측정 */}
      {import.meta.env.DEV ? (
        <GapProbe enabled={sidebarLatched} placeholderRef={viewPlaceholderRef} insetLeft={pinnedInsets.left} />
      ) : null}

      <AsideHeader />
      <Sidebar />
    </div>
  );
};

const GapProbe: React.FC<{
  enabled: boolean
  placeholderRef: React.RefObject<HTMLDivElement | null>
  insetLeft: number
}> = ({ enabled, placeholderRef, insetLeft }) => {
  const lastKeyRef = useRef<string>('')

  useLayoutEffect(() => {
    if (!enabled) return

    const sidebarEl = document.querySelector('[data-overlay-zone="sidebar"][data-interactive]') as HTMLElement | null
    const placeholderEl = placeholderRef.current
    if (!sidebarEl || !placeholderEl) return

    const raf = window.requestAnimationFrame(() => {
      const sidebarRect = sidebarEl.getBoundingClientRect()
      const placeholderRect = placeholderEl.getBoundingClientRect()

      const gap = Math.round(placeholderRect.left - sidebarRect.right)
      const key = `${Math.round(sidebarRect.right)}:${Math.round(placeholderRect.left)}:${gap}:${insetLeft}`
      if (key === lastKeyRef.current) return
      lastKeyRef.current = key

  logger.info('[📏 GAP]', {
    sidebarRight: Math.round(sidebarRect.right),
    placeholderLeft: Math.round(placeholderRect.left),
    gap,
    insetLeft,
  })


      const electronAPI = (window as unknown as { electronAPI?: { invoke?: (channel: string, ...args: unknown[]) => Promise<unknown> } }).electronAPI
      void electronAPI?.invoke?.('overlay:debug', {
        event: 'gap-measure',
        sidebarRight: Math.round(sidebarRect.right),
        placeholderLeft: Math.round(placeholderRect.left),
        gap,
        insetLeft,
      })
    })

    return () => window.cancelAnimationFrame(raf)
  }, [enabled, placeholderRef, insetLeft])

  return null
}

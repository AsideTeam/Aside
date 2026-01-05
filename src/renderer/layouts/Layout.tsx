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

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Sidebar } from '../components/browser/Sidebar';
import { AsideHeader } from '../components/browser/AsideHeader';
import { cn, tokens } from '@renderer/styles';
import { useViewBounds, useWindowFocus, useOverlayInteraction } from '@renderer/hooks';
import { useOverlayStore } from '@renderer/lib/overlayStore';
import { logger } from '@renderer/lib';

export const ZenLayout: React.FC = () => {
  // ⭐ 디버깅 로그 제거 (과도한 렌더링 로그 방지)
  // logger.info('[ZenLayout] Rendering component');

  const isFocused = useWindowFocus();
  const headerOpen = useOverlayStore((s) => s.headerOpen)
  const sidebarOpen = useOverlayStore((s) => s.sidebarOpen)
  const headerLatched = useOverlayStore((s) => s.headerLatched)
  const sidebarLatched = useOverlayStore((s) => s.sidebarLatched)


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

  // Pinned 상태에서 실제 UI 크기를 측정해 CSS 변수/Bounds 계산을 일치시킨다.
  // (하드코딩 값은 DPI/폰트/플랫폼에 따라 오차가 나서 잘림/과한 간격을 만든다)
  useLayoutEffect(() => {
    const measure = () => {
      // ⭐ data-interactive를 사용하여 hit zone이 아닌 실제 overlay 선택
      const sidebarEl = document.querySelector('[data-overlay-zone="sidebar"][data-interactive]') as HTMLElement | null
      const headerEl = document.querySelector('[data-overlay-zone="header"][data-interactive]') as HTMLElement | null

      // ⚠️ 핵심: open이 아닌 latched만 확인! 
      // open(hover)은 transform만 사용하므로 layout inset 불필요
      const shouldInsetSidebar = sidebarLatched
      const shouldInsetHeader = headerLatched

      // 애니메이션 중 rect.right/bottom은 프레임마다 바뀌므로, 최종 크기를 offset 기반으로 계산한다.
      const left = shouldInsetSidebar && sidebarEl ? Math.max(0, Math.round(sidebarEl.offsetWidth)) : 0
      const top = shouldInsetHeader && headerEl ? Math.max(0, Math.round(headerEl.offsetHeight)) : 0

      setPinnedInsets((prev) => {
        if (prev.left === left && prev.top === top) return prev
        return { left, top }
      })
    }

    // 첫 페인트 이후 측정 (CSS transition/폰트 적용 레이스 방지)
    const raf = window.requestAnimationFrame(measure)

    // 윈도우 리사이즈에도 재측정
    window.addEventListener('resize', measure)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [headerLatched, sidebarLatched]) // ⚠️ open 제거!

  // ⭐ 초기 마운트 시 bounds 계산 (디버깅 로그 제거)
  useEffect(() => {
    if (viewPlaceholderRef.current) {
      updateBounds()
    }
  }, []) // 빈 의존성 = 마운트 시 1회만 (updateBounds 의도적 제외)

  // ⭐ 단순화: pinned size 변경 시에만 bounds 재계산 (중복 제거)
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => updateBounds())
    return () => window.cancelAnimationFrame(raf)
  }, [
    pinnedInsets.left,
    pinnedInsets.top,
    headerLatched, // open 제거
    sidebarLatched, // open 제거
    updateBounds,
  ])

  useEffect(() => {
    const onResize = () => updateBounds()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [updateBounds])

  return (
    <div
      className={cn(
        'aside-overlay',
        'drag-region', // ⭐ 전체 창 드래그 가능 (CSS 클래스)
        isFocused ? 'aside-window-focused' : 'aside-window-blurred',
        headerOpen ? 'aside-overlay--header-open' : '',
        sidebarOpen ? 'aside-overlay--sidebar-open' : '',
        headerLatched ? 'aside-overlay--header-pinned' : '',
        sidebarLatched ? 'aside-overlay--sidebar-pinned' : '',
        tokens.colors.text.primary,
      )}
      style={
        {
          '--aside-sidebar-pinned-width': `${pinnedInsets.left}px`,
          '--aside-header-pinned-height': `${pinnedInsets.top}px`,
        } as React.CSSProperties
      }
    >
      {/* WebContentsView 자리(placeholder). ⭐ 항상 전체 화면을 차지하며, Header/Sidebar가 위에 overlay됨 */}
      <div className={cn('aside-frame', 'no-drag')}>
        <div className="aside-view-container">
          <div ref={viewPlaceholderRef} className="aside-view-placeholder" />
        </div>
      </div>

      {/* DEV-only: sidebar와 WebContentsView placeholder 사이 실제 레이아웃 gap 측정 */}
      {import.meta.env.DEV ? (
        <GapProbe enabled={sidebarLatched} placeholderRef={viewPlaceholderRef} insetLeft={pinnedInsets.left} />
      ) : null}

      {/* Hit-test zones (Ghost 모드에서 elementFromPoint로 감지) */}
      <div className="aside-hit-zone aside-hit-zone--sidebar" data-overlay-zone="sidebar" />

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

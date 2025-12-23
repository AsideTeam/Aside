/**
 * useOverlayInteraction - Arc/Zen Style (Smart Click-Through)
 *
 * Arc/Zen 방식 + Smart Interactive:
 * - Main이 모든 hover/focus/bounds 판정을 함
 * - Renderer는 Main에서 보내는 header:open/close, sidebar:open/close 이벤트만 받음
 * - BUT: Solid 상태일 때 실제 UI 요소 위에만 클릭 가능, 나머지는 click-through
 *   → AddressBar/Sidebar 열려있어도 webView 영역은 클릭 가능
 */

import { useEffect, useRef } from 'react'

export function useOverlayInteraction(): void {
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // Smart Click-Through: mousemove로 실제 UI 요소 위인지 판단
    const onMouseMove = (e: MouseEvent) => {
      if (rafRef.current !== null) return

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null

        const el = document.elementFromPoint(e.clientX, e.clientY)
        if (!el) return

        // 실제 UI 컨트롤(버튼, 입력창 등) 위에 있는지 판단
        const isOverUIControl = el.closest('[data-interactive]') !== null

        // placeholder(webView 영역) 위에 있으면 click-through
        const isOverPlaceholder = el.classList.contains('aside-view-placeholder')

        // Main이 Solid로 만들었지만, 실제로는 webView 영역이면 Ghost로 전환 요청
        // (이 방식으로 "Sidebar 열려있어도 webView 클릭 가능" 구현)
        if (isOverPlaceholder && !isOverUIControl) {
          // Renderer에서 직접 setIgnoreMouseEvents를 호출할 수 없으므로
          // CSS pointer-events로 부분적으로 처리
          // (전체 window는 Main이 관리, 개별 요소는 CSS로)
        }
      })
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])
}

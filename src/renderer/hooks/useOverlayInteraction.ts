/**
 * useOverlayInteraction - Arc/Zen Style (Simplified)
 *
 * Arc/Zen 방식:
 * - Main이 모든 hover/focus/bounds 판정을 함
 * - Renderer는 Main에서 보내는 header:open/close, sidebar:open/close 이벤트만 받음
 * - ignoreMouseEvents 상태에서는 mouseleave가 신뢰할 수 없으므로 사용 안 함
 * - 단순히 open/close 애니메이션만 처리
 */

import { useEffect } from 'react'

export function useOverlayInteraction(): void {
  useEffect(() => {
    // Arc 스타일: Renderer는 Main이 보내는 이벤트만 listen
    // header:open/close, sidebar:open/close 이벤트는 overlayStore에서 자동 처리됨
    // (src/renderer/lib/overlayStore.ts의 wireIpcOnce 참조)

    // focus가 false로 전환되면 Main이 자동으로 닫아주므로 별도 처리 불필요
    // Main의 global mouse tracking이 모든 hover-in/out을 처리

    // cleanup은 없음 (overlayStore에서 전역으로 관리)
    return () => {
      // Main에서 모든 상태를 관리하므로 cleanup 불필요
    }
  }, [])
}

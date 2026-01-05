/**
 * useOverlayInteraction - Arc/Zen Style (Simplified)
 *
 * Arc/Zen 방식:
 * - Main이 모든 hover/focus/bounds 판정을 함
 * - Renderer는 Main에서 보내는 header:open/close, sidebar:open/close 이벤트만 받음
 * - ignoreMouseEvents 상태에서는 mouseleave가 신뢰할 수 없으므로 사용 안 함
 * - 단순히 open/close 애니메이션만 처리
 */

import { useEffect, useRef } from 'react'
import { IPC_CHANNELS } from '@shared/ipc/channels'

export function useOverlayInteraction(): void {
  const lastSentRef = useRef<{ sidebarRightPx: number; headerBottomPx: number; titlebarHeightPx: number } | null>(
    null
  )
  const lastSentAtRef = useRef<number>(0)

  useEffect(() => {
    // Arc 스타일: Renderer는 Main이 보내는 이벤트만 listen
    // header:open/close, sidebar:open/close 이벤트는 overlayStore에서 자동 처리됨
    // (src/renderer/lib/overlayStore.ts의 wireIpcOnce 참조)

    // focus가 false로 전환되면 Main이 자동으로 닫아주므로 별도 처리 불필요
    // Main의 global mouse tracking이 모든 hover-in/out을 처리

    let stopped = false
    let forceUpdateRequested = false // ⭐ 강제 업데이트 플래그
    let timerId: number | null = null

    // ⭐ Zen 방식: window:resized 이벤트 리스너 추가 (즉시 metrics 재측정)
    const handleWindowResized = () => {
      forceUpdateRequested = true
    }

    try {
      window.electronAPI?.on('window:resized', handleWindowResized)
    } catch {
      // ignore
    }

    const measureAndSend = () => {
      if (stopped) return

      const now = Date.now()
      // ⭐ interval 기반이지만, 과도한 IPC를 막기 위해 최소 간격을 둔다
      const minIntervalMs = 50
      const shouldThrottle = !forceUpdateRequested && now - lastSentAtRef.current < minIntervalMs
      if (shouldThrottle) return
      forceUpdateRequested = false

      const sidebarEl = document.querySelector('.aside-sidebar') as HTMLElement | null
      const headerEl = document.querySelector('.aside-header') as HTMLElement | null
      const sidebarZoneEl = document.querySelector('.aside-hit-zone--sidebar') as HTMLElement | null
      const headerZoneEl = document.querySelector('.aside-hit-zone--header') as HTMLElement | null

      const sidebarRect = sidebarEl ? sidebarEl.getBoundingClientRect() : null
      const headerRect = headerEl ? headerEl.getBoundingClientRect() : null
      const sidebarZoneRect = sidebarZoneEl ? sidebarZoneEl.getBoundingClientRect() : null
      const headerZoneRect = headerZoneEl ? headerZoneEl.getBoundingClientRect() : null

      // 숨김(transform) 상태에서도 trigger가 살아있도록 hit-zone과 실제 UI rect를 합친다.
      // - Sidebar: open/pinned이면 sidebarRect.right가 커짐
      // - Header: hidden이면 headerRect.bottom이 음수가 될 수 있으므로 hit-zone bottom을 사용
      const sidebarRightPx = Math.max(0,
        sidebarRect ? sidebarRect.right : 0,
        sidebarZoneRect ? sidebarZoneRect.right : 0
      )
      const headerBottomPx = Math.max(0,
        headerRect ? headerRect.bottom : 0,
        headerZoneRect ? headerZoneRect.bottom : 0
      )

      // titlebar 실측(가능한 범위): 브라우저 viewport/클라이언트 높이 차이를 이용
      const titlebarHeightPx = Math.max(0, window.innerHeight - document.documentElement.clientHeight)

      const last = lastSentRef.current
      const changed =
        !last ||
        Math.abs(last.sidebarRightPx - sidebarRightPx) >= 0.5 ||
        Math.abs(last.headerBottomPx - headerBottomPx) >= 0.5 ||
        Math.abs(last.titlebarHeightPx - titlebarHeightPx) >= 0.5

      // 값이 동일해도 Main의 stale-guard를 통과하려면 timestamp 갱신이 필요
      const maxSilentMs = 250
      const needsHeartbeat = now - lastSentAtRef.current >= maxSilentMs

      if (changed || needsHeartbeat) {
        lastSentRef.current = { sidebarRightPx, headerBottomPx, titlebarHeightPx }
        lastSentAtRef.current = now

        void window.electronAPI
          .invoke(IPC_CHANNELS.OVERLAY.UPDATE_HOVER_METRICS, {
            sidebarRightPx,
            headerBottomPx,
            titlebarHeightPx,
            dpr: window.devicePixelRatio || 1,
            timestamp: now,
          })
          .catch(() => {
            // ignore
          })
      }
    }

    // rAF는 occlusion에서 1fps로 떨어질 수 있으므로 interval을 사용한다.
    timerId = window.setInterval(measureAndSend, 33) // ~30fps
    // 초기 1회는 즉시
    measureAndSend()

    return () => {
      stopped = true
      if (timerId !== null) window.clearInterval(timerId)
      // ⭐ cleanup: window:resized 리스너 제거
      try {
        window.electronAPI?.off?.('window:resized', handleWindowResized)
      } catch {
        // ignore
      }
    }
  }, [])
}

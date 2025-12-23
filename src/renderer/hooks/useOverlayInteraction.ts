/**
 * useOverlayInteraction
 *
 * Arc/Zen 스타일: "Ghost & Solid" 패턴
 * - 기본: Ghost (uiWindow는 click-through + forward mouse move)
 * - 마우스 아래 element hit-test로 interactive target이면 Solid로 전환
 * - focus 없으면 무조건 닫고 Ghost로 강제
 */

import { useEffect, useRef } from 'react'
import { useOverlayStore } from '@renderer/lib/overlayStore'
import { IPC_CHANNELS } from '@shared/ipc/channels'

type Zone = 'header' | 'sidebar' | null

const getZoneFromPoint = (x: number, y: number): Zone => {
  const el = document.elementFromPoint(x, y)
  const target = el?.closest?.('[data-overlay-zone]') as HTMLElement | null
  const zone = target?.getAttribute('data-overlay-zone')
  if (zone === 'header' || zone === 'sidebar') return zone
  return null
}

export function useOverlayInteraction(): void {
  const lastInteractiveRef = useRef<boolean>(false)
  const lastZoneRef = useRef<Zone>(null)
  const rafRef = useRef<number | null>(null)
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    // 기본값: Ghost 모드로 시작 (mousemove를 forward로 받기 위함)
    void window.electronAPI?.invoke(IPC_CHANNELS.OVERLAY.SET_INTERACTIVE, false)
    void window.electronAPI?.invoke(IPC_CHANNELS.OVERLAY.DEBUG, { event: 'hook-mounted' })

    const setInteractive = (interactive: boolean) => {
      if (lastInteractiveRef.current === interactive) return
      lastInteractiveRef.current = interactive
      void window.electronAPI?.invoke(IPC_CHANNELS.OVERLAY.SET_INTERACTIVE, interactive)
    }

    const closeAll = () => {
      const s = useOverlayStore.getState()
      if (s.headerOpen || s.sidebarOpen) {
        useOverlayStore.setState({ headerOpen: false, sidebarOpen: false })
      }
      setInteractive(false)
    }

    // 포커스가 false로 전환되면 즉시 닫고 Ghost로 강제 (mousemove 없이도)
    let unsubscribeFocus: (() => void) | null = null
    try {
      let prevFocused = useOverlayStore.getState().focused
      unsubscribeFocus = useOverlayStore.subscribe((state) => {
        if (prevFocused && !state.focused) closeAll()
        prevFocused = state.focused
      })
    } catch {
      // ignore
    }

    const onMouseMove = (e: MouseEvent) => {
      lastMouseRef.current = { x: e.clientX, y: e.clientY }

      // mousemove는 매우 자주 발생하니 rAF로 한번만 처리
      if (rafRef.current !== null) return

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null

        const { x, y } = lastMouseRef.current

        // 포커스가 없으면 무조건 닫기
        const stateNow = useOverlayStore.getState()
        if (!stateNow.focused) {
          closeAll()
          return
        }

        const zone = getZoneFromPoint(x, y)

        if (lastZoneRef.current !== zone) {
          lastZoneRef.current = zone
          const el = document.elementFromPoint(x, y) as HTMLElement | null
          void window.electronAPI?.invoke(IPC_CHANNELS.OVERLAY.DEBUG, {
            event: 'zone-changed',
            zone,
            focused: stateNow.focused,
            headerLatched: stateNow.headerLatched,
            sidebarLatched: stateNow.sidebarLatched,
            hit: el
              ? {
                  tag: el.tagName,
                  dataZone: el.getAttribute?.('data-overlay-zone') ?? null,
                  className: typeof el.className === 'string' ? el.className : null,
                }
              : null,
          })
        }

        const wantHeader = stateNow.headerLatched || zone === 'header'
        const wantSidebar = stateNow.sidebarLatched || zone === 'sidebar'

        // 열린 UI가 있으면 Solid, 아니면 Ghost
        const needsInteraction = wantHeader || wantSidebar

        if (stateNow.headerOpen !== wantHeader || stateNow.sidebarOpen !== wantSidebar) {
          useOverlayStore.setState({
            headerOpen: wantHeader,
            sidebarOpen: wantSidebar,
          })
        }

        setInteractive(needsInteraction)
      })
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      if (unsubscribeFocus) {
        try {
          unsubscribeFocus()
        } catch {
          // ignore
        }
      }
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      // cleanup은 항상 Ghost로
      useOverlayStore.setState({ headerOpen: false, sidebarOpen: false })
      void window.electronAPI?.invoke(IPC_CHANNELS.OVERLAY.SET_INTERACTIVE, false)
    }
  }, [])
}

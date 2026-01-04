import { create } from 'zustand'
import { z } from 'zod'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import { OverlayFocusChangedEventSchema, OverlayLatchChangedEventSchema } from '@shared/validation/schemas'

type OverlayState = {
  focused: boolean
  headerOpen: boolean
  sidebarOpen: boolean
  headerLatched: boolean
  sidebarLatched: boolean
  isDragging: boolean // ⭐ 드래그 중 상태 (레이아웃 계산 차단용)

  // actions
  toggleHeaderLatch: () => Promise<void>
  toggleSidebarLatch: () => Promise<void>
  setDragging: (dragging: boolean) => void
}

let wired = false
let wiringScheduled = false
const debugBeacon = {
  wired: false,
  firstHeaderOpen: false,
  firstHeaderClose: false,
} as const

const wireIpcOnce = (setState: (partial: Partial<OverlayState>) => void) => {
  if (wired) return

  const api = window.electronAPI
  if (!api || typeof api.on !== 'function') {
    if (wiringScheduled) return
    wiringScheduled = true
    window.setTimeout(() => {
      wiringScheduled = false
      wireIpcOnce(setState)
    }, 50)
    return
  }

  wired = true

  // One-time beacon so we can verify IPC wiring from the main process logs.
  if (!debugBeacon.wired) {
    try {
      void api.invoke(IPC_CHANNELS.OVERLAY.DEBUG, { event: 'renderer:overlayStore-wired', ts: Date.now() })
    } catch {
      // ignore
    }
    ;(debugBeacon as unknown as { wired: boolean }).wired = true
  }

  const safeOn = (channel: string, listener: (data?: unknown) => void) => {
    try {
      api.on(channel, listener)
    } catch {
      // ignore
    }
  }

  safeOn('window:focus-changed', (data) => {
    const parsed = OverlayFocusChangedEventSchema.safeParse(data)
    if (!parsed.success) return

    setState({ focused: parsed.data })
  })

  safeOn('header:open', () => {
    setState({ headerOpen: true })
    if (!debugBeacon.firstHeaderOpen) {
      try {
        void api.invoke(IPC_CHANNELS.OVERLAY.DEBUG, { event: 'renderer:header-open', ts: Date.now() })
      } catch {
        // ignore
      }
      ;(debugBeacon as unknown as { firstHeaderOpen: boolean }).firstHeaderOpen = true
    }
  })

  safeOn('header:close', () => {
    setState({ headerOpen: false })
    if (!debugBeacon.firstHeaderClose) {
      try {
        void api.invoke(IPC_CHANNELS.OVERLAY.DEBUG, { event: 'renderer:header-close', ts: Date.now() })
      } catch {
        // ignore
      }
      ;(debugBeacon as unknown as { firstHeaderClose: boolean }).firstHeaderClose = true
    }
  })
  safeOn('sidebar:open', () => setState({ sidebarOpen: true }))
  safeOn('sidebar:close', () => setState({ sidebarOpen: false }))

  safeOn('header:latch-changed', (data) => {
    const parsed = OverlayLatchChangedEventSchema.safeParse(data)
    if (!parsed.success) return
    setState({ headerLatched: parsed.data.latched })
  })

  safeOn('sidebar:latch-changed', (data) => {
    const parsed = OverlayLatchChangedEventSchema.safeParse(data)
    if (!parsed.success) return
    setState({ sidebarLatched: parsed.data.latched })
  })
}

export const useOverlayStore = create<OverlayState>((set) => {
  wireIpcOnce((partial) => set(partial))

  return {
    focused: true,
    headerOpen: false,
    sidebarOpen: false,
    headerLatched: false,
    sidebarLatched: false,
    isDragging: false,

    setDragging: (dragging: boolean) => {
      set({ isDragging: dragging })
    },

    toggleHeaderLatch: async () => {
      try {
        const result: unknown = await window.electronAPI.invoke(IPC_CHANNELS.OVERLAY.TOGGLE_HEADER_LATCH)
        const parsed = z
          .object({ success: z.boolean().optional(), latched: z.boolean().optional() })
          .safeParse(result)
        if (parsed.success && parsed.data.success) {
          set({ headerLatched: Boolean(parsed.data.latched) })
        }
      } catch {
        // ignore
      }
    },

    toggleSidebarLatch: async () => {
      try {
        const result: unknown = await window.electronAPI.invoke(IPC_CHANNELS.OVERLAY.TOGGLE_SIDEBAR_LATCH)
        const parsed = z
          .object({ success: z.boolean().optional(), latched: z.boolean().optional() })
          .safeParse(result)
        if (parsed.success && parsed.data.success) {
          set({ sidebarLatched: Boolean(parsed.data.latched) })
        }
      } catch {
        // ignore
      }
    },
  }
})

export const selectOverlayFocus = (s: OverlayState) => s.focused

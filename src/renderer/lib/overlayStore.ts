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

  // actions
  toggleHeaderLatch: () => Promise<void>
  toggleSidebarLatch: () => Promise<void>
}

let wired = false

const wireIpcOnce = (setState: (partial: Partial<OverlayState>) => void) => {
  if (wired) return
  wired = true

  const safeOn = (channel: string, listener: (data?: unknown) => void) => {
    try {
      window.electronAPI?.on(channel, listener)
    } catch {
      // ignore
    }
  }

  safeOn('window:focus-changed', (data) => {
    const parsed = OverlayFocusChangedEventSchema.safeParse(data)
    if (!parsed.success) return

    setState({ focused: parsed.data })
  })

  safeOn('header:open', () => setState({ headerOpen: true }))
  safeOn('header:close', () => setState({ headerOpen: false }))
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

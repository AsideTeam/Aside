import { createStore } from 'zustand/vanilla'

export type MainOverlayState = {
  focused: boolean
  headerOpen: boolean
  sidebarOpen: boolean
  headerLatched: boolean
  sidebarLatched: boolean
  isDragging: boolean // ⭐ 드래그 중 상태 (레이아웃 계산 차단용)
}

export type MainOverlayActions = {
  setFocused: (focused: boolean) => void
  setHeaderOpen: (open: boolean) => void
  setSidebarOpen: (open: boolean) => void
  setHeaderLatched: (latched: boolean) => void
  setSidebarLatched: (latched: boolean) => void
  setDragging: (dragging: boolean) => void

  toggleHeaderLatched: () => boolean
  toggleSidebarLatched: () => boolean

  resetOpen: () => void
}

export type MainOverlayStore = MainOverlayState & MainOverlayActions

const initialState: MainOverlayState = {
  focused: true,
  headerOpen: false,
  sidebarOpen: false,
  headerLatched: false,
  sidebarLatched: false,
  isDragging: false,
}

export const overlayStore = createStore<MainOverlayStore>((set, get) => ({
  ...initialState,

  setFocused: (focused) => set({ focused }),
  setHeaderOpen: (open) => set({ headerOpen: open }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setHeaderLatched: (latched) => set({ headerLatched: latched }),
  setSidebarLatched: (latched) => set({ sidebarLatched: latched }),
  setDragging: (dragging) => set({ isDragging: dragging }),

  toggleHeaderLatched: () => {
    const next = !get().headerLatched
    set({ headerLatched: next })
    return next
  },

  toggleSidebarLatched: () => {
    const next = !get().sidebarLatched
    set({ sidebarLatched: next })
    return next
  },

  resetOpen: () => set({ headerOpen: false, sidebarOpen: false }),
}))

export const getMainOverlayState = (): MainOverlayState => {
  const { focused, headerOpen, sidebarOpen, headerLatched, sidebarLatched } = overlayStore.getState()
  return { focused, headerOpen, sidebarOpen, headerLatched, sidebarLatched }
}

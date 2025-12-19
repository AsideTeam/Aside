import { create } from 'zustand'
import type { TabInfo } from '@shared/types/models'

export interface TabStore {
  tabs: TabInfo[]
  activeTabId: string | null
  setTabs: (tabs: TabInfo[]) => void
  setActiveTab: (tabId: string) => void
  addTab: (tab: TabInfo) => void
  removeTab: (tabId: string) => void
}

export const useTabStore = create<TabStore>((set) => ({
  tabs: [],
  activeTabId: null,
  setTabs: (tabs) => set({ tabs }),
  setActiveTab: (tabId) => set({ activeTabId: tabId }),
  addTab: (tab) => set((state) => ({ tabs: [...state.tabs, tab] })),
  removeTab: (tabId) =>
    set((state) => ({
      tabs: state.tabs.filter((t) => t.id !== tabId),
      activeTabId:
        state.activeTabId === tabId
          ? state.tabs[0]?.id ?? null
          : state.activeTabId,
    })),
}))

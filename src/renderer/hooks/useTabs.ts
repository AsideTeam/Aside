import { useState, useEffect, useCallback } from 'react'
import { IPC_CHANNELS } from '@shared/ipc/channels'

export interface Tab {
  id: string
  title: string
  url: string
  isActive: boolean
  isPinned?: boolean
  favicon?: string
}


export function useTabs() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  const fetchTabs = useCallback(async () => {
    if (!window.electronAPI) return
    try {
      // TabHandler returns { success: boolean, tabs: Tab[] }
      const result = await window.electronAPI.invoke(IPC_CHANNELS.TAB.LIST) as { success: boolean; tabs: Tab[] }
      
      if (result && Array.isArray(result.tabs)) {
        setTabs(result.tabs)
        const active = result.tabs.find(t => t.isActive)
        setActiveTabId(active ? active.id : null)
      } else {
        console.warn('[useTabs] Invalid tab list response:', result)
        setTabs([])
      }
    } catch (err) {
      console.error('[useTabs] Failed to fetch tabs', err)
      setTabs([])
    }
  }, [])

  useEffect(() => {
    void fetchTabs()

    if (!window.electronAPI) return

    // IPC event receiver
    const handleTabsUpdated = (data: unknown) => {
      // Data from ViewManager.syncToRenderer is { tabs: Tab[], activeTabId: string | null }
      const payload = data as { tabs: Tab[]; activeTabId: string | null }
      
      if (payload && Array.isArray(payload.tabs)) {
        setTabs(payload.tabs)
        setActiveTabId(payload.activeTabId)
      } else {
        console.warn('[useTabs] Received invalid tabs update:', data)
      }
    }

    window.electronAPI.on(IPC_CHANNELS.TAB.UPDATED, handleTabsUpdated)

    return () => {
      window.electronAPI.off(IPC_CHANNELS.TAB.UPDATED, handleTabsUpdated)
    }
  }, [fetchTabs])

  const createTab = async (url?: string) => {
    const targetUrl = url || 'https://www.google.com'
    await window.electronAPI?.invoke(IPC_CHANNELS.TAB.CREATE, { url: targetUrl })
  }

  const closeTab = async (tabId: string) => {
    await window.electronAPI?.invoke(IPC_CHANNELS.TAB.CLOSE, { tabId })
  }

  const switchTab = async (tabId: string) => {
    await window.electronAPI?.invoke(IPC_CHANNELS.TAB.SWITCH, { tabId })
  }

  return {
    tabs,
    activeTabId,
    createTab: (url?: string) => void createTab(url),
    closeTab: (tabId: string) => void closeTab(tabId),
    switchTab: (tabId: string) => void switchTab(tabId),
    refresh: () => void fetchTabs()
  }
}

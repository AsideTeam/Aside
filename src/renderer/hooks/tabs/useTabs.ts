import { useState, useEffect, useCallback, useRef } from 'react'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import { logger } from '@renderer/lib/logger'
import { useAppSettings } from '../settings/useAppSettings'

export interface Tab {
  id: string
  title: string
  url: string
  isActive: boolean
  isPinned?: boolean
  isFavorite?: boolean
  favicon?: string
}

function areTabsEqual(a: Tab[], b: Tab[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const ta = a[i]
    const tb = b[i]
    if (
      ta.id !== tb.id ||
      ta.title !== tb.title ||
      ta.url !== tb.url ||
      ta.isActive !== tb.isActive ||
      ta.isPinned !== tb.isPinned ||
      ta.isFavorite !== tb.isFavorite ||
      ta.favicon !== tb.favicon
    ) {
      return false
    }
  }
  return true
}

function isTab(value: unknown): value is Tab {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    typeof v.url === 'string' &&
    typeof v.title === 'string' &&
    typeof v.isActive === 'boolean'
  )
}

function isTabListResult(value: unknown): value is { success: boolean; tabs: Tab[] } {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (typeof v.success !== 'boolean') return false
  if (!Array.isArray(v.tabs)) return false
  return v.tabs.every(isTab)
}

function isTabsUpdatedPayload(value: unknown): value is { tabs: Tab[]; activeTabId: string | null } {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (!Array.isArray(v.tabs) || !v.tabs.every(isTab)) return false
  return v.activeTabId === null || typeof v.activeTabId === 'string'
}

export function useTabs() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const { settings } = useAppSettings()
  const lastRef = useRef<{ tabs: Tab[]; activeTabId: string | null } | null>(null)

  const fetchTabs = useCallback(async () => {
    if (!window.electronAPI) return
    try {
      const result = await window.electronAPI.invoke(IPC_CHANNELS.TAB.LIST)

      if (!isTabListResult(result)) {
        logger.warn('[useTabs] Invalid tab:list response', { result })
        setTabs([])
        setActiveTabId(null)
        return
      }

      const nextTabs = result.tabs
      const nextActive = nextTabs.find((t) => t.isActive)?.id ?? null

      const prev = lastRef.current
      if (!prev || prev.activeTabId !== nextActive || !areTabsEqual(prev.tabs, nextTabs)) {
        lastRef.current = { tabs: nextTabs, activeTabId: nextActive }
        setTabs(nextTabs)
        setActiveTabId(nextActive)
      }
    } catch (err) {
      logger.error('[useTabs] Failed to fetch tabs', err)
      setTabs([])
      setActiveTabId(null)
    }
  }, [])

  useEffect(() => {
    void fetchTabs()

    if (!window.electronAPI) return

    const handleTabsUpdated = (data: unknown) => {
      if (!isTabsUpdatedPayload(data)) {
        logger.warn('[useTabs] Received invalid tabs update', { data })
        return
      }

      const prev = lastRef.current
      if (!prev || prev.activeTabId !== data.activeTabId || !areTabsEqual(prev.tabs, data.tabs)) {
        lastRef.current = { tabs: data.tabs, activeTabId: data.activeTabId }
        setTabs(data.tabs)
        setActiveTabId(data.activeTabId)
      }
    }

    window.electronAPI.on(IPC_CHANNELS.TAB.UPDATED, handleTabsUpdated)

    return () => {
      window.electronAPI.off(IPC_CHANNELS.TAB.UPDATED, handleTabsUpdated)
    }
  }, [fetchTabs])

  const createTab = async (url?: string) => {
    const targetUrl = url || settings?.homepage || 'https://www.google.com'
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
    refresh: () => void fetchTabs(),
  }
}

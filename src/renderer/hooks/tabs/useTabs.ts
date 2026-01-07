import { useState, useEffect, useCallback } from 'react'
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

      setTabs(result.tabs)
      const active = result.tabs.find((t) => t.isActive)
      setActiveTabId(active ? active.id : null)
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

      setTabs(data.tabs)
      setActiveTabId(data.activeTabId)
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

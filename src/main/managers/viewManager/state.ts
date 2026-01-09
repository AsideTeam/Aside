import type { BrowserWindow, WebContents } from 'electron'

import type { TabData } from './types'

export type RecentlyClosedTab = {
  id: string
  url: string
  title: string
  timestamp: number
  isPinned: boolean
}

export type ViewManagerState = {
  tabs: Map<string, TabData>
  activeTabId: string | null
  contentWindow: BrowserWindow | null
  uiWebContents: WebContents | null
  isInitializing: boolean
  lastReorderTarget: 'ui' | 'content' | null
  externalActiveBounds: { x: number; y: number; width: number; height: number } | null
  recentlyClosed: RecentlyClosedTab[]
  settingsUnsubscribers: Array<() => void>
}

export const DEFAULT_MAX_RECENT_CLOSED = 10

export function createInitialViewManagerState(): ViewManagerState {
  return {
    tabs: new Map(),
    activeTabId: null,
    contentWindow: null,
    uiWebContents: null,
    isInitializing: false,
    lastReorderTarget: null,
    externalActiveBounds: null,
    recentlyClosed: [],
    settingsUnsubscribers: [],
  }
}

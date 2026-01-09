import type { WebContents } from 'electron'

import type { LoggerLike, TabData, TabSection } from './types'

export function getTabSection(tab: Pick<TabData, 'isPinned' | 'isFavorite'>): TabSection {
  if (tab.isFavorite) return 'icon'
  if (tab.isPinned) return 'space'
  return 'tab'
}

export function setPinned(args: { tabs: Map<string, TabData>; tabId: string; pinned: boolean; logger: LoggerLike }): void {
  const { tabs, tabId, pinned, logger } = args
  const tab = tabs.get(tabId)
  if (!tab) {
    logger.warn('[ViewManager] Tab not found for pin', { tabId })
    return
  }

  tab.isPinned = pinned
  if (pinned) {
    tab.isFavorite = false
  }
  logger.info('[ViewManager] Tab pin status changed', { tabId, pinned })
}

export function moveTabToSection(args: {
  tabs: Map<string, TabData>
  tabId: string
  targetType: TabSection
  logger: LoggerLike
}): void {
  const { tabs, tabId, targetType, logger } = args
  const tab = tabs.get(tabId)
  if (!tab) {
    logger.warn('[ViewManager] Tab not found for move-section', { tabId })
    return
  }

  const previousType = getTabSection(tab)

  switch (targetType) {
    case 'icon':
      tab.isFavorite = true
      tab.isPinned = false
      logger.info('[ViewManager] Tab moved to icon section', { tabId, previousType })
      break
    case 'space':
      tab.isFavorite = false
      tab.isPinned = true
      logger.info('[ViewManager] Tab moved to space section', { tabId, previousType })
      break
    case 'tab':
      tab.isFavorite = false
      tab.isPinned = false
      logger.info('[ViewManager] Tab moved to tab section', { tabId, previousType })
      break
  }
}

export function reorderTab(args: {
  tabs: Map<string, TabData>
  tabId: string
  targetId: string
  logger: LoggerLike
}): void {
  const { tabs, tabId, targetId, logger } = args
  const allTabs = Array.from(tabs.entries())
  const fromIndex = allTabs.findIndex(([id]) => id === tabId)
  const toIndex = allTabs.findIndex(([id]) => id === targetId)

  if (fromIndex === -1 || toIndex === -1) {
    logger.warn('[ViewManager] Invalid tab IDs for reorder', { tabId, targetId })
    return
  }

  const [movedTab] = allTabs.splice(fromIndex, 1)
  allTabs.splice(toIndex, 0, movedTab)

  tabs.clear()
  allTabs.forEach(([id, data]) => {
    tabs.set(id, data)
  })

  logger.info('[ViewManager] Tab reordered', { tabId, targetId, fromIndex, toIndex })
}

export function reorderTabWithinSection(args: {
  tabs: Map<string, TabData>
  tabId: string
  position: number
  logger: LoggerLike
}): void {
  const { tabs, tabId, position, logger } = args
  const tab = tabs.get(tabId)
  if (!tab) {
    logger.warn('[ViewManager] Tab not found for reorder', { tabId })
    return
  }

  const section = getTabSection(tab)

  const sectionTabs = Array.from(tabs.entries()).filter(([, data]) => {
    return getTabSection(data) === section
  })

  const currentIndex = sectionTabs.findIndex(([id]) => id === tabId)
  if (currentIndex === -1 || position < 0 || position >= sectionTabs.length) {
    logger.warn('[ViewManager] Invalid position for reorder', {
      tabId,
      position,
      sectionLength: sectionTabs.length,
    })
    return
  }

  const [movedEntry] = sectionTabs.splice(currentIndex, 1)
  sectionTabs.splice(position, 0, movedEntry)

  const allTabs = Array.from(tabs.entries())
  const newTabs: Array<[string, TabData]> = []

  const iconTabs = allTabs.filter(([, data]) => getTabSection(data) === 'icon')
  const spaceTabs = allTabs.filter(([, data]) => getTabSection(data) === 'space')
  const normalTabs = allTabs.filter(([, data]) => getTabSection(data) === 'tab')

  switch (section) {
    case 'icon':
      newTabs.push(...sectionTabs)
      newTabs.push(...spaceTabs)
      newTabs.push(...normalTabs)
      break
    case 'space':
      newTabs.push(...iconTabs)
      newTabs.push(...sectionTabs)
      newTabs.push(...normalTabs)
      break
    case 'tab':
      newTabs.push(...iconTabs)
      newTabs.push(...spaceTabs)
      newTabs.push(...sectionTabs)
      break
  }

  tabs.clear()
  newTabs.forEach(([id, data]) => {
    tabs.set(id, data)
  })

  logger.info('[ViewManager] Tab reordered within section', { tabId, position, currentIndex })
}

export function getTabsSnapshot(tabs: Map<string, TabData>): Array<Omit<TabData, 'view'>> {
  return Array.from(tabs.values()).map(({ id, url, title, isActive, isPinned, isFavorite, favicon }) => ({
    id,
    url,
    title,
    isActive,
    isPinned,
    isFavorite,
    favicon,
  }))
}

export function syncTabsToRenderer(args: {
  uiWebContents: WebContents | null
  tabs: Map<string, TabData>
  activeTabId: string | null
  logger: LoggerLike
}): void {
  const { uiWebContents, tabs, activeTabId, logger } = args
  if (!uiWebContents) return

  const state = {
    tabs: getTabsSnapshot(tabs),
    activeTabId,
  }

  try {
    uiWebContents.send('tabs:updated', state)
    logger.info('[ViewManager] Synced to renderer', { tabCount: state.tabs.length })
  } catch (error) {
    logger.error('[ViewManager] Failed to sync to renderer:', error)
  }
}

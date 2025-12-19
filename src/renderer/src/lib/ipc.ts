/**
 * IPC 호출 래퍼 (타입 안전성)
 */

export const ipc = {
  tab: {
    create: (url: string) => window.electronAPI.createTab(url),
    close: (tabId: string) => window.electronAPI.closeTab(tabId),
    switch: (tabId: string) => window.electronAPI.switchTab(tabId),
    updateUrl: (tabId: string, url: string) =>
      window.electronAPI.updateTabUrl(tabId, url),
  },
  nav: {
    navigate: (url: string) => window.electronAPI.navigate(url),
    back: () => window.electronAPI.goBack(),
    forward: () => window.electronAPI.goForward(),
    reload: () => window.electronAPI.reload(),
  },
  sidebar: {
    toggle: (expanded: boolean) => window.electronAPI.toggleSidebar(expanded),
  },
}

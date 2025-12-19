import { BrowserWindow, ipcMain } from 'electron'
import crypto from 'crypto'
import { ViewManager } from '@main/managers/view-manager'
import { createLogger } from '@main/utils/logger'

const logger = createLogger('ipc-handlers')

/**
 * 모든 IPC 핸들러 등록
 */
export function setupIPCHandlers(mainWindow: BrowserWindow, viewManager: ViewManager): void {
  logger.info('Setting up IPC handlers')

  // ===== Tab Handlers =====

  ipcMain.handle('tab:create', async (_event, url: string) => {
    logger.info('IPC: tab:create', { url })
    try {
      const tabId = crypto.randomUUID()
      viewManager.createTab(tabId, url, 'New Tab')
      return { success: true, data: { tabId } }
    } catch (error) {
      logger.error('Error creating tab', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('tab:close', async (_event, tabId: string) => {
    logger.info('IPC: tab:close', { tabId })
    try {
      viewManager.closeTab(tabId)
      return { success: true }
    } catch (error) {
      logger.error('Error closing tab', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('tab:switch', async (_event, tabId: string) => {
    logger.info('IPC: tab:switch', { tabId })
    try {
      viewManager.switchTab(tabId)
      return { success: true }
    } catch (error) {
      logger.error('Error switching tab', error)
      return { success: false, error: String(error) }
    }
  })

  // ===== Navigation Handlers =====

  ipcMain.handle('nav:navigate', async (_event, url: string) => {
    logger.info('IPC: nav:navigate', { url })
    try {
      const tab = viewManager.getActiveTab()
      if (!tab) {
        return { success: false, error: 'No active tab' }
      }
      tab.view.webContents.loadURL(url)
      return { success: true }
    } catch (error) {
      logger.error('Error navigating', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('nav:back', async () => {
    logger.info('IPC: nav:back')
    try {
      const tab = viewManager.getActiveTab()
      if (tab && tab.view.webContents.canGoBack()) {
        tab.view.webContents.goBack()
        return { success: true }
      }
      return { success: false, error: 'Cannot go back' }
    } catch (error) {
      logger.error('Error going back', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('nav:forward', async () => {
    logger.info('IPC: nav:forward')
    try {
      const tab = viewManager.getActiveTab()
      if (tab && tab.view.webContents.canGoForward()) {
        tab.view.webContents.goForward()
        return { success: true }
      }
      return { success: false, error: 'Cannot go forward' }
    } catch (error) {
      logger.error('Error going forward', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('nav:reload', async () => {
    logger.info('IPC: nav:reload')
    try {
      const tab = viewManager.getActiveTab()
      if (tab) {
        tab.view.webContents.reload()
        return { success: true }
      }
      return { success: false, error: 'No active tab' }
    } catch (error) {
      logger.error('Error reloading', error)
      return { success: false, error: String(error) }
    }
  })

  // ===== Sidebar Handlers =====

  ipcMain.handle('sidebar:toggle', async (_event, expanded: boolean) => {
    logger.info('IPC: sidebar:toggle', { expanded })
    try {
      viewManager.toggleSidebar(expanded)
      return { success: true }
    } catch (error) {
      logger.error('Error toggling sidebar', error)
      return { success: false, error: String(error) }
    }
  })

  logger.info('✓ All IPC handlers registered')
}
